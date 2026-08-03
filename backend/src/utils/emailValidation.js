/**
 * Email Validation Utilities
 * Shared between email.service.js and audit/test scripts.
 */

const dns = require('dns').promises;

/**
 * DNS_RESOLVE_TIMEOUT: Maximum time (in ms) to wait for a DNS resolution
 * before treating it as a DNS infrastructure failure.
 * Prevents API endpoints from hanging indefinitely when DNS is unreachable
 * (common on Windows VPNs, corporate networks, or misconfigured resolvers).
 *
 * Current value: 3000ms (3 seconds) — fast enough to not block API requests,
 * long enough for legitimate DNS lookups.
 */
const DNS_RESOLVE_TIMEOUT = 3000;

/**
 * DNS Health Cache
 * ================
 * Once we determine that DNS infrastructure is broken (canary domains fail),
 * we cache that result so that subsequent email sends don't waste 3+ seconds
 * on DNS timeouts for every single recipient.
 *
 * The cache expires after DNS_CACHE_TTL_MS (default: 5 minutes) so that
 * we periodically retry in case DNS comes back online.
 */
const DNS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _dnsHealthyCache = null; // true, false, or null (unknown)
let _dnsCacheTimestamp = 0;

/**
 * Get cached DNS health status.
 * Returns null if cache is expired or not yet populated.
 */
function getDnsHealthCache() {
  if (_dnsHealthyCache === null) return null;
  if (Date.now() - _dnsCacheTimestamp > DNS_CACHE_TTL_MS) return null; // Expired
  return _dnsHealthyCache;
}

/**
 * Set the DNS health cache.
 */
function setDnsHealthCache(healthy) {
  _dnsHealthyCache = healthy;
  _dnsCacheTimestamp = Date.now();
}

/**
 * Wraps a DNS promise with a timeout so that slow/unreachable DNS servers
 * do not cause the calling API endpoint to hang indefinitely.
 *
 * @param {Promise} dnsPromise - The DNS operation promise (e.g. dns.resolveMx, dns.resolve4)
 * @param {string} domain - Domain being resolved (for error context)
 * @param {number} timeoutMs - Timeout in milliseconds (default: DNS_RESOLVE_TIMEOUT)
 * @returns {Promise} - Resolves with the DNS result or throws a timeout error
 */
