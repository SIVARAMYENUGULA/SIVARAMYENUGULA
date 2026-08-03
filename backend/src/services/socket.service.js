const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const { createAuditLog } = require('../controllers/auditLog.controller');

// Track active proctoring sessions
const activeProctoringSessions = new Map();
const proctorMonitors = new Map(); // Admin monitors watching sessions

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const role = socket.handshake.auth?.role;
      const token = socket.handshake.auth?.token;

      // Phone pairing connections use a secure pairing token (not JWT).
      // Authentication is handled by validating the pairing code+token pair
      // in the 'phone:pair-request' handler, not via JWT.
      if (role === 'phone') {
        socket.user = { role: 'phone', _id: null, email: 'phone@pairing' };
        return next();
      }

      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.sub);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] User connected: ${socket.user.email} (${socket.id})`);

    // Join proctoring session as student
    socket.on('join:proctoring', ({ sessionId, assessmentId }) => {
      const room = `proctoring:${sessionId}`;
      console.log('[Socket.IO] [join:proctoring] EVENT RECEIVED');
      console.log('[Socket.IO] [join:proctoring] sessionId:', sessionId);
      console.log('[Socket.IO] [join:proctoring] assessmentId:', assessmentId);
      console.log('[Socket.IO] [join:proctoring] socket.user:', socket.user?.email);
      
      socket.join(room);
      socket.data.sessionId = sessionId;
      socket.data.role = 'student';

      const exists = activeProctoringSessions.has(sessionId);
      console.log('[Socket.IO] [join:proctoring] Session already in map:', exists);
      
      if (!exists) {
        const sessionData = {
          sessionId,
          studentId: socket.user._id,
          studentEmail: socket.user.email,
          assessmentId: assessmentId || null,
          connectedAt: new Date(),
          events: [],
          phoneConnected: false,
          riskScore: 100,
          riskLevel: 'low',
        };
        activeProctoringSessions.set(sessionId, sessionData);
        console.log('[Socket.IO] [join:proctoring] Session CREATED in map:', JSON.stringify({
          sessionId: sessionData.sessionId,
          studentEmail: sessionData.studentEmail,
          phoneConnected: sessionData.phoneConnected
        }, null, 2));
      }

      console.log(`[Socket.IO] Student joined proctoring room: ${room}`);
    });

    // Monitor a proctoring session (admin)
    socket.on('monitor:proctoring', ({ sessionId }) => {
      if (socket.user.role !== 'admin') return;
      const room = `proctoring:${sessionId}`;
      socket.join(room);
      socket.data.sessionId = sessionId;
      socket.data.role = 'monitor';

      if (!proctorMonitors.has(sessionId)) {
        proctorMonitors.set(sessionId, new Set());
      }
      proctorMonitors.get(sessionId).add(socket.id);

      // Send current session state to monitor
      const session = activeProctoringSessions.get(sessionId);
      if (session) {
        socket.emit('proctoring:state', session);
      }

      console.log(`[Socket.IO] Admin monitoring proctoring room: ${room}`);
    });

    // Proctoring event from student
    socket.on('proctoring:event', (data) => {
      const { sessionId, eventType, severity, details, metadata } = data;
      const room = `proctoring:${sessionId}`;

      // Update session state
      const session = activeProctoringSessions.get(sessionId);
      if (session) {
        session.events.push({
          type: eventType,
          severity,
          details,
          metadata,
          timestamp: new Date(),
        });

        // Update risk score in real-time
        const riskDelta = getRiskDelta(eventType, severity);
        session.riskScore = (session.riskScore || 100) - riskDelta;
        session.riskScore = Math.max(0, Math.min(100, session.riskScore));
        
        // Risk level classification
        let riskLevel = 'low';
        if (session.riskScore < 80) riskLevel = 'medium';
        if (session.riskScore < 60) riskLevel = 'high';
        if (session.riskScore < 30) riskLevel = 'critical';
        
        session.riskLevel = riskLevel;
        
        // Emit risk update to monitors
        io.to(room).emit('proctoring:risk-update', {
          sessionId,
          riskScore: session.riskScore,
          riskLevel,
          lastEvent: { eventType, severity, details, timestamp: new Date() },
        });

        // Auto-flag critical events
        if (riskLevel === 'critical' || severity === 'critical') {
          io.to(room).emit('proctoring:critical-alert', {
            sessionId,
            riskScore: session.riskScore,
            riskLevel,
            event: { eventType, details, timestamp: new Date() },
          });
        }
      }

      // Broadcast to monitors
      io.to(room).emit('proctoring:event', {
        sessionId,
        eventType,
        severity,
        details,
        metadata,
        timestamp: new Date(),
      });

      // Persist to database asynchronously
      try {
        const { ProctoringEvent } = require('../models');
        const sessionData = activeProctoringSessions.get(sessionId);
        if (sessionData && sessionData.studentId) {
          ProctoringEvent.create({
            sessionId,
            studentId: sessionData.studentId,
            assessmentId: sessionData.assessmentId || undefined,
            eventType,
            severity: severity || 'info',
            details,
            metadata,
            ipAddress: socket.handshake?.address || '',
            timestamp: new Date(),
          }).catch(err => console.error('[Socket] Failed to persist proctoring event:', err.message));
        }
      } catch (err) {
        console.error('[Socket] Error persisting event:', err.message);
      }
    });

    // Register pairing code from student browser (initializes pairing)
    socket.on('pairing:init', ({ sessionId, pairingCode, secureToken }) => {
      console.log('[Socket.IO] [pairing:init] === PAIRING INIT RECEIVED ===');
      console.log('[Socket.IO] [pairing:init] REQUEST:', JSON.stringify({ sessionId, pairingCode, secureToken }, null, 2));
      
      let session = activeProctoringSessions.get(sessionId);
      console.log('[Socket.IO] [pairing:init] Session exists in map:', !!session);
      
      // Auto-create session if join:proctoring hasn't been called yet (defensive)
      if (!session) {
        console.log('[Socket.IO] [pairing:init] Auto-creating session (join:proctoring was missed)');
        session = {
          sessionId,
          studentId: socket.user?._id || null,
          studentEmail: socket.user?.email || 'phone@pairing',
          assessmentId: null,
          connectedAt: new Date(),
          events: [],
          phoneConnected: false,
          riskScore: 100,
          riskLevel: 'low',
        };
        activeProctoringSessions.set(sessionId, session);
        socket.join(`proctoring:${sessionId}`);
        socket.data.sessionId = sessionId;
        socket.data.role = 'student';
      }
      
      // Store the pairing values
      session.pairingCode = pairingCode;
      session.pairingToken = secureToken;
      session.pairingRegisteredAt = new Date();
      
      console.log('[Socket.IO] [pairing:init] DATABASE (after store):', JSON.stringify({
        sessionId: session.sessionId,
        pairingCode: session.pairingCode,
        pairingToken: session.pairingToken,
        studentEmail: session.studentEmail
      }, null, 2));
      console.log('[Socket.IO] [pairing:init] === PAIRING INIT COMPLETE ===');
    });

    // Phone pairing request (from actual mobile device)
    socket.on('phone:pair-request', ({ sessionId, pairingCode, secureToken }) => {
      const room = `proctoring:${sessionId}`;
      
      console.log('[Socket.IO] [phone:pair-request] === PAIRING VALIDATION ===');
      console.log('[Socket.IO] [phone:pair-request] REQUEST:', JSON.stringify({
        sessionId,
        pairingCode,
        secureToken
      }, null, 2));
      
      const session = activeProctoringSessions.get(sessionId);
      
      if (!session) {
        console.log('[Socket.IO] [phone:pair-request] DATABASE: null (session not found)');
        console.log('[Socket.IO] [phone:pair-request] COMPARISON: Session missing — cannot validate');
        console.log('[Socket.IO] [phone:pair-request] RESULT: Session not found');
        socket.emit('phone:pair-error', { message: 'Session not found' });
        return;
      }
      
      console.log('[Socket.IO] [phone:pair-request] DATABASE:', JSON.stringify({
        sessionId: session.sessionId,
        pairingCode: session.pairingCode,
        pairingToken: session.pairingToken,
        studentEmail: session.studentEmail,
        registeredAt: session.pairingRegisteredAt,
        phoneConnected: session.phoneConnected
      }, null, 2));
      
      const codeMatch = session.pairingCode === pairingCode;
      const tokenMatch = session.pairingToken === secureToken;
      
      console.log('[Socket.IO] [phone:pair-request] COMPARISON:', JSON.stringify({
        'sessionId.match': session.sessionId === sessionId,
        'code.expected': pairingCode,
        'code.stored': session.pairingCode,
        'code.match': codeMatch,
        'token.expected': secureToken,
        'token.stored': session.pairingToken,
        'token.match': tokenMatch,
        'overall.match': codeMatch && tokenMatch
      }, null, 2));
      
      // Validate pairing code matches
      if (!codeMatch || !tokenMatch) {
        console.log('[Socket.IO] [phone:pair-request] RESULT: Invalid pairing code — MISMATCH');
        console.log('[Socket.IO] [phone:pair-request] FAILED AT: socket.emit(phone:pair-error) — see COMPARISON block above for exact mismatch');
        socket.emit('phone:pair-error', { message: 'Invalid pairing code' });
        return;
      }
      
      console.log('[Socket.IO] [phone:pair-request] RESULT: VALID — proceeding with pairing');
      
      // Join phone to proctoring room
      socket.join(room);
      socket.data.sessionId = sessionId;
      socket.data.role = 'phone';
      
      // Notify student of successful pairing
      console.log('[Socket.IO] [phone:paired] === PHONE PAIRED SUCCESSFULLY ===');
      console.log('[Socket.IO] [phone:paired] sessionId:', sessionId);
      console.log('[Socket.IO] [phone:paired] Emitting phone:paired to room:', room);
      io.to(room).emit('phone:paired', { sessionId });
      
      // Update session
      session.phoneConnected = true;
      session.phoneSocketId = socket.id;
      session.phonePairedAt = new Date();
      session.pairingCode = null; // Clear pairing code after use
      session.pairingToken = null;
      
      console.log('[Socket.IO] [phone:paired] Session updated — phoneConnected=true, pairingCode=null');
      console.log('[Socket.IO] [phone:paired] === PAIRING COMPLETE ===');
    });

    // Phone disconnect handling
    socket.on('phone:disconnect', ({ sessionId }) => {
      const session = activeProctoringSessions.get(sessionId);
      if (session) {
        session.phoneConnected = false;
        io.to(`proctoring:${sessionId}`).emit('phone:disconnected', { sessionId });
      }
    });

    // WebRTC heartbeat for connection health monitoring
    socket.on('webrtc:heartbeat', ({ sessionId, timestamp }) => {
      const session = activeProctoringSessions.get(sessionId);
      if (session) {
        session.lastHeartbeat = timestamp;
        session.heartbeatCount = (session.heartbeatCount || 0) + 1;
        
        // Calculate latency
        const latency = Date.now() - timestamp;
        
        // Emit health status to monitors
        io.to(`proctoring:${sessionId}`).emit('webrtc:health', {
          sessionId,
          latency,
          timestamp: Date.now(),
        });
      }
    });

    // Browser monitoring events
    socket.on('browser:monitor', ({ sessionId, eventType, details }) => {
      const room = `proctoring:${sessionId}`;
      io.to(room).emit('browser:event', {
        sessionId,
        eventType,
        details,
        timestamp: new Date(),
      });
    });



    // WebRTC signaling
    socket.on('webrtc:offer', ({ sessionId, offer }) => {
      socket.to(`proctoring:${sessionId}`).emit('webrtc:offer', { offer });
    });

    socket.on('webrtc:answer', ({ sessionId, answer }) => {
      socket.to(`proctoring:${sessionId}`).emit('webrtc:answer', { answer });
    });

    socket.on('webrtc:ice-candidate', ({ sessionId, candidate }) => {
      socket.to(`proctoring:${sessionId}`).emit('webrtc:ice-candidate', { candidate });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      const { sessionId } = socket.data;
      if (sessionId) {
        const room = `proctoring:${sessionId}`;
        
        if (socket.data.role === 'student') {
          io.to(room).emit('proctoring:student-disconnected', { sessionId });
        } else if (socket.data.role === 'phone') {
          const session = activeProctoringSessions.get(sessionId);
          if (session) session.phoneConnected = false;
          io.to(room).emit('phone:disconnected', { sessionId });
        } else if (socket.data.role === 'monitor') {
          const monitors = proctorMonitors.get(sessionId);
          if (monitors) {
            monitors.delete(socket.id);
            if (monitors.size === 0) proctorMonitors.delete(sessionId);
          }
        }
      }
      console.log(`[Socket.IO] User disconnected: ${socket.user.email}`);
    });

    // Leave proctoring
    socket.on('leave:proctoring', ({ sessionId }) => {
      const room = `proctoring:${sessionId}`;
      socket.leave(room);
      console.log(`[Socket.IO] User left proctoring room: ${room}`);
    });
  });

  return io;
};

/**
 * Calculate risk score delta based on event type and severity
 */
function getRiskDelta(eventType, severity) {
  const BASE_DELTAS = {
    tab_switch: 5,
    fullscreen_exit: 15,
    camera_disconnect: 10,
    copy_paste: 8,
    browser_blur: 3,
    keyboard_shortcut: 5,
    multiple_faces: 20,
    face_not_visible: 8,
    suspicious_activity: 12,
    phone_disconnected: 5,
    audio_multiple_voices: 15,
    object_detected_phone: 10,
    object_detected_book: 8,
    camera_quality_degraded: 5,
    face_not_matched: 20,
    looking_away: 5,
    devtools_opened: 15,
    ice_failed: 8,
    reconnected: -5, // Negative = improvement
  };

  const base = BASE_DELTAS[eventType] || 5;
  
  // Severity multiplier
  const multiplier = severity === 'critical' ? 2 : severity === 'warning' ? 1 : 0.5;
  
  return Math.round(base * multiplier);
}

module.exports = { setupSocketIO, activeProctoringSessions };
