const usersByToken = new Map();
const usersByUsername = new Map();
const groups = new Map(); 
let nextUserId = 1; 

export function saveUser(username, token) {
  const user = { 
    userId: nextUserId++, 
    username, 
    token 
  };
  usersByToken.set(token, user);
  usersByUsername.set(username, user);
  return user;
}

export function getUserByToken(token) {
  return usersByToken.get(token);
}

export function getUserByUsername(username) {
  return usersByUsername.get(username);
}

function _getGroupKey(userId, competition, year) {
  return `${userId}-${competition}-${year}`;
}

export function findGroup(userId, competition, year) {
  const key = _getGroupKey(userId, competition, year);
  return groups.get(key);
}

export function createGroup(userId, name, description, competition, year) {
  const key = _getGroupKey(userId, competition, year);

  if (groups.has(key)) {
    return null; 
  }
  
  const group = {
    ownerId: userId,
    name: name,
    description: description,
    competition: competition,
    year: year,
    players: []
  };

  groups.set(key, group);
  return group;
}

export function updateGroup(userId, competition, year, name, description) {
  const key = _getGroupKey(userId, competition, year);
  const group = groups.get(key);

  if (!group) {
    return null;
  }

  group.name = name;
  group.description = description;
  groups.set(key, group);
  return group;
}

export function deleteGroup(userId, competition, year) {
  const key = _getGroupKey(userId, competition, year);
  return groups.delete(key);
}

export function listGroups() {
  return Array.from(groups.values());
}

export function addPlayerToGroup(userId, competition, year, playerData) {
  const group = findGroup(userId, competition, year);

  if (group) {
    group.players.push(playerData);
    return group;
  }
  return null;
}

export function removePlayerFromGroup(userId, competition, year, playerId) {
  const group = findGroup(userId, competition, year);

  if (group) {
    const initialLength = group.players.length;
    group.players = group.players.filter(p => p.playerId != playerId);
    return group.players.length < initialLength;
  }
  return false;
}