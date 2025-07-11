const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const USERS_FILE = path.join(__dirname, "users.json");
const SALT_ROUNDS = 10;

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, "utf-8");
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function findUserByUsername(username) {
  const users = loadUsers();
  return users.find((u) => u.username === username);
}

async function addUser(username, password) {
  const users = loadUsers();
  if (users.find((u) => u.username === username)) {
    throw new Error("User already exists");
  }
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  users.push({ username, password: hashed });
  saveUsers(users);
  return { username };
}

async function validateUser(username, password) {
  const user = findUserByUsername(username);
  if (!user) return false;
  return await bcrypt.compare(password, user.password);
}

module.exports = {
  addUser,
  findUserByUsername,
  validateUser,
};
