// backend/index.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dataStore = require('./dataStore');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const PORT = process.env.PORT || 8124;

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User Registration
    socket.on('register', ({ age, gender, country, nickname, bio }) => {
        if (!nickname) {
            socket.emit('registration-failed', { error: 'Nickname is required.' });
            return;
        }
        const user = dataStore.addUser(age || 0, gender || "other", country || "", nickname, bio || "", socket.id);
        socket.sessionId = user.sessionId; // Store session ID in socket
        socket.user = user; // Store session ID in socket
        socket.emit('registered', user);
        console.log(`${nickname} registered with session ID: ${user.sessionId}`);
    });

    // Get Random User from Queue
    socket.on('get-user', () => {
        const randomUser = dataStore.getRandomUser(socket.sessionId);
        if (randomUser) {
            socket.emit('user-found', { randomUser, caller: true });
            io.to(randomUser.sessionId).emit('user-found', { randomUser: socket.user, caller: false });
            console.log(`User ${socket.sessionId} connected with user ${randomUser.sessionId}`);
        } else {
            socket.emit('user-not-found');
        }
    });

    // I'm Up / Keep Connection Alive
    socket.on('im-up', () => {
        dataStore.updateLastSeen(socket.sessionId);
        console.log(`User ${socket.sessionId} is up.`);
    });

    // Handle Offer from Main User
    socket.on('send-offer', ({ toSessionId, offer }) => {
        io.to(toSessionId).emit('receive-offer', { fromSessionId: socket.sessionId, offer });
        console.log(`Offer sent from ${socket.sessionId} to ${toSessionId}`);
    });

    // Handle Answer from Guest User
    socket.on('send-answer', ({ toSessionId, answer }) => {
        io.to(toSessionId).emit('receive-answer', { fromSessionId: socket.sessionId, answer });
        console.log(`Answer sent from ${socket.sessionId} to ${toSessionId}`);
    });

    // Handle ICE Candidate
    socket.on('send-ice-candidate', ({ toSessionId, candidate }) => {
        io.to(toSessionId).emit('receive-ice-candidate', { fromSessionId: socket.sessionId, candidate });
        console.log(`ICE Candidate sent from ${socket.sessionId} to ${toSessionId}`);
    });

    // Handle chat messages
    socket.on('send-message', ({ toSessionId, message }) => {
        io.to(toSessionId).emit('receive-message', { fromSessionId: socket.sessionId, message });
        console.log(`Message sent from ${socket.sessionId} to ${toSessionId}: ${message}`);
    });

    // Disconnect Handling
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        dataStore.removeUser(socket.sessionId);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
