const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const WebSocket = require('ws');
const { testConnection } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
testConnection();

// Routes
const authRouter = require('./routes/auth');
const hotelsRouter = require('./routes/hotels');
const roomsRouter = require('./routes/rooms');
const roomTypesRouter = require('./routes/roomTypes');
const bookingsRouter = require('./routes/bookings');
const rescheduleRouter = require('./routes/reschedule');

app.use('/api/auth', authRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/room-types', roomTypesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/reschedule', rescheduleRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hotel-U API Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const wss = new WebSocket.Server({ server, path: '/ws' });

app.set('wss', wss);

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
