// Generate a string of 6 random alphanumeric characters.
function generateRandomString() {
  let result = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = 6; i > 0; i--) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// Check whether register information empty or repeated.
function getUserByEmail(email, database) {
  for (key in database) {
    if (email === database[key]['email']) {
      return database[key];
    }
  }
  return undefined;
};

// Comparing the userID in the urlDatabase with the logged-in user's ID from their cookie.
function urlsForUser(id, database) {
  let result = {};
  for (let key in database) {
    if (database[key]['userID'] === id) {
      result[key] = database[key];
    }
  }
  return result;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };