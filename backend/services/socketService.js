let io = null;

const setIO = (ioInstance) => {
  io = ioInstance;
  console.log('[SocketService] Socket.io instance attached.');
};

const getIO = () => {
  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io) {
    console.warn('[SocketService] Attempted to emit event before Socket.io was initialized.');
    return;
  }
  const roomName = `user:${userId.toString()}`;
  io.to(roomName).emit(event, data);
  console.log(`[SocketService] Emitted '${event}' to room '${roomName}'`);
};

const emitToUsers = (userIds, event, data) => {
  if (!io) {
    console.warn('[SocketService] Attempted to emit event before Socket.io was initialized.');
    return;
  }
  userIds.forEach((userId) => {
    emitToUser(userId, event, data);
  });
};

const emitToAll = (event, data) => {
  if (!io) {
    console.warn('[SocketService] Attempted to emit event before Socket.io was initialized.');
    return;
  }
  io.emit(event, data);
  console.log(`[SocketService] Broadcasted '${event}' to all clients`);
};

module.exports = {
  setIO,
  getIO,
  emitToUser,
  emitToUsers,
  emitToAll
};
