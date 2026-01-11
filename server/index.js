require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for dev; restrict in prod
        methods: ['GET', 'POST'],
    },
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crisis-connect';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio Webhooks

// Database Connection
let isMongoConnected = false;
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected');
        isMongoConnected = true;
    })
    .catch(err => {
        console.warn('MongoDB Connection Failed (Falling back to In-Memory Mode). Error:', err.message);
        isMongoConnected = false;
    });

// Make connection status available to routes
app.use((req, res, next) => {
    req.isMongoConnected = isMongoConnected;
    next();
});

// Routes
// Pass io instance to request for use in controllers if needed, 
// but cleaner to handle it in separate controller/service or pass here.
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api', apiRoutes);

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
