// chatRoute.js
const express = require('express');
const messageRoute = require('./messageRoute');
const startChat = require('./startChat');

const router = express.Router();

// Middleware to attach io and prisma to requests
module.exports = (io) => {
    // Use conversation and message routes
    router.use('/messages', messageRoute(io)); // Pass io and prisma
    router.use('/chats', startChat(io)); // Use the chat route
    return router;
};
