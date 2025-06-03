// const User = require('../models/User');

// const { clients, sessionIds } = require('../whatsappClient');

// exports.sendMessage = async (req, res) => {
//   const { mobile, msg } = req.body;
//   if (!mobile || !msg) return res.status(400).json({ error: 'mobile and msg required' });

//   try {
//     const userId = req.user.id;
//     const user = await User.findById(userId);
//     if (!user) return res.status(401).json({ error: 'User not found' });

//     const whatsappId = user.whatsappId;
//     if (!whatsappId) return res.status(400).json({ error: 'WhatsApp ID not set for user' });

//     const client = clients[whatsappId];
//     if (!client || !client.info) {
//       return res.status(500).json({ error: 'WhatsApp client not ready for this user' });
//     }
 
//     const formatted = `${mobile}@c.us`;
//     await client.sendMessage(formatted, msg);

//     res.json({ status: 'sent', from: whatsappId });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ status: 'failed', error: err.message });
//   }
// };
// const Whatsapp = require('../models/Whatsapp');
// const User = require('../models/User');
// const { clients } = require('../whatsappClient');
// const {sessionIds }=require('../whatsappClient')
// exports.sendMessage = async (req, res) => {
//   const {
//     to,
//     message,
//     profilePhoto,
//     pdf,
//     docx,
//     photo,
//     video,
//   } = req.body;

//   if (!to || (!message && !photo && !pdf && !docx && !video)) {
//     return res.status(400).json({ error: 'Required fields missing: to, and one message type (text/media)' });
//   }

//   try {
//     const userId = req.user.id;
//     const user = await User.findById(userId);
//     if (!user) return res.status(401).json({ error: 'User not found' });

//     // Find the first available (ready) client
//     let workingClient = null;
//     let sentWhatsappId = null;

//     for (let id of sessionIds) {
//       const client = clients[id];
//       if (client && client.info) {
//         workingClient = client;
//         sentWhatsappId = id;
//         break;
//       }
//     }

//     if (!workingClient) {
//       return res.status(500).json({ error: 'No WhatsApp session is ready' });
//     }

//     const results = [];

//     for (let recipient of to) {
//       const chatId = recipient.endsWith('@c.us') ? recipient : `${recipient}@c.us`;

//       const { MessageMedia } = require('whatsapp-web.js');

//       // Text
//       if (message) {
//         await workingClient.sendMessage(chatId, message);
//         results.push({ to: recipient, type: 'text', status: 'sent' });
//       }

//       // Image
//       if (photo) {
//         const media = await MessageMedia.fromUrl(photo, { unsafeMime: true });
//         await workingClient.sendMessage(chatId, media);
//         results.push({ to: recipient, type: 'photo', status: 'sent' });
//       }

//       // PDF
//       if (pdf) {
//         const media = await MessageMedia.fromUrl(pdf,{unsafeMime: true});
//         await workingClient.sendMessage(chatId, media);
//         results.push({ to: recipient, type: 'pdf', status: 'sent' });
//       }

//       // DOCX
//       if (docx) {
//         const media = await MessageMedia.fromUrl(docx,{unsafeMime: true});
//         await workingClient.sendMessage(chatId, media);
//         results.push({ to: recipient, type: 'docx', status: 'sent' });
//       }

   

//       // Video
//       if (video) {
//         const media = await MessageMedia.fromUrl(video, { unsafeMime: true });
//         await workingClient.sendMessage(chatId, media);
//         results.push({ to: recipient, type: 'video', status: 'sent' });
//       }
//     }

//     // Save to DB
//     await Whatsapp.create({
//       user: userId,
//       from: sentWhatsappId,
//       to,
//       message,
//       profilePhoto,
//       pdf,
//       docx,
//       photo,
//       video,
//     });

//     res.json({ status: 'sent', usedSession: sentWhatsappId, results });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };




const path = require('path');
const fs = require('fs');
const Whatsapp = require('../models/Whatsapp');
const User = require('../models/User');
const { clients, sessionIds } = require('../whatsappClient');
const { MessageMedia } = require('whatsapp-web.js');
const cron = require('node-cron');

