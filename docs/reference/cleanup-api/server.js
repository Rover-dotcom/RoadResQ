require('dotenv').config();
const express = require('express');
const connectDB = require('./db'); // The file we made earlier
const jobRoutes = require('./routes/jobRoutes');

const app = express();

// Middleware to read JSON data
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api/jobs', jobRoutes);

const PORT = 3001; 
app.listen(PORT, () => console.log(`Listening on ${PORT}`));