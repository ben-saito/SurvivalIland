const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const GameManager = require('./gameManager');
const { initializeSupabase } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize database connection
initializeSupabase();

// Initialize game manager
const gameManager = new GameManager(io);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/streamer', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/streamer.html'));
});

app.get('/mobile/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/mobile.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Room management events
  socket.on('create-room', (data) => {
    gameManager.createRoom(socket, data);
  });

  socket.on('join-room', (data) => {
    gameManager.joinRoom(socket, data);
  });

  socket.on('leave-room', () => {
    gameManager.leaveRoom(socket);
  });

  // Game control events
  socket.on('start-game', (data) => {
    gameManager.startGame(socket, data);
  });

  socket.on('cast-vote', (data) => {
    gameManager.castVote(socket, data);
  });

  socket.on('streamer-control', (data) => {
    gameManager.handleStreamerControl(socket, data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gameManager.handleDisconnection(socket);
  });

  // Handle reconnection
  socket.on('reconnect', () => {
    console.log('Client reconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});