const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./db');

const parseCookies = (cookieString) => {
  const cookies = {};
  if (!cookieString) return cookies;
  cookieString.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const value = parts[1] ? parts[1].trim() : '';
    cookies[name] = decodeURIComponent(value);
  });
  return cookies;
};

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
  });

  // JWT Handshake Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const cookies = parseCookies(cookieHeader);
      let token = cookies.accessToken;

      // Handshake auth auth/bearer token fallbacks
      if (!token && socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }
      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user profile using Prisma Client (exclude passwordHash).
      // User IDs are UUID strings, so the token subject is used as-is.
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          mustResetPassword: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (!user.isActive) {
        return next(new Error('Authentication error: User account is deactivated'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error(`Socket auth error: ${error.message}`);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userIdStr = socket.user.id.toString();
    const roomName = `user:${userIdStr}`;
    
    socket.join(roomName);
    console.log(`[Socket] User ${socket.user.name} (${userIdStr}) connected and joined room ${roomName}`);

    // Deliver pending unread notifications
    try {
      const pendingNotifications = await prisma.notification.findMany({
        where: {
          recipientId: socket.user.id,
          isRead: false
        },
        include: {
          relatedTask: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Map notifications so relatedTaskId contains the populated task object
      const formattedPending = pendingNotifications.map((n) => {
        const obj = { ...n };
        obj.relatedTaskId = n.relatedTask;
        delete obj.relatedTask;
        return obj;
      });

      socket.emit('pending_notifications', formattedPending);
      console.log(`[Socket] Delivered ${formattedPending.length} pending notifications to ${socket.user.name}`);
    } catch (error) {
      console.error(`[Socket] Error delivering pending notifications: ${error.message}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${socket.user.name} (${userIdStr}) disconnected`);
    });
  });

  return io;
};
