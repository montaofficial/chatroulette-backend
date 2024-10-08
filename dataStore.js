// backend/dataStore.js

const { v4: uuidv4 } = require('uuid');

let users = {};

const addUser = (age, gender, country, nickname, bio, sessionId) => {
    const timestamp = Date.now();
    users[sessionId] = {
        sessionId,
        age,
        gender,
        country,
        nickname,
        bio,
        lastSeen: timestamp,
    };
    return users[sessionId];
};

const removeUser = (sessionId) => {
    delete users[sessionId];
};

const updateLastSeen = (sessionId) => {
    if (users[sessionId]) {
        users[sessionId].lastSeen = Date.now();
    }
};

const getRandomUser = (excludeSessionId) => {
    const now = Date.now();
    const filteredUsers = Object.values(users).filter(
        (user) => user.sessionId !== excludeSessionId && now - user.lastSeen <= 15000
    );
    return filteredUsers.length > 0 ? filteredUsers[Math.floor(Math.random() * filteredUsers.length)] : null;
};

module.exports = {
    addUser,
    removeUser,
    updateLastSeen,
    getRandomUser,
    users,
};
