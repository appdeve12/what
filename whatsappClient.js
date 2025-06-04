const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');
const qrcode = require('qrcode-terminal');

const sessionIds = ['9540215846'];
const clients = {};

console.log("🔄 Initializing WhatsApp sessions...");

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

sessionIds.forEach(id => {
  console.log(`🚀 Setting up WhatsApp client for session ID: ${id}`);

  const auth = new LocalAuth({ clientId: id });
  console.log(`🛡️ Auth strategy initialized for ${id}`);

  const client = new Client({
    authStrategy: auth,
    puppeteer: {
      headless: true,
      executablePath: getChromeExecutablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', qr => {
    console.log(`📸 QR code for ${id}:`);
    qrcode.generate(qr, { small: true });
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

  try {
    client.initialize();
    clients[id] = client;
  } catch (err) {
    console.error(`❌ Failed to initialize client ${id}:`, err);
  }
});

module.exports = { clients, sessionIds };
