const { Client } = require('whatsapp-web.js');

// Headless client for general use (text, image, pdf, docx)
const headlessClient = new Client({
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Chrome client for sending videos only
const chromeClient = new Client({
  puppeteer: {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

headlessClient.initialize();
chromeClient.initialize();

module.exports = { headlessClient, chromeClient };
