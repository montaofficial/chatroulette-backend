const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

let users = [];

// Utility function to clean up inactive sessions
function cleanUpSessions() {
    const currentTime = Date.now();
    users = users.filter(user => currentTime - user.lastPing <= 15000);
}

// Registration Endpoint
app.post('/register', (req, res) => {
    const { age, gender, country, nickname, negotiationString } = req.body;

    const sessionId = uuidv4();
    const timestamp = Date.now();

    const user = {
        sessionId,
        age,
        gender,
        country,
        nickname,
        negotiationString,
        lastSeen: timestamp,
        lastPing: timestamp,
        connectedTo: null,
    };

    users.push(user);

    res.json({ sessionId });
});

// Get User Endpoint
app.get('/get-user', (req, res) => {
    cleanUpSessions();

    const activeUsers = users.filter(user => {
        const isActive = Date.now() - user.lastPing <= 15000;
        return isActive && !user.connectedTo;
    });

    if (activeUsers.length === 0) {
        return res.status(404).json({ message: 'No active users available' });
    }

    const randomIndex = Math.floor(Math.random() * activeUsers.length);
    const selectedUser = activeUsers[randomIndex];

    // Mark the user as connected
    selectedUser.connectedTo = 'main-user-session-id'; // Replace with actual session ID if needed

    res.json({
        sessionId: selectedUser.sessionId,
        age: selectedUser.age,
        gender: selectedUser.gender,
        country: selectedUser.country,
        nickname: selectedUser.nickname,
        negotiationString: selectedUser.negotiationString,
    });
});

// Get Queue Endpoint
app.get('/get-queue', (req, res) => {
    cleanUpSessions();

    const currentTime = Date.now();
    let activeCount = 0;
    let expiredCount = 0;

    users.forEach(user => {
        if (currentTime - user.lastPing <= 15000) {
            activeCount++;
        } else {
            expiredCount++;
        }
    });

    res.json({
        queueLength: activeCount,
        expiredSessions: expiredCount,
    });
});

// I'm Up Endpoint
app.post('/im-up', (req, res) => {
    const { sessionId } = req.body;
    const user = users.find(user => user.sessionId === sessionId);

    if (user) {
        user.lastPing = Date.now();
        res.json({ message: 'Ping updated' });
    } else {
        res.status(404).json({ message: 'Session not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
