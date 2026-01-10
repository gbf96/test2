import fetch from 'node-fetch'; // Certifique-se que tem o node-fetch ou use o fetch nativo do Node 18+

const URI_PREFIX = 'http://localhost:9200';
const INDEX_USERS = 'foccacia-users';
const INDEX_GROUPS = 'foccacia-groups';

// --- Funções Auxiliares ---

// Função genérica para fazer pedidos ao Elastic
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
            
            // Log de erro se o Elastic devolver algo inesperado (ex: erro 400)
            if (response.status >= 400) {
                console.error(`[Elastic Error] ${method} ${path}:`, json);
            }
            return json;
        });
}

// Combina os dados do utilizador com o ID do Elastic (transforma _id em userId)
function joinUserId(user, elasticId) {
    if (!elasticId) {
        console.error("AVISO: Tentativa de criar utilizador sem ID (elasticId undefined)");
    }
    return Object.assign({ userId: elasticId }, user);
}

// Combina os dados do grupo com o ID do Elastic
function joinGroupId(group, elasticId) {
    return Object.assign({ id: elasticId }, group);
}

// --- USERS (Autenticação e Sessão) ---

// 1. Criar Utilizador (Registo)
export async function saveUser(username, password) {
    const user = { username, password };
    
    return fetchElastic('POST', `/${INDEX_USERS}/_doc?refresh=wait_for`, user)
        .then(body => {
            // VERIFICAÇÃO DE SEGURANÇA
            if (!body || !body._id) {
                // Se o Elastic falhar (ex: 503), lançamos erro para o site tratar
                throw new Error("Serviço de base de dados indisponível (ElasticSearch Error)");
            }
            return joinUserId(user, body._id);
        });
}

// 2. Procurar por Username (Login)
function _runUserQuery(queryBody) {
    return fetchElastic('POST', `/${INDEX_USERS}/_search`, { query: queryBody })
        .then(body => {
            if (!body || body.error) return undefined;
            if (!body.hits || body.hits.hits.length === 0) return undefined;

            const hit = body.hits.hits[0];
            // Mapeia _source (dados) e _id (identificador)
            return joinUserId(hit._source, hit._id);
        });
}

export function getUserByUsername(username) {
    const query = {
        term: { "username.keyword": username }
    };
    return _runUserQuery(query);
}

// 3. Procurar por ID (Sessão Passport - deserializeUser)
export function getUserById(userId) {
    return fetchElastic('GET', `/${INDEX_USERS}/_doc/${userId}`)
        .then(body => {
            if (!body.found) return null;
            return joinUserId(body._source, body._id);
        });
}

// --- GROUPS (Funcionalidades existentes) ---

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