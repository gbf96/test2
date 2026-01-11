import crypto from 'crypto';
import { errors, INTERNAL_ERROR_CODES } from '../common/foccacia-errors.mjs';

export default function init(foccaciaDataLayer, fapiDataLayer) {

    const RETRY_DELAY_MS = 60000; 
    const CACHE_TTL_MS = 1000 * 60 * 60 * 24; 

    const dataCache = {
        competitions: { data: null, expires: 0 },
        teams: {} 
    };

    return {
        createUser,
        verifyUser,
        getUser,
        getOrCreateUser,
        validateToken,
        createGroup,
        getGroupsForUser,
        getGroup,
        editGroup,
        deleteGroup,
        getCompetitions,
        getTeams,
        addPlayerToGroup,
        removePlayerFromGroup,
        fetchAndCacheTeams,
        _resetCacheForTests
    };

    async function createUser(username, password) {
    if (!username || !password) throw errors.MISSING_PARAMETER('username or password');
    
    const existingUser = await foccaciaDataLayer.getUserByUsername(username);
    if (existingUser) throw errors.USER_ALREADY_EXISTS(username);

    const user = await foccaciaDataLayer.saveUser(username, password);
        return user; 
    }

    async function verifyUser(username, password) {
        const user = await foccaciaDataLayer.getUserByUsername(username);
        if (user && user.password === password) {
            return user;
        }
        return null;
    }

    async function getUser(username) {
        if (!username) throw errors.MISSING_PARAMETER('username');
        
        const user = await foccaciaDataLayer.getUserByUsername(username);
        
        if (!user) {
            throw errors.NOT_AUTHORIZED("User not found");
        }
        
        return user;
    }

    async function getOrCreateUser(username) {
        try {
            return await createUser(username);
        } catch (err) {
            if (err.internalError === INTERNAL_ERROR_CODES.USER_ALREADY_EXISTS) {
                return await getUser(username);
            }
            throw err;
        }
    }

    async function validateToken(token) {
        const user = await foccaciaDataLayer.getUserByToken(token);
        if (!user) throw errors.NOT_AUTHORIZED();
        return user; 
    }

    async function createGroup(user, groupData) {
        const { name, description, competition, year } = groupData;
        if (!name || !description || !competition || !year) throw errors.MISSING_PARAMETER('fields');

        const group = await foccaciaDataLayer.createGroup(user.userId, name, description, competition, year);
        if (!group) throw errors.GROUP_ALREADY_EXISTS();
    
        return group;
    }

    async function getGroupsForUser(user) {
        const allGroups = await foccaciaDataLayer.listGroups();
        return allGroups.filter(group => group.ownerId === user.userId);
    }

    async function getGroup(user, competition, year) {
        const group = await foccaciaDataLayer.findGroup(user.userId, competition, year);
        if (!group) throw errors.GROUP_NOT_FOUND();
        return group;
    }

    async function editGroup(user, competition, year, groupData) {
        const { name, description } = groupData;
        if (!name || !description) throw errors.MISSING_PARAMETER('name or description');

        const group = await foccaciaDataLayer.updateGroup(user.userId, competition, year, name, description);
        if (!group) throw errors.GROUP_NOT_FOUND();
        return group;
    }

    async function deleteGroup(user, competition, year) {
        const deleted = await foccaciaDataLayer.deleteGroup(user.userId, competition, year);
        if (!deleted) throw errors.GROUP_NOT_FOUND();
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function _formatCompetitions(apiResponse) {
        if (Array.isArray(apiResponse)) {
            return apiResponse;
        }
        if (apiResponse && apiResponse.competitions) {
            return apiResponse.competitions.map(comp => ({
                id: comp.id,
                name: comp.name,
                code: comp.code
            }));
        }
        return [];
    }

    async function getCompetitions() {
        const now = Date.now();
        const cacheEntry = dataCache.competitions;

        if (cacheEntry.data && cacheEntry.expires > now) {
            return cacheEntry.data; 
        }

        for (let attempt = 0; attempt < 2; attempt++) { 
            try {
                const rawData = await fapiDataLayer.fetchCompetitions();
                const formattedData = _formatCompetitions(rawData);

                cacheEntry.data = formattedData;
                cacheEntry.expires = now + CACHE_TTL_MS;
                
                return formattedData;

            } catch (err) {
                if (err.internalError === INTERNAL_ERROR_CODES.RATE_LIMIT_EXCEEDED) {                
                    if (attempt < 1) { 
                        await delay(RETRY_DELAY_MS);
                        continue; 
                    }
                } else {
                    break; 
                }
            }
        }

        if (cacheEntry.data) {
            return cacheEntry.data;
        }

        throw errors.EXTERNAL_API_ERROR(500, "Competitions"); 
    }

    async function fetchAndCacheTeams(competition, year) {
        if (!competition || !year) throw errors.MISSING_PARAMETER('competition or year');

        const now = Date.now();
        const cacheKey = `${competition}-${year}`;

        if (dataCache.teams[cacheKey] && dataCache.teams[cacheKey].expires > now) {
            return dataCache.teams[cacheKey].data;
        }

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await fapiDataLayer.fetchTeams(competition, year);
                if (!response || !response.teams) {
                    throw errors.EXTERNAL_API_ERROR(404, "Data unavailable");
                }

                const teamsData = response.teams.map(team => ({
                    id: team.id,
                    name: team.name,
                    tla: team.tla, 
                    area: { name: team.area.name },
                    squad: team.squad.map(p => ({
                        id: p.id,
                        name: p.name,
                        position: p.position,
                        dateOfBirth: p.dateOfBirth,
                        nationality: p.nationality
                    }))
                }));

                dataCache.teams[cacheKey] = {
                    data: teamsData,
                    expires: now + CACHE_TTL_MS
                };
                
                return teamsData;

            } catch (err) {
                if (err.internalError === INTERNAL_ERROR_CODES.RATE_LIMIT_EXCEEDED && attempt < 1) {
                    await delay(RETRY_DELAY_MS);
                    continue;
                }
                if (attempt === 1) throw err; 
            }
        }
        
        if (dataCache.teams[cacheKey]) return dataCache.teams[cacheKey].data;

        throw errors.EXTERNAL_API_ERROR(500, "Unable to fetch teams");
    }

    async function getTeams(competition, year) {
        const teams = await fetchAndCacheTeams(competition, year);

        return teams.map(team => ({
            id: team.id,
            teamName: team.name,
            country: team.area.name,
            players: team.squad.map(p => ({
                id: p.id,
                name: p.name,
                position: p.position
            }))
        }));
    }

    async function addPlayerToGroup(user, competition, year, playerDataInput) {
        const group = await getGroup(user, competition, year);

        if (group.players.length >= 11) throw errors.GROUP_FULL();
        if (group.players.find(p => p.playerId == playerDataInput.playerId)) {
            throw errors.PLAYER_ALREADY_IN_GROUP();
        }

        const teams = await fetchAndCacheTeams(competition, year);
        
        const officialTeam = teams.find(t => t.id == playerDataInput.teamId);
        if (!officialTeam) throw errors.INVALID_PARAMETER(`Team not found`);

        const officialPlayer = officialTeam.squad.find(p => p.id == playerDataInput.playerId);
        if (!officialPlayer) throw errors.INVALID_PARAMETER(`Player not found`);

        const fullPlayerData = {
            playerId: officialPlayer.id,
            playerName: officialPlayer.name,
            teamId: officialTeam.id,
            teamName: officialTeam.name,
            teamCode: officialTeam.tla,
            position: officialPlayer.position,
            nationality: officialPlayer.nationality,
            age: calculateAge(officialPlayer.dateOfBirth) 
        };

        await foccaciaDataLayer.addPlayerToGroup(user.userId, competition, year, fullPlayerData);
        return await getGroup(user, competition, year);
    }


    function calculateAge(dateString) {
        if (!dateString) return 0; 
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    async function removePlayerFromGroup(user, competition, year, playerId) { 
        const group = await getGroup(user, competition, year); 
        const p = group.players.find(x => x.playerId == playerId); 
        if (!p) throw errors.PLAYER_NOT_FOUND(playerId); 
        const rem = await foccaciaDataLayer.removePlayerFromGroup(user.userId, competition, year, playerId); 
        if (!rem) throw errors.PLAYER_NOT_FOUND(playerId); 
    }

    function _resetCacheForTests() {
        dataCache.competitions.data = null;
        dataCache.competitions.expires = 0;
        dataCache.teams = {};
    }
}






