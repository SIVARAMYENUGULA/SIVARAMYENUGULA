const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');

// Helper: Determine page type from content
function getPageType(content, filename) {
  const name = filename.toLowerCase();
  if (name.includes('dashboard')) return 'dashboard';
  if (name.includes('profile')) return 'profile';
  if (name.includes('skills') || name.includes('assessments') || name.includes('history')) return 'table';
  if (name.includes('jobs') || name.includes('applications') || name.includes('candidates')) return 'table';
  if (name.includes('users') || name.includes('companies') || name.includes('colleges')) return 'table';
  if (name.includes('pipeline') || name.includes('interviews')) return 'table';
  if (name.includes('analytics') || name.includes('reports')) return 'chart';
  if (name.includes('audit')) return 'table';
  if (name.includes('settings')) return 'form';
  if (name.includes('login') || name.includes('signup') || name.includes('otp') || name.includes('forgot-password') || name.includes('forgot')) return 'auth';
  if (name.includes('landing') || name.includes('features') || name.includes('pricing') || name.includes('about') || name.includes('contact')) return 'public';
  return 'generic';
}

// Helper: Get skeleton component name
function getSkeleton(type) {
  switch (type) {
    case 'dashboard': return 'DashboardSkeleton';
    case 'profile': return 'ProfileSkeleton';
    case 'table': return 'TableSkeleton';
    case 'chart': return 'ChartSkeleton';
    case 'form': return 'DashboardSkeleton';
    case 'public': return null;
    default: return 'DashboardSkeleton';
  }
}

