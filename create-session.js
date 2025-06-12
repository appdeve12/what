const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const sessionIds = ['7985490508', '9540215846']; // Replace with your actual numbers
const clients = {};

sessionIds.forEach(id => {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: id }), // Session stored in .wwebjs_auth/id
    puppeteer: { headless: true }
  });

  client.on('qr', qr => {
    console.log(`Scan QR for number ${id}:`);
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log(`✅ WhatsApp client ${id} is ready! Session saved.`);
  });

  client.on('auth_failure', msg => {
    console.error(`❌ Authentication failed for ${id}:`, msg);
  });

  client.initialize();
  clients[id] = client;
});

module.exports = { clients, sessionIds };
