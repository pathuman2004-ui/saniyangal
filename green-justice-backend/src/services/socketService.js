const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*'
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('joinComplaintRoom', (complaintCode) => {
      if (complaintCode) {
        socket.join(`complaint:${complaintCode}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

function emitComplaintUpdate(complaintCode, payload) {
  if (!io) return;
  io.to(`complaint:${complaintCode}`).emit('complaintStatusUpdated', payload);
}

module.exports = { initSocket, emitComplaintUpdate };
