// sessionStore.js
const sessions = {};      // Stores realNumber -> client
const tempSessions = {};  // Stores sessionId -> client (before login)

module.exports = { sessions, tempSessions };
