import crypto from 'crypto';
import { errors, INTERNAL_ERROR_CODES } from '../common/foccacia-errors.mjs';

export default function init(data_mem, default_teams_data) {

    function createUser(username) {
        if (!username) throw errors.MISSING_PARAMETER('username');

        const existingUser = data_mem.getUserByUsername(username);
        if (existingUser) throw errors.USER_ALREADY_EXISTS(username);

        const token = crypto.randomUUID();
        const user = data_mem.saveUser(username, token);

        return { token: user.token, userId: user.userId, username: user.username };
    }

    function validateToken(token) {
        const user = data_mem.getUserByToken(token);
        if (!user) throw errors.NOT_AUTHORIZED();
        return user;
    }

    function createGroup(user, groupData) {
        const { name, description, competition, year } = groupData;
        if (!name || !description || !competition || !year) throw errors.MISSING_PARAMETER('fields');

        const group = data_mem.createGroup(user.userId, name, description, competition, year);
        if (!group) throw errors.GROUP_ALREADY_EXISTS();

        return group;
    }

    function getGroupsForUser(user) {
        const allGroups = data_mem.listGroups();
        return allGroups.filter(group => group.ownerId === user.userId);
    }

    function getGroup(user, competition, year) {
        const group = data_mem.findGroup(user.userId, competition, year);
        if (!group) throw errors.GROUP_NOT_FOUND();
        return group;
    }

    function editGroup(user, competition, year, groupData) {
        const { name, description } = groupData;
        if (!name || !description) throw errors.MISSING_PARAMETER('name or description');

        const group = data_mem.updateGroup(user.userId, competition, year, name, description);
        if (!group) throw errors.GROUP_NOT_FOUND();
        return group;
    }

    function deleteGroup(user, competition, year) {
        const deleted = data_mem.deleteGroup(user.userId, competition, year);
        if (!deleted) throw errors.GROUP_NOT_FOUND();
    }

    const RETRY_DELAY_MS = 60000; // 60 segundos
    const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas

    const dataCache = {
        competitions: {
            data: null,
            expires: 0
        }
    };

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function _formatCompetitions(apiResponse) {
        if (Array.isArray(apiResponse)) {
            return apiResponse;
        }
        if (apiResponse && apiResponse.competitions) {
            return apiResponse.competitions.map(comp => ({
                name: comp.name,
                code: comp.code
            }));
        }
        return [];
    }

    async function getCompetitions(teamsData = default_teams_data) {
        const now = Date.now();
        const cacheEntry = dataCache.competitions;

        if (cacheEntry.data && cacheEntry.expires > now) {
            return cacheEntry.data;
        }

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const rawData = await teamsData.fetchCompetitions();
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

    function _resetCacheForTests() {
        dataCache.competitions.data = null;
        dataCache.competitions.expires = 0;
    }

    async function getTeams(competition, year, teamsData = default_teams_data) {
        if (!competition || !year) {
            throw errors.MISSING_PARAMETER('competition or year');
        }
        const response = await teamsData.fetchTeams(competition, year);

        return response.teams.map(team => ({
            teamName: team.name,
            country: team.area.name,
            players: team.squad.map(p => ({
                name: p.name,
                position: p.position
            }))
        }));
    }

    function calculateAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    async function addPlayerToGroup(user, competition, year, playerDataInput, teamsData = default_teams_data) {
        const group = getGroup(user, competition, year);

        if (group.players.length >= 11) {
            throw errors.GROUP_FULL();
        }

        const alreadyInGroup = group.players.find(p => p.playerId == playerDataInput.playerId);
        if (alreadyInGroup) {
            throw errors.PLAYER_ALREADY_IN_GROUP();
        }

        const apiResponse = await teamsData.fetchTeams(competition, year);

        if (!apiResponse || !apiResponse.teams) {
            throw errors.EXTERNAL_API_ERROR(404, `Competition ${competition} data unavailable`);
        }


        const officialTeam = apiResponse.teams.find(t => t.id == playerDataInput.teamId);

        if (!officialTeam) {
            throw errors.INVALID_PARAMETER(`Team ${playerDataInput.teamId} does not exist in ${competition} ${year}`);
        }

        if (!officialTeam.squad) {
            throw errors.EXTERNAL_API_ERROR(500, "Squad data missing from API");
        }

        const officialPlayer = officialTeam.squad.find(p => p.id == playerDataInput.playerId);

        if (!officialPlayer) {
            throw errors.INVALID_PARAMETER(`Player ${playerDataInput.playerId} not found in team ${officialTeam.name}`);
        }

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

        data_mem.addPlayerToGroup(user.userId, competition, year, fullPlayerData);

        return group;
    }

    function removePlayerFromGroup(user, competition, year, playerId) {
        const group = getGroup(user, competition, year, data_mem);
        const playerExists = group.players.find(p => p.playerId == playerId);

        if (!playerExists) {
            throw errors.PLAYER_NOT_FOUND(playerId);
        }

        const wasRemoved = data_mem.removePlayerFromGroup(user.userId, competition, year, playerId);

        if (!wasRemoved) {
            throw errors.PLAYER_NOT_FOUND(playerId);
        }
    }

    return {
        createUser,
        validateToken,
        createGroup,
        getGroupsForUser,
        getGroup,
        editGroup,
        deleteGroup,
        getCompetitions,
        _resetCacheForTests,
        getTeams,
        addPlayerToGroup,
        removePlayerFromGroup
    };
}