require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors=require('cors');
const path = require('path');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

const app = express();

app.use(bodyParser.json());


// Allow requests only from your frontend IP
app.use(cors({
  origin: 'http://16.171.161.238',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // If using cookies/auth headers
}));


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/whatsapp', whatsappRoutes);

app.use('/uploads', express.static('uploads')); // Serve static files
app.use('/api', uploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
  