import { errorToHttp } from './common/errors-to-http-responses.mjs';

export default function init(services) {

    return {
        createUser,
        listCompetitions,
        createGroup,
        listGroups,
        getGroup,
        editGroup,
        deleteGroup,
        addPlayerToGroup,
        removePlayerFromGroup,
        getTeamsByCompetition,
        authMiddleware
    };

    async function processRequest(req, res, action) {
        try {
            const result = await action();
            if (result) {
                const status = req.method === 'POST' ? 201 : 200;
                res.status(status).json(result);
            } else {
                res.status(204).send();
            }
        } catch (error) {
            const httpError = errorToHttp(error);
            res.status(httpError.status).json(httpError.body);
        }
    }

    function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header (Bearer <token>) required.' });
    }
    const token = authHeader.split(' ')[1];
    
    try {
        req.user = services.validateToken(token); 
        next();
    } catch (error) {
        const httpError = errorToHttp(error);
        res.status(httpError.status).json(httpError.body);
    }
    }

    function createUser(req, res) {
        processRequest(req, res, () => {
            return services.createUser(req.body.username);
        });
    }

    function listCompetitions(req, res) {
        processRequest(req, res, async () => {
            return await services.getCompetitions();
        });
    }

    function createGroup(req, res) {
        processRequest(req, res, () => {
            return services.createGroup(req.user, req.body);
        });
    }

    function listGroups(req, res) {
        processRequest(req, res, () => {
            return services.getGroupsForUser(req.user);
        });
    }

    function getGroup(req, res) {
        processRequest(req, res, () => {
            const { competition, year } = req.params;
            return services.getGroup(req.user, competition, year);
        });
    }

    function editGroup(req, res) {
        processRequest(req, res, () => {
            const { competition, year } = req.params;
            return services.editGroup(req.user, competition, year, req.body);
        });
    }

    function deleteGroup(req, res) {
        processRequest(req, res, () => {
            const { competition, year } = req.params;
            return services.deleteGroup(req.user, competition, year);
        });
    }

    function addPlayerToGroup(req, res) {
        processRequest(req, res, () => {
            const { competition, year } = req.params;
            return services.addPlayerToGroup(req.user, competition, year, req.body);
        });
    }

    function removePlayerFromGroup(req, res) {
        processRequest(req, res, () => {
            const { competition, year, playerId } = req.params;
            return services.removePlayerFromGroup(req.user, competition, year, playerId);
        });
    }

    function getTeamsByCompetition(req, res) {
        processRequest(req, res, async () => {
            const { competition, year } = req.params;
            return await services.getTeams(competition, year);
        });
    }
}