async function dnsResolveWithTimeout(dnsPromise, domain, timeoutMs) {
  if (!timeoutMs) timeoutMs = DNS_RESOLVE_TIMEOUT;
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('DNS resolution timed out for "' + domain + '" after ' + timeoutMs + 'ms');
      err.code = 'ETIMEOUT';
      err.domain = domain;
      reject(err);
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([dnsPromise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Extract domain from an email address.
 */
function extractDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Validate email format using a simple RFC 5322-aligned regex.
 */
function isValidEmailFormat(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Known fake/test email domains that cannot receive real email.
 */
const FAKE_DOMAINS = [
  'test.com', 'example.com', 'example.org', 'example.net',
  'test.test', 'fake.com', 'dummy.com', 'college.edu', 'placemux.com',
  'techcorp.com', 'domain.com', 'mailinator.com', 'yopmail.com',
];

/**
 * Known-good domains used as a "canary" to distinguish DNS infrastructure failures
 * from genuine domain-not-found errors. If the canary also fails DNS resolution,
 * the DNS server itself is unreachable — not the target domain.
 */
const CANARY_DOMAINS = ['google.com', 'cloudflare.com'];

/**
 * Perform a canary DNS check to determine if the DNS infrastructure itself is broken.
 * Resolves known-good domains via A record lookup.
 *
 * @returns {boolean} true if DNS infrastructure appears healthy, false if broken.
 */
async function isDnsInfrastructureHealthy() {
  // Check cache first
  const cached = getDnsHealthCache();
  if (cached !== null) {
    return cached;
  }

  for (const canary of CANARY_DOMAINS) {
    try {
      await dnsResolveWithTimeout(dns.resolve4(canary), canary, DNS_RESOLVE_TIMEOUT);
      setDnsHealthCache(true);
      return true; // At least one canary resolved — DNS is working.
    } catch {
      // Try next canary
    }
  }

  // All canaries failed — DNS infrastructure is likely broken.
  setDnsHealthCache(false);
  return false;
}

/**
 * Check if a domain has MX records (can receive email).
 *
 * Distinguishes between:
 * - DNS infrastructure failures (ECONNREFUSED, ETIMEOUT, EAI_AGAIN, or ENOTFOUND
 *   on a healthy canary domain): DNS server unreachable — we CANNOT validate.
 *   Assume valid, let SMTP decide.
 * - Domain validation failures (ENODATA, or ENOTFOUND on a healthy DNS):
 *   The domain genuinely has no mail service. Mark as invalid.
 *
 * Uses a canary DNS check to avoid incorrectly treating DNS infrastructure
 * failures (common on Windows when DNS server is unreachable) as domain
 * validation failures.
 */
async function checkDomainMx(domain) {
  try {
    const mxRecords = await dnsResolveWithTimeout(dns.resolveMx(domain), domain);
    mxRecords.sort((a, b) => a.priority - b.priority);
    return {
      hasMx: mxRecords.length > 0,
      mxRecords: mxRecords.map(m => m.priority + ' ' + m.exchange),
      error: null,
    };
  } catch (err) {
    // DNS infrastructure failures — DNS server unreachable or not responding.
    // This is a transient environment issue, NOT a domain validation failure.
    // Return hasMx:true so the email is NOT blocked. SMTP will make the final call.
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEOUT' || err.code === 'EAI_AGAIN') {
      return {
        hasMx: true,
        mxRecords: [],
        error: null,
        dnsFailure: true,
      };
    }

    // ENOTFOUND is ambiguous:
    // - On healthy DNS: the domain genuinely does not exist → block.
    // - On broken DNS (common on Windows): DNS server unreachable returns
    //   ENOTFOUND instead of ECONNREFUSED → allow through.
    // Use a canary check to disambiguate.
    if (err.code === 'ENOTFOUND') {
      const dnsHealthy = await isDnsInfrastructureHealthy();
      if (!dnsHealthy) {
        return {
          hasMx: true,
          mxRecords: [],
          error: null,
          dnsFailure: true,
        };
      }
      // DNS is healthy but this domain wasn't found — legitimate rejection.
      return { hasMx: false, mxRecords: [], error: 'Domain has no mail servers (' + err.code + ')' };
    }

    // ENODATA means the domain resolved but has no MX records — legitimate block.
    if (err.code === 'ENODATA') {
      return { hasMx: false, mxRecords: [], error: 'Domain has no mail servers (' + err.code + ')' };
    }

    // ESERVFAIL means the DNS server couldn't reach the authoritative server.
    // This can be transient. Use canary check to disambiguate.
    if (err.code === 'ESERVFAIL') {
      const dnsHealthy = await isDnsInfrastructureHealthy();
      if (!dnsHealthy) {
        return {
          hasMx: true,
          mxRecords: [],
          error: null,
          dnsFailure: true,
        };
      }
      // DNS is healthy but this specific domain failed — likely genuine.
      return { hasMx: false, mxRecords: [], error: 'Domain has no mail servers (' + err.code + ')' };
    }

    // Unknown/unexpected DNS errors — conservatively assume valid to avoid blocking legitimate email.
    return {
      hasMx: true,
      mxRecords: [],
      error: null,
      dnsFailure: true,
    };
  }
}

/**
 * Verify recipient email:
 * 1. Check format
 * 2. Check for known fake domains (fast fail)
 * 3. Check domain MX records
 *
 * Returns { valid, status, details }
 */
async function verifyRecipient(email) {
  // Step 1: Format check
  if (!isValidEmailFormat(email)) {
    return { valid: false, status: 'INVALID', details: 'Malformed email address: "' + email + '"' };
  }

  const domain = extractDomain(email);
  if (!domain) {
    return { valid: false, status: 'INVALID', details: 'Cannot extract domain from: "' + email + '"' };
  }

  // Step 2: Check for known fake domains (fast, no DNS needed)
  if (FAKE_DOMAINS.includes(domain)) {
    return { valid: false, status: 'INVALID', details: 'Domain "' + domain + '" is a known fake/test domain — no mail delivery possible' };
  }

  // Step 3: DNS MX record check
  const mxResult = await checkDomainMx(domain);

  // DNS infrastructure failure — DNS server unreachable.
  // This is NOT a domain validation failure. Log warning, but allow the email through.
  if (mxResult.dnsFailure) {
    console.warn('[EmailValidation] DNS unavailable — cannot verify MX for "' + domain + '". Assuming valid, will let SMTP decide.');
    return {
      valid: true,
      status: 'VALID',
      details: 'DNS server unreachable — MX validation skipped for "' + domain + '". Passing through to SMTP.',
    };
  }

  if (!mxResult.hasMx) {
    return {
      valid: false,
      status: 'INVALID',
      details: mxResult.error
        ? 'Domain "' + domain + '" \u2014 ' + mxResult.error
        : 'Domain "' + domain + '" has no MX records \u2014 email will bounce',
    };
  }

  return {
    valid: true,
    status: 'VALID',
    details: 'Domain "' + domain + '" has MX records: ' + mxResult.mxRecords.join(', '),
  };
}

/**
 * Validate recipient and return PASS/FAIL string.
 */
async function validateRecipient(email) {
  const result = await verifyRecipient(email);
  return result.valid ? 'PASS' : 'FAIL';
}

// Delivery status constants
const DELIVERY_STATUS = {
  SMTP_ACCEPTED: 'SMTP_ACCEPTED',
  DELIVERED: 'DELIVERED',
  BOUNCED: 'BOUNCED',
  INVALID: 'INVALID',
  UNKNOWN: 'UNKNOWN',
};

module.exports = {
  extractDomain,
  isValidEmailFormat,
  FAKE_DOMAINS,
  checkDomainMx,
  verifyRecipient,
  validateRecipient,
  DELIVERY_STATUS,
};
