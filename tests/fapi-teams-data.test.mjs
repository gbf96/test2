import { INTERNAL_ERROR_CODES } from '../common/foccacia-errors.mjs';

import { expect } from 'chai';
import { fetchCompetitions, fetchTeams } from '../data/fapi-teams-data.mjs'; 
import { MOCK_SUCCESS_DATA_COMPETITIONS, MOCK_SUCCESS_DATA_TEAMS, createMockResponse } from '../mocks/fapi-teams-data-mock.mjs';

describe('fetchCompetitions', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.testCache = { data: null, expires: 0 };
    });

    after(() => {
        global.fetch = originalFetch;
    });

    it('Returns the list of competitions', async () => {
        global.fetch = async () => createMockResponse(200, MOCK_SUCCESS_DATA_COMPETITIONS);

        const result = await fetchCompetitions();

        expect(result).to.be.an('object'); 
        expect(result.competitions).to.be.an('array');
        expect(result.competitions).to.have.lengthOf(2);
        expect(result.competitions[1].code).to.equal('PPL');
    });


    it('Returns a 429 error (Rate limit reached)', async () => {
        global.fetch = async () => createMockResponse(429, { message: 'Too Many Requests' });

        try {
            await fetchCompetitions();
            throw new Error('Should have thrown a 429 error');
        } catch (error) {
            expect(error.internalError).to.equal(INTERNAL_ERROR_CODES.RATE_LIMIT_EXCEEDED);
        }
    });


    it('Returns a generic error (500)', async () => {
        global.fetch = async () => createMockResponse(500, { message: 'Server error' });

        try {
            await fetchCompetitions();
            throw new Error('Should have thrown an HTTP error');
        } catch (error) {
            expect(error.internalError).to.equal(INTERNAL_ERROR_CODES.EXTERNAL_API_ERROR);
        }
    });
});

describe('fetchTeams', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.testCache = { data: null, expires: 0 };
    });

    after(() => {
        global.fetch = originalFetch;
    });

    it('Returns the list of teams of a specific year', async () => {
        global.fetch = async () => createMockResponse(200, MOCK_SUCCESS_DATA_TEAMS);
        
        const competitionCode = 'PPL';
        const season = 2024;
        const result = await fetchTeams(competitionCode, season);

        expect(result).to.be.an('object'); 

        expect(result.competition.code).to.equal('PPL');
        expect(result.competition.name).to.equal('Primeira Liga');

        const sporting = result.teams[0];
        expect(sporting.id).to.equal(498);
        expect(sporting.name).to.equal('Sporting Clube de Portugal');
                
        const porto = result.teams[1];
        expect(porto.id).to.equal(503);
        expect(porto.name).to.equal('FC Porto');
    });


    it('Returns a 429 error (Rate limit reached)', async () => {
        global.fetch = async () => createMockResponse(429, { message: 'Too Many Requests' });

        try {
            const competitionCode = 'PPL';
            const season = 2024;
            const result = await fetchTeams(competitionCode, season);
            throw new Error('Should have thrown a 429 error');
        } catch (error) {
            expect(error.internalError).to.equal(INTERNAL_ERROR_CODES.RATE_LIMIT_EXCEEDED);
        }
    });


    it('Returns a generic error (500)', async () => {
        global.fetch = async () => createMockResponse(500, { message: 'Server error' });

        try {
            const competitionCode = 'PPL';
            const season = 2024;
            const result = await fetchTeams(competitionCode, season);
            throw new Error('Should have thrown an HTTP error');
        } catch (error) {
            expect(error.internalError).to.equal(INTERNAL_ERROR_CODES.EXTERNAL_API_ERROR);
        }
    });
});