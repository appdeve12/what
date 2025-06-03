// models/Whatsapp.js
const mongoose = require('mongoose');

const whatsappSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  from: { type: String, required: true },     // Sender's WhatsApp ID or number
  to: [{ type: String, required: true }],     // Receiver(s) - single or bulk
  message: [{ type: String }],                  // Text message content
  whatsappId: { type: String, default: '9540215846' }, // WhatsApp client ID used
  profilePhoto: { type: String },             // Path or URL to profile photo
  pdf: { type: String },                      // Path or URL to PDF
  docx: { type: String },                     // Path or URL to DOCX
  photo: [{ type: String }],                    // Path or URL to image
  video: { type: String },                    // Path or URL to video
  createdAt: { type: Date, default: Date.now } // Timestamp
});

module.exports = mongoose.model('Whatsapp', whatsappSchema);
