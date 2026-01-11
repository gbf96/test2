import initServices from './services/foccacia-services.mjs';
import * as foccaciaData from './data/foccacia-data-elastic.mjs';
import * as teamsData from './data/fapi-teams-data.mjs';
import { INTERNAL_ERROR_CODES } from './common/foccacia-errors.mjs';

const services = initServices(foccaciaData, teamsData);

const TEST_USER = {
    username: "foccacia",
    password: "password"
};

const TEST_GROUP = {
    name: "Premier League 2023 Fans",
    description: "Grupo de teste com jogadores da PL",
    competition: "PL", 
    year: 2023         
};

const TEST_PLAYER_INPUT = {
    teamId: 57,      
    playerId: 4832  
};
const TEST_PLAYER_INPUT2 = {
    teamId: 61,      
    playerId: 3953  
};
const TEST_PLAYER_INPUT3 = {
    teamId: 356,      
    playerId: 115078
};

async function run() {
    console.log("A iniciar o Povoamento de Dados..");

    try {
        let user;
        
        try {
            user = await services.createUser(TEST_USER.username, TEST_USER.password);
        } catch (err) {
            if (err.internalError === INTERNAL_ERROR_CODES.USER_ALREADY_EXISTS) {
                console.log(`Utilizador já existe. A obter dados...`);
                user = await services.verifyUser(TEST_USER.username, TEST_USER.password);
            } else {
                throw err;
            }
        }

        if (!user) {
            throw new Error("Falha ao obter o utilizador.");
        }

        console.log(`A criar grupo: ${TEST_GROUP.name}...`);
        let group;
        try {
            group = await services.createGroup(user, TEST_GROUP);
        } catch (err) {
            if (err.internalError === INTERNAL_ERROR_CODES.GROUP_ALREADY_EXISTS) {
                console.log(`ℹGrupo já existe. A obter detalhes...`);
                group = await services.getGroup(user, TEST_GROUP.competition, TEST_GROUP.year);
            } else {
                throw err;
            }
        }


        console.log(`A adicionar jogadores`);
        try {
            await services.addPlayerToGroup(user, TEST_GROUP.competition, TEST_GROUP.year, TEST_PLAYER_INPUT);
            await services.addPlayerToGroup(user, TEST_GROUP.competition, TEST_GROUP.year, TEST_PLAYER_INPUT2);
            await services.addPlayerToGroup(user, TEST_GROUP.competition, TEST_GROUP.year, TEST_PLAYER_INPUT3);
        } catch (err) {
            if (err.internalError === INTERNAL_ERROR_CODES.PLAYER_ALREADY_IN_GROUP) {
                console.log(`ℹO jogador já está no grupo.`);
            } else if (err.internalError === INTERNAL_ERROR_CODES.GROUP_FULL) {
                console.log(`O grupo já está cheio.`);
            } else {
                console.error("Erro ao adicionar jogador:", err.message);
            }
        }
        console.log("Povoamento concluído!");
        console.log(`Login: ${TEST_USER.username}`);
        console.log(`Password: ${TEST_USER.password}`);


    } catch (error) {
        console.error("\nErro no script de povoamento:", error);
        process.exit(1);
    }
}

run();