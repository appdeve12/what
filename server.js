const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
require('dotenv').config();
const os = require('os');

// ROUTES
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

// SESSION STORE
const { sessions, tempSessions } = require('./sessionStore');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// CHROME PATH DETECTION
function getChromeExecutablePath() {
  const platform = os.platform();
  console.log(`🖥️ Detected OS platform: ${platform}`);

  if (platform === 'win32') {
    console.log("🔍 Using Windows Chrome path");
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (platform === 'darwin') {
    console.log("🔍 Using macOS Chrome path");
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else {
    console.log("🔍 Using Linux Chrome path");
    return '/usr/bin/google-chrome';
  }
}

// CREATE WHATSAPP CLIENT
const createClient = (sessionId) => {
  if (tempSessions[sessionId] || sessions[sessionId]) {
    console.warn(`⚠️ Session ${sessionId} already exists. Skipping.`);
    return;
  }

  console.log(`📲 Creating new client for session: ${sessionId}`);

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionId }),
    puppeteer: {
      headless: true,
      executablePath: getChromeExecutablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', async (qr) => {
    const qrImage = await qrcode.toDataURL(qr);
    io.emit(`qr-${sessionId}`, qrImage);
  });

  client.on('ready', () => {
    const realNumber = client.info?.wid?.user;
    if (!realNumber) return;

    console.log(`✅ Logged in: ${realNumber}`);
    sessions[realNumber] = client;
    delete tempSessions[sessionId];

    io.emit(`ready-${sessionId}`, {
      number: realNumber,
      message: `Logged in as ${realNumber}`,
    });
  });

  client.on('auth_failure', msg => {
    console.error(`❌ Auth failed for session ${sessionId}: ${msg}`);
  });

  client.on('disconnected', async (reason) => {
    console.warn(`⚠️ Client disconnected: ${reason}`);
    try {
      await client.logout();
    } catch (err) {
      console.error(`❌ Logout error (disconnected): ${err.message}`);
    }

    const number = client.info?.wid?.user;
    if (number) {
      delete sessions[number];
    }
  });

  client.initialize().catch(err => {
    console.error('❌ Client initialization error:', err.message);
  });

  tempSessions[sessionId] = client;
};

// START SESSION
app.post('/start-session', (req, res) => {
  const sessionId = uuidv4();
  createClient(sessionId);
  res.json({ sessionId });
});

// LOGOUT SESSION
app.post('/logout-session', async (req, res) => {
  const { number } = req.body;
  const client = sessions[number];

  if (!client) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    await client.logout();
    await client.destroy();
    delete sessions[number];
    console.log(`🔌 Logged out and destroyed session for ${number}`);
    res.json({ message: 'Session logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({ error: 'Failed to logout session' });
  }
});

// ROUTES
app.use('/auth', authRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api', uploadRoutes);

// START SERVER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// PREVENT UNCAUGHT ERRORS FROM CRASHING SERVER
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

module.exports = { createClient };
