import { errors } from '../common/foccacia-errors.mjs';

const BASE_URL = "http://api.football-data.org/v4";
const API_KEY = "b89c66ac9c1b470ca3096048970b21ac"; 

export async function apiFetch(url) {
    const response = await fetch(url, {
        headers: { 
            "X-Auth-Token": API_KEY 
        },
    });

    if (response.status === 429) {
        throw errors.RATE_LIMIT_EXCEEDED();
    }

    if (!response.ok) {
        throw errors.EXTERNAL_API_ERROR(response.status, url);
    }

    return await response.json();
}


export async function fetchCompetitions() {
    const url = `${BASE_URL}/competitions`;
    return await apiFetch(url);
}


export async function fetchTeams(competitionId, seasonYear) {
    const url = `${BASE_URL}/competitions/${competitionId}/teams?season=${seasonYear}`;
    return await apiFetch(url);
}
