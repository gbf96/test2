export const INTERNAL_ERROR_CODES = {
    SERVER_ERROR: 1,
    INVALID_PARAMETER: 2,
    MISSING_PARAMETER: 3,
    INVALID_JSON_PARSER: 4,
    INVALID_USER: 5,
    USER_NOT_FOUND: 6,
    USER_ALREADY_EXISTS: 7,
    MISSING_TOKEN: 8,
    NOT_AUTHORIZED: 9,
    GROUP_NOT_FOUND: 10,
    GROUP_ALREADY_EXISTS: 11,
    GROUP_FULL: 12,
    PLAYER_ALREADY_IN_GROUP: 13,
    PLAYER_NOT_FOUND: 14,
    EXTERNAL_API_ERROR: 15,
    RATE_LIMIT_EXCEEDED: 16
};

export class AppError {
    constructor(code, description) {
        this.internalError = code;
        this.description = description;
    }
}

export const errors = {
    INVALID_PARAMETER: (what) => {
        return new AppError(INTERNAL_ERROR_CODES.INVALID_PARAMETER, `Invalid parameter: ${what}`);
    },
    MISSING_PARAMETER: (what) => {
        return new AppError(INTERNAL_ERROR_CODES.MISSING_PARAMETER, `Missing parameter: ${what}`);
    },
    INVALID_JSON_PARSER: () => {
        return new AppError(INTERNAL_ERROR_CODES.INVALID_JSON_PARSER, `Invalid JSON body.`);
    },

    INVALID_USER: (who) => {
        return new AppError(INTERNAL_ERROR_CODES.INVALID_USER, `Invalid username '${who}'.`);
    },
    USER_NOT_FOUND: () => { 
        return new AppError(INTERNAL_ERROR_CODES.USER_NOT_FOUND, `User not found.`);
    },
    USER_ALREADY_EXISTS: (who) => {
        return new AppError(INTERNAL_ERROR_CODES.USER_ALREADY_EXISTS, `User '${who}' already exists.`);
    },
    MISSING_TOKEN: () => { 
        return new AppError(INTERNAL_ERROR_CODES.MISSING_TOKEN, `Missing authentication token.`);
    },
    NOT_AUTHORIZED: () => { 
        return new AppError(INTERNAL_ERROR_CODES.NOT_AUTHORIZED, `You are not authorized to perform this action.`);
    },

    GROUP_NOT_FOUND: () => { 
        return new AppError(INTERNAL_ERROR_CODES.GROUP_NOT_FOUND, `Group not found.`);
    },
    GROUP_ALREADY_EXISTS: () => {
        return new AppError(INTERNAL_ERROR_CODES.GROUP_ALREADY_EXISTS, `A group for this competition and year already exists.`);
    },

    GROUP_FULL: () => {
        return new AppError(INTERNAL_ERROR_CODES.GROUP_FULL, `Group is full (max 11 players).`);
    },
    PLAYER_ALREADY_IN_GROUP: () => {
        return new AppError(INTERNAL_ERROR_CODES.PLAYER_ALREADY_IN_GROUP, `Player is already in the group.`);
    },
    PLAYER_NOT_FOUND: () => {
        return new AppError(INTERNAL_ERROR_CODES.PLAYER_NOT_FOUND, `Player not found in this group.`);
    },
    EXTERNAL_API_ERROR: (status, url) => {
        return new AppError(INTERNAL_ERROR_CODES.EXTERNAL_API_ERROR, `External API Error (${status}) while fetching ${url}`);
    },
    
    RATE_LIMIT_EXCEEDED: () => {
        return new AppError(INTERNAL_ERROR_CODES.RATE_LIMIT_EXCEEDED, `Football API rate limit reached. Please try again later.`);
    }
};