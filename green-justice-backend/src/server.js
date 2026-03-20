require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./services/socketService');
const { startReminderJob } = require('./services/reminderService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);
startReminderJob();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
