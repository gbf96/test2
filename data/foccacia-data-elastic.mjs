import fetch from 'node-fetch'; 

const URI_PREFIX = 'http://localhost:9200';
const INDEX_USERS = 'foccacia-users';
const INDEX_GROUPS = 'foccacia-groups';

export function fetchElastic(method, path, body = undefined) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    };

    return fetch(URI_PREFIX + path, options)
        .then(async response => {
            if (response.status === 404) return { found: false, error: 'Not Found' };
            
            const json = await response.json();
            
            if (response.status >= 400) {
                console.error(`[Elastic Error] ${method} ${path}:`, json);
            }
            return json;
        });
}

function joinUserId(user, elasticId) {
    return Object.assign({ userId: elasticId }, user);
}

function joinGroupId(group, elasticId) {
    return Object.assign({ id: elasticId }, group);
}

export async function saveUser(username, password) {
    const user = { username, password };
    
    return fetchElastic('POST', `/${INDEX_USERS}/_doc?refresh=wait_for`, user)
        .then(body => {
            if (!body || !body._id) {
                throw new Error("Serviço de base de dados indisponível");
            }
            return joinUserId(user, body._id);
        });
}

function _runUserQuery(queryBody) {
    return fetchElastic('POST', `/${INDEX_USERS}/_search`, { query: queryBody })
        .then(body => {
            if (!body || body.error) return undefined;
            if (!body.hits || body.hits.hits.length === 0) return undefined;

            const hit = body.hits.hits[0];
            return joinUserId(hit._source, hit._id);
        });
}

export function getUserByUsername(username) {
    const query = {
        term: { "username.keyword": username }
    };
    return _runUserQuery(query);
}

export function getUserById(userId) {
    return fetchElastic('GET', `/${INDEX_USERS}/_doc/${userId}`)
        .then(body => {
            if (!body.found) return null;
            return joinUserId(body._source, body._id);
        });
}

function _findGroupDoc(userId, competition, year) {
    const query = {
        query: {
            bool: {
                must: [
                    { term: { "ownerId.keyword": userId } },
                    { match: { competition: competition } },
                    { match: { year: year } }
                ]
            }
        }
    };

    return fetchElastic('POST', `/${INDEX_GROUPS}/_search`, query)
        .then(body => {
            if (!body || !body.hits || body.hits.hits.length === 0) return null;
            return body.hits.hits[0]; 
        });
}

export async function findGroup(userId, competition, year) {
    const doc = await _findGroupDoc(userId, competition, year);
    if (doc) {
        return joinGroupId(doc._source, doc._id);
    }
    return undefined; 
}

export async function createGroup(userId, name, description, competition, year) {
    const existing = await findGroup(userId, competition, year);
    if (existing) return null;

    const group = {
        ownerId: userId,
        name: name,
        description: description,
        competition: competition,
        year: year,
        players: []
    };

    return fetchElastic('POST', `/${INDEX_GROUPS}/_doc?refresh=wait_for`, group)
        .then(body => {
            return joinGroupId(group, body._id);
        });
}

export async function listGroups() {
    return fetchElastic('POST', `/${INDEX_GROUPS}/_search?size=1000`)
        .then(body => {
            if (!body.hits) return [];
            return body.hits.hits.map(hit => joinGroupId(hit._source, hit._id));
        });
}

export async function updateGroup(userId, competition, year, name, description) {
    const doc = await _findGroupDoc(userId, competition, year);
    if (!doc) return null;

    const groupData = doc._source;
    const elasticId = doc._id;

    groupData.name = name;
    groupData.description = description;

    return fetchElastic('PUT', `/${INDEX_GROUPS}/_doc/${elasticId}?refresh=wait_for`, groupData)
        .then(() => joinGroupId(groupData, elasticId));
}

export async function deleteGroup(userId, competition, year) {
    const doc = await _findGroupDoc(userId, competition, year);
    if (!doc) return false;

    return fetchElastic('DELETE', `/${INDEX_GROUPS}/_doc/${doc._id}?refresh=wait_for`)
        .then(body => body.result === 'deleted');
}

export async function addPlayerToGroup(userId, competition, year, playerData) {
    const doc = await _findGroupDoc(userId, competition, year);
    if (!doc) return null;

    const groupData = doc._source;
    const elasticId = doc._id;

    groupData.players.push(playerData);

    return fetchElastic('PUT', `/${INDEX_GROUPS}/_doc/${elasticId}?refresh=wait_for`, groupData)
        .then(() => joinGroupId(groupData, elasticId));
}

export async function removePlayerFromGroup(userId, competition, year, playerId) {
    const doc = await _findGroupDoc(userId, competition, year);
    if (!doc) return false;

    const groupData = doc._source;
    const elasticId = doc._id;
    const initialLength = groupData.players.length;

    groupData.players = groupData.players.filter(p => p.playerId != playerId);

    if (groupData.players.length === initialLength) return false;

    await fetchElastic('PUT', `/${INDEX_GROUPS}/_doc/${elasticId}?refresh=wait_for`, groupData);
    return true;
}

export function getUserByToken(token) {
    const query = {
        term: { "token.keyword": token }
    };
    return _runUserQuery(query);
}