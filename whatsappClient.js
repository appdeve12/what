const { Client, LocalAuth } = require('whatsapp-web.js');
const os = require('os');

const sessionIds = ['9540215846'];
const clients = {};

console.log("🔄 Initializing WhatsApp sessions...");

// ✅ Function to get Chrome/Chromium path based on OS
function getChromeExecutablePath() {
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (platform === 'darwin') {
    // macOS
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else {
    // Linux (deployment)
    return '/usr/bin/google-chrome'; // or '/usr/bin/google-chrome' if you're using Google Chrome
  }
}

sessionIds.forEach(id => {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: id }),
    puppeteer: {
      headless: true,
      executablePath: getChromeExecutablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('ready', () => console.log(`✅ WhatsApp client ${id} ready`));
  client.on('auth_failure', msg => console.error(`❌ Auth failure for ${id}:`, msg));
  client.on('disconnected', reason => console.warn(`⚠️ Disconnected ${id}:`, reason));

  client.initialize();
  clients[id] = client;
});

module.exports = { clients, sessionIds };