exports.scheduleMessage = async (req, res) => {
  const {
    to,
    message,
    pdf,
    docx,
    photo,
    video,
    scheduledTime,
  } = req.body;

  const scheduleDate = new Date(scheduledTime);
  const now = new Date();

  if (!to || (!message && !photo && !pdf && !docx && !video) || !scheduledTime || isNaN(scheduleDate.getTime()) || scheduleDate <= now) {
    return res.status(400).json({ error: 'Invalid or missing fields' });
  }

  const minute = scheduleDate.getMinutes();
  const hour = scheduleDate.getHours();
  const day = scheduleDate.getDate();
  const month = scheduleDate.getMonth() + 1;
  const cronExpression = `${minute} ${hour} ${day} ${month} *`;

  const userId = req.user.id;

  cron.schedule(cronExpression, async () => {
    console.log('📆 Scheduled job triggered at:', new Date());
    try {
      await sendMessageCore({ to, message, pdf, docx, photo, video, userId });
    } catch (err) {
      console.error('❌ Scheduled message error:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  res.json({ status: 'scheduled', scheduledFor: scheduleDate.toISOString() });
};
const sendMessageCore = async ({ to, message, photo, pdf, docx, video, userId }) => {
  const results = [];

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Find a ready client
  let workingClient = null;
  let sentWhatsappId = null;

  for (let id of sessionIds) {
    const client = clients[id];
    if (client && client.info) {
      workingClient = client;
      sentWhatsappId = id;
      break;
    }
  }

  if (!workingClient) throw new Error('No WhatsApp session is ready');

  const sendLocalFiles = async (files, typeLabel, chatId) => {
    if (!files) return;
    if (Array.isArray(files)) {
      for (let filePath of files) {
        await sendSingleFile(filePath, typeLabel, chatId);
      }
    } else {
      await sendSingleFile(files, typeLabel, chatId);
    }
  };

  const sendSingleFile = async (filePath, typeLabel, chatId) => {
    const fullPath = path.join(__dirname, '..', 'uploads', filePath);
    if (fs.existsSync(fullPath)) {
      const media = MessageMedia.fromFilePath(fullPath);
      await workingClient.sendMessage(chatId, media);
      results.push({ to: chatId, type: typeLabel, file: filePath, status: 'sent' });
    } else {
      results.push({ to: chatId, type: typeLabel, file: filePath, status: 'file not found' });
    }
  };

  for (let recipient of to) {
    const chatId = recipient.endsWith('@c.us') ? recipient : `${recipient}@c.us`;

    if (message) {
      if (Array.isArray(message)) {
        for (let msg of message) {
          await workingClient.sendMessage(chatId, msg);
          results.push({ to: recipient, type: 'text', message: msg, status: 'sent' });
        }
      } else {
        await workingClient.sendMessage(chatId, message);
        results.push({ to: recipient, type: 'text', message, status: 'sent' });
      }
    }

    await sendLocalFiles(photo, 'photo', chatId);
    await sendLocalFiles(pdf, 'pdf', chatId);
    await sendLocalFiles(docx, 'docx', chatId);
    await sendLocalFiles(video, 'video', chatId);
  }

  await Whatsapp.create({
    user: userId,
    from: sentWhatsappId,
    to,
    message,
    pdf,
    docx,
    photo,
    video,
  });

  return { usedSession: sentWhatsappId, results };
};


exports.sendMessage = async (req, res) => {
  const {
    to,
    message,
   
    pdf,
    docx,
    photo,
    video,
  } = req.body;

  if (!to || (!message && !photo && !pdf && !docx && !video)) {
    return res.status(400).json({ error: 'Required fields missing: to, and one message type (text/media)' });
  }

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Find a ready client
    let workingClient = null;
    let sentWhatsappId = null;

    for (let id of sessionIds) {
      const client = clients[id];
      if (client && client.info) {
        workingClient = client;
        sentWhatsappId = id;
        break;
      }
    }

    if (!workingClient) {
      return res.status(500).json({ error: 'No WhatsApp session is ready' });
    }

    const results = [];

    // Helper to send one or multiple files
    const sendLocalFiles = async (files, typeLabel, chatId) => {
      if (!files) return;
      if (Array.isArray(files)) {
        for (let filePath of files) {
          await sendSingleFile(filePath, typeLabel, chatId);
        }
      } else {
        await sendSingleFile(files, typeLabel, chatId);
      }
    };

    // Send one file by path
    const sendSingleFile = async (filePath, typeLabel, chatId) => {
      const fullPath = path.join(__dirname, '..', 'uploads', filePath);
      if (fs.existsSync(fullPath)) {
        const media = MessageMedia.fromFilePath(fullPath);
        await workingClient.sendMessage(chatId, media);
        results.push({ to: chatId, type: typeLabel, file: filePath, status: 'sent' });
      } else {
        results.push({ to: chatId, type: typeLabel, file: filePath, status: 'file not found' });
      }
    };

    for (let recipient of to) {
      const chatId = recipient.endsWith('@c.us') ? recipient : `${recipient}@c.us`;

      //  Send text message(s)
      if (message) {
        if (Array.isArray(message)) {
          for (let msg of message) {
            await workingClient.sendMessage(chatId, msg);
            results.push({ to: recipient, type: 'text', message: msg, status: 'sent' });
          }
        } else {
          await workingClient.sendMessage(chatId, message);
          results.push({ to: recipient, type: 'text', message, status: 'sent' });
        }
      }

      // Send media files (photo, pdf, docx, video)
      await sendLocalFiles(photo, 'photo', chatId);
      await sendLocalFiles(pdf, 'pdf', chatId);
      await sendLocalFiles(docx, 'docx', chatId);
      await sendLocalFiles(video, 'video', chatId);
    }

    // Save to DB
    await Whatsapp.create({
      user: userId,
      from: sentWhatsappId,
      to,
      message,
   
      pdf,
      docx,
      photo,
      video,
    });

    res.json({ status: 'sent', usedSession: sentWhatsappId, results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Whatsapp.find()
      .populate('user', 'name email') // Populate user name and email if needed
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};