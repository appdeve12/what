// server.js
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
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// CREATE A WHATSAPP CLIENT SESSION

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

const createClient = (sessionId) => {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionId }),
    puppeteer: {
      headless: true,
          executablePath: getChromeExecutablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', async (qr) => {
    const qrImage = await qrcode.toDataURL(qr);
    io.emit(`qr-${sessionId}`, qrImage);
  });

  client.on('ready', () => {
    const realNumber = client.info.wid.user;
    console.log(`✅ Logged in: ${realNumber}`);

    sessions[realNumber] = client;
    delete tempSessions[sessionId];

    io.emit(`ready-${sessionId}`, {
      number: realNumber,
      message: `Logged in as ${realNumber}`
    });
  });

  client.on('auth_failure', msg => {
    console.error(`❌ Auth failed for session ${sessionId}: ${msg}`);
  });

  client.initialize();
  tempSessions[sessionId] = client;
};

// START A NEW SESSION
app.post('/start-session', (req, res) => {
  const sessionId = uuidv4();
  createClient(sessionId);
  res.json({ sessionId });
});

// ROUTES
app.use('/auth', authRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api', uploadRoutes);

// SERVER START
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Export session utils if needed elsewhere
module.exports = { createClient };
