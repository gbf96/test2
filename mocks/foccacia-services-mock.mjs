import { errors } from '../common/foccacia-errors.mjs';

const MOCK_USERS = [];
const MOCK_GROUPS = [];


export function createUser(username) {
  if (!username) throw errors.MISSING_PARAMETER('username');

  const exists = MOCK_USERS.find(u => u.username === username);
  if (exists) throw errors.USER_ALREADY_EXISTS(username);

  const newUser = {
      userId: MOCK_USERS.length + 1,
      username: username,
      token: `token-for-${username}`
  };
  
  MOCK_USERS.push(newUser);  
  return newUser;
}

export function validateToken(token) {
  const user = MOCK_USERS.find(u => u.token === token);
  if (!user) throw errors.NOT_AUTHORIZED();
  return user;
}

export async function getCompetitions() {
    return [
        { name: "Premier League", code: "PL" },
        { name: "World Cup", code: "WC" },
        { name: "La Liga", code: "PD" }
    ];
}

export async function getTeams(competition, year) {
    if (!competition || !year) {
        throw errors.MISSING_PARAMETER('competition or year');
    }

    if (competition === 'PL' && year == 2023) {
        return [
            {
                teamName: "City FC",
                country: "England",
                players: [
                    { name: "Haaland", position: "Offence" },
                    { name: "De Bruyne", position: "Midfield" }
                ]
            },
            {
                teamName: "United",
                country: "England",
                players: [
                    { name: "Bruno", position: "Midfield" }
                ]
            }
        ];
    }

    return [];
}

export function createGroup(user, groupData) {
  const { name, description, competition, year } = groupData;
  if (!name || !description || !competition || !year) throw errors.MISSING_PARAMETER('fields');

  const exists = MOCK_GROUPS.find(g => 
      g.ownerId === user.userId && 
      g.competition === competition && 
      g.year == year
  );
  
  if (exists) throw errors.GROUP_ALREADY_EXISTS();

  const newGroup = {
      id: MOCK_GROUPS.length + 1,
      ownerId: user.userId,
      name, description, competition, year: Number(year),
      players: []
  };
  
  MOCK_GROUPS.push(newGroup);
  
  return newGroup;
}

export function getGroupsForUser(user) {
  return MOCK_GROUPS.filter(g => g.ownerId === user.userId);
}

export function getGroup(user, competition, year) {
  const group = MOCK_GROUPS.find(g => 
      g.ownerId === user.userId && 
      g.competition === competition && 
      g.year == year
  );
  
  if (!group) throw errors.GROUP_NOT_FOUND();
  return group;
}

export function editGroup(user, competition, year, groupData) {
  const group = getGroup(user, competition, year);
  
  group.name = groupData.name || group.name;
  group.description = groupData.description || group.description;

  return group;
}

export function deleteGroup(user, competition, year) {
  const index = MOCK_GROUPS.findIndex(g => 
      g.ownerId === user.userId && 
      g.competition === competition && 
      g.year == year
  );

  if (index === -1) throw errors.GROUP_NOT_FOUND();

  MOCK_GROUPS.splice(index, 1);
}

export function addPlayerToGroup(user, competition, year, playerData) {

  const group = getGroup(user, competition, year);

  if (group.players.length >= 11) {
    throw errors.GROUP_FULL();
  }

  const playerExists = group.players.find(p => p.playerId == playerData.playerId);
  if (playerExists) {
    throw errors.PLAYER_ALREADY_IN_GROUP();
  }

  group.players.push(playerData);
  
  return group;
}

export function removePlayerFromGroup(user, competition, year, playerId) {
    const group = getGroup(user, competition, year);
    
    const initialLength = group.players.length;
    group.players = group.players.filter(p => p.playerId != playerId);
    
    if (group.players.length === initialLength) {
        throw errors.PLAYER_NOT_FOUND();
    }
}