const WebSocket = require('ws');

// Broadcast a message to all connected WebSocket clients
const broadcastBookingsChanged = (req, type = 'BOOKINGS_CHANGED') => {
  const wss = req.app.get('wss');
  if (!wss) {
    return;
  }

  const message = JSON.stringify({ type });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

module.exports = { broadcastBookingsChanged };
