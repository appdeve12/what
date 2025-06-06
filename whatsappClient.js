const { Client, LocalAuth } = require('whatsapp-web.js');

const sessionIds = ['9540215846'];
const clients = {};

console.log("🔄 Initializing WhatsApp sessions...");

sessionIds.forEach(id => {
  console.log(`🚀 Setting up WhatsApp client for session ID: ${id}`);

  const auth = new LocalAuth({ clientId: id });
  console.log(`🛡️ Auth strategy initialized for ${id}:`, auth);

  const client = new Client({
    authStrategy: auth,
    puppeteer: {
      headless: true,               // Run headless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      dumpio: true,                 // Show Chromium logs for debugging
      // No executablePath: use Puppeteer's bundled Chromium
    },
  });

  client.on('qr', qr => {
    console.log(`📸 QR code received for session ${id}. Scan this in WhatsApp.`);
  });

  client.on('ready', () => {
    console.log(`✅ WhatsApp client ${id} is ready`);
  });

  client.on('auth_failure', msg => {
    console.error(`❌ Authentication failure for session ${id}:`, msg);
  });

  client.on('disconnected', reason => {
    console.warn(`⚠️ WhatsApp client ${id} disconnected:`, reason);
  });

  client.on('error', error => {
    console.error(`🔥 Error for client ${id}:`, error);
  });

  setTimeout(() => {
    try {
      client.initialize();
      clients[id] = client;
    } catch (err) {
      console.error(`❌ Failed to initialize client ${id}:`, err);
    }
  }, 1000);
});

module.exports = { clients, sessionIds };
