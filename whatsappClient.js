const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');

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

async function initClient(id) {
  console.log(`🚀 Setting up WhatsApp client for session ID: ${id}`);

  const auth = new LocalAuth({ clientId: id });
  console.log(`🛡️ Auth strategy initialized for ${id}`);

  const client = new Client({
    authStrategy: auth,
    puppeteer: {
      headless: true,
      executablePath: getChromeExecutablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
      ],
      dumpio: false,
    },
  });

  client.on('qr', (qr) => {
    console.log(`📸 QR code received for session ${id}. Scan this in WhatsApp.`);
  });

  client.on('ready', () => {
    console.log(`✅ WhatsApp client ${id} is ready`);
    clients[id] = client; // ✅ Move assignment here
  });

  client.on('auth_failure', (msg) => {
    console.error(`❌ Authentication failure for session ${id}:`, msg);
  });

  client.on('disconnected', (reason) => {
    console.warn(`⚠️ WhatsApp client ${id} disconnected:`, reason);
    delete clients[id]; // optional but useful
  });

  client.on('error', (error) => {
    console.error(`🔥 Error for client ${id}:`, error);
  });

  try {
    await client.initialize();
  } catch (err) {
    console.error(`❌ Failed to initialize client ${id}:`, err);
  }
}

(async () => {
  for (const id of sessionIds) {
    await initClient(id);
  }
})();

module.exports = { clients, sessionIds };
