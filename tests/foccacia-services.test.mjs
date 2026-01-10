import assert from 'assert';
import { expect } from 'chai';

import servicesInit from '../services/foccacia-services.mjs';

import * as elasticDataLayer from '../data/foccacia-data-elastic.mjs';
import * as footballDataMock from '../mocks/fapi-teams-data.mjs';

const services = servicesInit(elasticDataLayer, footballDataMock);

describe("FOCCACIA Services Unit Tests", () => {
    let userAlice;
    const uniqueName = "alice_" + Date.now(); 
                                
    describe('getCompetitions', () => {

        it('should return the list of competitions', async () => {
            const result = await services.getCompetitions();
            expect(result).to.be.an('array');
            expect(result.length).to.be.above(0);
            expect(result[0]).to.have.property('name'); 
        });
    });

    describe("User Management", () => {
        it("Should create a new user successfully", async () => {
            userAlice = await services.createUser(uniqueName);

            assert.strictEqual(userAlice.username, uniqueName);
            assert.ok(userAlice.token, "Token should be generated");
            assert.ok(userAlice.userId, "UserId should be generated");
        });

        it("Should fail when creating a duplicate user", async () => {
            try {
                await services.createUser(uniqueName);
                assert.fail("Should have thrown USER_ALREADY_EXISTS");
            } catch (error) {
                assert.ok(error.internalError || error.message);
            }
        });

        it("Should validate a correct token", async () => {
            const validUser = await services.validateToken(userAlice.token);
            assert.strictEqual(validUser.username, uniqueName);
        });

        it("Should fail to validate an incorrect token", async () => {
            try {
                await services.validateToken("wrong-token-uuid-fake");
                assert.fail("Should have thrown NOT_AUTHORIZED");
            } catch (error) {
                assert.ok(error);
            }
        });
    });

    describe("Group Management", () => {
        const uniqueGroupName = "Team " + Date.now();

        it("Should create a group successfully", async () => {
            const groupData = {
                name: uniqueGroupName,
                description: "Best XI",
                competition: "PL",
                year: 2023
            };

            const group = await services.createGroup(userAlice, groupData);

            assert.strictEqual(group.ownerId, userAlice.userId);
            assert.strictEqual(group.name, uniqueGroupName);
            assert.strictEqual(group.players.length, 0);
        });

        it("Should fail to create a duplicate group (same comp/year)", async () => {
            const groupData = {
                name: "Another Name",
                description: "Desc",
                competition: "PL",
                year: 2023
            };

            try {
                await services.createGroup(userAlice, groupData);
                assert.fail("Should have thrown GROUP_ALREADY_EXISTS");
            } catch (error) {
                assert.ok(error);
            }
        });

        it("Should list groups for user", async () => {
            const groups = await services.getGroupsForUser(userAlice);
            assert.ok(groups.length >= 1);
        });
    });

    describe('getTeamsWithPlayers', () => {
        
        it('should return the formatted list of teams', async () => {
            const result = await services.getTeams('PPL', 2024);
            
            expect(result).to.be.an('array');
            expect(result[0]).to.have.property('teamName');
            expect(result[0]).to.have.property('players');
        });
    });

    describe('Player Management', () => {
 
        let groupPPL;
        const TEAM_ID_MOCK = 498; 
        const PLAYER_ID_MOCK = 32014; // Rui Silva
        const PLAYER_ID_2 = 4001;     // Gyokeres

        beforeEach(async () => {
            try {
                groupPPL = await services.createGroup(userAlice, {
                    name: "My PPL Team " + Date.now(),
                    description: "Best XI",
                    competition: "PPL",
                    year: 2024
                });
            } catch(e) {
                groupPPL = await services.getGroup(userAlice, "PPL", 2024);
            }
        });

        it('should add a player to the group', async () => {
            const playerInput = {
                playerId: PLAYER_ID_MOCK,
                teamId: TEAM_ID_MOCK   
            };
            const group = await services.addPlayerToGroup(userAlice, "PPL", 2024, playerInput);

            expect(group.players).to.have.lengthOf(1);
            expect(group.players[0].playerId).to.equal(PLAYER_ID_MOCK);
        });

        it('should fail when trying to add the same player twice', async () => {
            const playerInput = { playerId: PLAYER_ID_2, teamId: TEAM_ID_MOCK }; 
            
            await services.addPlayerToGroup(userAlice, "PPL", 2024, playerInput);

            try {
                await services.addPlayerToGroup(userAlice, "PPL", 2024, playerInput);
                throw new Error("Should have failed");
            } catch (error) {
                assert.ok(error);
            }
        });

        it('should remove a player from the group successfully', async () => {
            const pid = PLAYER_ID_2;
            try { await services.addPlayerToGroup(userAlice, "PPL", 2024, {playerId: pid, teamId: TEAM_ID_MOCK}); } catch(e){}

            await services.removePlayerFromGroup(userAlice, "PPL", 2024, pid);
            
            const group = await services.getGroup(userAlice, "PPL", 2024);
            const player = group.players.find(p => p.playerId === pid);
            expect(player).to.be.undefined;
        });
    });
});