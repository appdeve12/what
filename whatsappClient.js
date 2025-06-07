const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal'); // For terminal QR display
const os = require('os');

// 🔧 Configure sessions
const sessionIds = ['9540215846'];
const clients = {};

console.log("🔄 Initializing WhatsApp sessions...");

// ✅ Chrome path for EC2
function getChromeExecutablePath() {
  return '/usr/bin/google-chrome'; // Double-check with: which google-chrome
}

// 🔁 Initialize each WhatsApp session
sessionIds.forEach(id => {
  console.log(`🚀 Setting up WhatsApp client for session ID: ${id}`);

  const auth = new LocalAuth({
    clientId: id,
    dataPath: './.wwebjs_auth', // Folder for session data
  });

  const client = new Client({
    authStrategy: auth,
    puppeteer: {
      headless: true,
      executablePath: getChromeExecutablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      dumpio: true
    },
  });

  // 🟨 QR Code
  client.on('qr', qr => {
    console.log(`📸 QR code received for session ${id}. Scan below:`);
    qrcode.generate(qr, { small: true });
  });

  // ✅ Ready
  client.on('ready', () => {
    console.log(`✅ WhatsApp client ${id} is ready`);
  });

  // ❌ Auth Failure
  client.on('auth_failure', msg => {
    console.error(`❌ Authentication failure for session ${id}:`, msg);
  });

  // ⚠️ Disconnected
  client.on('disconnected', reason => {
    console.warn(`⚠️ WhatsApp client ${id} disconnected:`, reason);
  });

  // 🔥 Other Errors
  client.on('error', error => {
    console.error(`🔥 Error for client ${id}:`, error);
  });

  // ⏳ Initialize
  setTimeout(() => {
    client.initialize().catch(err => {
      console.error(`❌ Failed to initialize client ${id}:`, err);
    });
    clients[id] = client;
  }, 3000);
});

module.exports = { clients, sessionIds };
