export const MOCK_SUCCESS_DATA_COMPETITIONS = {
    "count": 2,
    "filters": {},
    "competitions": [
        {
            "id": 2001,
            "area": { "id": 2077, "name": "Europe", "code": "EUR" },
            "name": "UEFA Champions League",
            "code": "CL",
            "plan": "TIER_ONE"
        },
        {
            "id": 2017,
            "area": { "id": 2187, "name": "Portugal", "code": "POR" },
            "name": "Primeira Liga",
            "code": "PPL",
            "plan": "TIER_ONE"
        }
    ]
};

export const MOCK_SUCCESS_DATA_TEAMS = {
    "count": 2,
    "filters": {
        "season": 2024
    },
    "competition": {
        "id": 2017,
        "name": "Primeira Liga",
        "code": "PPL",
        "type": "LEAGUE",
        "emblem": "https://crests.football-data.org/PPL.png"
    },
    "season": {
        "id": 2312,
        "startDate": "2024-08-11",
        "endDate": "2025-05-17",
        "currentMatchday": 34,
        "winner": null
    },
    "teams": [
        {
            "area": {
                "id": 2187,
                "name": "Portugal",
                "code": "POR",
                "flag": "https://crests.football-data.org/765.svg"
            },
            "id": 498,
            "name": "Sporting Clube de Portugal",
            "shortName": "Sporting CP",
            "tla": "SPO",
            "crest": "https://crests.football-data.org/498.png",
            "address": "Edifício Visconde de Alvalade, Apartado 42099 Lisboa 1601-801",
            "website": "http://www.sporting.pt",
            "founded": 1906,
            "clubColors": "Green / White",
            "venue": "Estádio José Alvalade",
            "runningCompetitions": [
                {
                    "id": 2017,
                    "name": "Primeira Liga",
                    "code": "PPL",
                    "type": "LEAGUE",
                    "emblem": "https://crests.football-data.org/PPL.png"
                },
                {
                    "id": 2001,
                    "name": "UEFA Champions League",
                    "code": "CL",
                    "type": "CUP",
                    "emblem": "https://crests.football-data.org/CL.png"
                }
            ],
            "coach": {
                "id": 136188,
                "firstName": "",
                "lastName": "Rui Borges",
                "name": "Rui Borges",
                "dateOfBirth": "1981-07-07",
                "nationality": "Portugal",
                "contract": {
                    "start": "2024-12",
                    "until": "2026-06"
                }
            },
            "squad": [
                {
                    "id": 32014,
                    "name": "Rui Silva",
                    "position": "Goalkeeper",
                    "dateOfBirth": "1994-02-07",
                    "nationality": "Portugal"
                },
                {
                    "id": 4001,
                    "name": "Viktor Gyökeres",
                    "position": "Offence",
                    "dateOfBirth": "1998-06-04",
                    "nationality": "Sweden"
                },
                {
                    "id": 97893,
                    "name": "Franco Israel",
                    "position": "Goalkeeper",
                    "dateOfBirth": "2000-04-22",
                    "nationality": "Uruguay"
                },
                {
                    "id": 178770,
                    "name": "Diego Calai",
                    "position": "Goalkeeper",
                    "dateOfBirth": "2004-07-18",
                    "nationality": "Brazil"
                },
                {
                    "id": 194860,
                    "name": "Francisco Silva",
                    "position": "Goalkeeper",
                    "dateOfBirth": "2005-11-20",
                    "nationality": "Portugal"
                },
                {
                    "id": 202181,
                    "name": "Diogo Pinto",
                    "position": "Goalkeeper",
                    "dateOfBirth": "2004-06-18",
                    "nationality": "Portugal"
                }
            ],
            "staff": [],
            "lastUpdated": "2022-07-26T17:38:53Z"
        },
        {
            "area": {
                "id": 2187,
                "name": "Portugal",
                "code": "POR",
                "flag": "https://crests.football-data.org/765.svg"
            },
            "id": 503,
            "name": "FC Porto",
            "shortName": "Porto",
            "tla": "FCP",
            "crest": "https://crests.football-data.org/503.png",
            "address": "Estádio do Dragão, Entrada Poente - Piso 3 Porto 4350-451",
            "website": "http://www.fcporto.pt",
            "founded": 1893,
            "clubColors": "Blue / White",
            "venue": "Estádio Do Dragão",
            "runningCompetitions": [
                {
                    "id": 2017,
                    "name": "Primeira Liga",
                    "code": "PPL",
                    "type": "LEAGUE",
                    "emblem": "https://crests.football-data.org/PPL.png"
                },
                {
                    "id": 2146,
                    "name": "UEFA Europa League",
                    "code": "EL",
                    "type": "CUP",
                    "emblem": "https://crests.football-data.org/EL.png"
                }
            ],
            "coach": {
                "id": 166183,
                "firstName": "Francesco",
                "lastName": "Farioli",
                "name": "Francesco Farioli",
                "dateOfBirth": "1989-04-10",
                "nationality": "Italy",
                "contract": {
                    "start": "2025-07",
                    "until": "2027-06"
                }
            },
            "squad": [
                {
                    "id": 13887,
                    "name": "Samuel Portugal",
                    "position": "Goalkeeper",
                    "dateOfBirth": "1994-03-29",
                    "nationality": "Brazil"
                },
                {
                    "id": 37362,
                    "name": "Diogo Costa",
                    "position": "Goalkeeper",
                    "dateOfBirth": "1999-09-19",
                    "nationality": "Portugal"
                },
                {
                    "id": 45217,
                    "name": "Cláudio Ramos",
                    "position": "Goalkeeper",
                    "dateOfBirth": "1991-11-16",
                    "nationality": "Portugal"
                },
                {
                    "id": 161171,
                    "name": "André Lopes",
                    "position": "Defence",
                    "dateOfBirth": "2001-11-02",
                    "nationality": "Portugal"
                },
                {
                    "id": 227047,
                    "name": "Martim Fernandes",
                    "position": "Defence",
                    "dateOfBirth": "2006-01-18",
                    "nationality": "Portugal"
                }
            ],
            "staff": [],
            "lastUpdated": "2022-02-10T19:26:43Z"
        }
    ]
};


export const createMockResponse = (status, data) => {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status: status,
        json: () => Promise.resolve(data),
    });
};



