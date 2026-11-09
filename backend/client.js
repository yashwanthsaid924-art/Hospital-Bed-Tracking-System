const io = require('socket.io-client');

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log("Connected to server");
});

socket.on('bedUpdate', (data) => {
  console.log("🔥 Real-time update received:");
  console.log(data);
});