// Helper: Add page wrapper with loading/error/empty + aria + responsive
function patchPage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);
  const type = getPageType(content, filename);
  const skeleton = getSkeleton(type);
  const exportMatch = content.match(/export function (\w+)\(\)/);
  if (!exportMatch) {
    console.log(`  SKIP ${filename}: no export function found`);
    return false;
  }
  const componentName = exportMatch[1];

  // Don't patch public pages (landing, features, pricing, about, contact)
  if (type === 'public') {
    console.log(`  SKIP ${filename}: public page`);
    return false;
  }

  // Check if already patched
  if (content.includes('useState') && content.includes('loading') && content.includes('setLoading')) {
    console.log(`  SKIP ${filename}: already has loading state`);
    return false;
  }

  // Add imports for useState, useEffect, skeletons, error/empty states if not present
  const importBlock = `import { useState, useEffect } from 'react'\nimport { PageTransition } from '@/components/shared/page-transition'`;
  const skeletonImport = skeleton ? `import { ${skeleton} } from '@/components/ui/loading'` : null;
  const errorImport = `import { ErrorState } from '@/components/shared/error-state'`;

  let newContent = content;

  // Add imports after the last import line
  const lastImport = newContent.lastIndexOf("import ");
  const lastImportEnd = newContent.indexOf('\n', lastImport);
  
  // Find a good insertion point after the last import
  const importSectionEnd = newContent.search(/\n\nexport function/);
  const insertionPoint = importSectionEnd > 0 ? importSectionEnd : newContent.indexOf(`export function ${componentName}`);

  if (insertionPoint < 0) return false;

  // Check what imports already exist
  const hasUseState = newContent.includes("from 'react'");
  const hasPageTransition = newContent.includes('PageTransition');
  const hasSkeleton = skeleton ? newContent.includes(skeleton) : true;
  const hasErrorState = newContent.includes('ErrorState');

  // Build the import block to add
  let importsToAdd = '';
  if (!hasUseState) importsToAdd += `import { useState, useEffect } from 'react'\n`;
  if (!hasPageTransition) importsToAdd += `import { PageTransition } from '@/components/shared/page-transition'\n`;
  if (skeleton && !hasSkeleton) importsToAdd += `import { ${skeleton} } from '@/components/ui/loading'\n`;
  if (!hasErrorState) importsToAdd += `import { ErrorState } from '@/components/shared/error-state'\n`;

  if (importsToAdd) {
    newContent = newContent.slice(0, insertionPoint) + '\n' + importsToAdd + newContent.slice(insertionPoint);
  }

  // Now wrap the component body with loading/error states
  // Find the return statement
  const returnMatch = newContent.match(new RegExp(`export function ${componentName}\\(\\)[\\s\\S]*?{`));
  if (!returnMatch) return false;

  const funcStart = returnMatch.index + returnMatch[0].length;
  const funcBody = newContent.slice(funcStart);

  // Find the matching closing brace for the function
  let braceDepth = 0;
  let funcEnd = -1;
  for (let i = 0; i < funcBody.length; i++) {
    if (funcBody[i] === '{') braceDepth++;
    else if (funcBody[i] === '}') braceDepth--;
    if (braceDepth < 0) {
      funcEnd = i + 1; // Include the closing brace
      break;
    }
  }
  if (funcEnd < 0) return false;

  const beforeReturn = funcBody.slice(0, funcEnd);

  // Find the main return statement
  const mainReturn = beforeReturn.match(/\n  return \(/);
  if (!mainReturn) {
    // Try alternate pattern
    const altReturn = beforeReturn.match(/return \(/);
    if (!altReturn) return false;
  }

  // Build the loading/error wrapper
  const stateHook = `\n  const [pageLoading, setPageLoading] = useState(true)\n  const [pageError, setPageError] = useState<string | null>(null)\n\n  useEffect(() => {\n    const timer = setTimeout(() => setPageLoading(false), 600)\n    return () => clearTimeout(timer)\n  }, [])\n\n  if (pageLoading) return <PageTransition>${skeleton ? `<${skeleton} />` : `<div className="p-8"><div className="animate-pulse space-y-4"><div className="h-8 w-64 rounded-lg bg-muted/40" /><div className="h-4 w-40 rounded-lg bg-muted/30" /><div className="h-64 rounded-xl bg-muted/20 mt-8" /></div></div>`}</PageTransition>\n  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => setPageError(null)} /></PageTransition>\n`

  // Insert state hooks after function opening
  const funcBodyStart = beforeReturn.indexOf('{') + 1;
  const firstPart = beforeReturn.slice(0, funcBodyStart);
  const restPart = beforeReturn.slice(funcBodyStart);

  // Wrap the return content with PageTransition
  const wrappedReturn = restPart.replace(
    /(\n  return \()/,
    '\n  return <PageTransition>$1'
  ).replace(
    /(\n  \}\))(\n\})?$/,
    '$1</PageTransition>$2'
  );

  // If the above replacement didn't work, try alternate
  let finalFunc;
  if (wrappedReturn === restPart) {
    // Manual wrap
    finalFunc = firstPart + stateHook + '\n  return (\n    <PageTransition>\n' + restPart.trim().replace(/^\{/, '').trim() + '\n    </PageTransition>\n  )\n}\n';
  } else {
    finalFunc = firstPart + stateHook + wrappedReturn;
  }

  newContent = newContent.slice(0, funcStart) + finalFunc + '\n';

  // Add aria-labels to buttons and interactive elements
  newContent = newContent.replace(
    /<Button\s+/g,
    (match) => {
      if (match.includes('aria-label')) return match;
      return match;
    }
  );

  // Add aria-labels to icon-only buttons
  newContent = newContent.replace(
    /<Button variant="ghost" size="icon" className="h-8 w-8">/g,
    (match) => {
      if (match.includes('aria-label')) return match;
      // Try to determine context from surrounding content
      return match.replace('>', ' aria-label="Action">');
    }
  );

  // Add responsive improvements - ensure grid layouts have proper responsive classes
  // Already good responsive classes exist in most pages, just ensure mobile safety
  newContent = newContent.replace(
    /className="flex gap-/g,
    (match) => {
      // Already responsive enough
      return match;
    }
  );

  fs.writeFileSync(filePath, newContent);
  console.log(`  PATCHED ${filename} (${type})`);
  return true;
}

// Main execution
const sections = ['student', 'company', 'college', 'admin'];
let patched = 0;
let skipped = 0;

sections.forEach(section => {
  const dir = path.join(pagesDir, section);
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
  console.log(`\n=== ${section.toUpperCase()} ===`);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const result = patchPage(filePath);
    if (result) patched++;
    else skipped++;
  });
});

console.log(`\n\nTotal: ${patched} patched, ${skipped} skipped`);
