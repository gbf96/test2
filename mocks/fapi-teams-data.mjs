import { MOCK_SUCCESS_DATA_COMPETITIONS, MOCK_SUCCESS_DATA_TEAMS } from './fapi-teams-data-mock.mjs';

export async function apiFetch(url) {
    return {}; 
}

export async function fetchCompetitions() {
    return MOCK_SUCCESS_DATA_COMPETITIONS;
}


export async function fetchTeams(competitionId, seasonYear) {
    return MOCK_SUCCESS_DATA_TEAMS;
}