import { INTERNAL_ERROR_CODES } from './foccacia-errors.mjs';

class HttpResponseError {
    constructor(status, e) {
        this.status = status;
        this.body = {
            code: e.internalError,
            error: e.description
        };
    }
}

export function errorToHttp(e) {

    switch(e.internalError) {
        // 400 Bad Request
        case INTERNAL_ERROR_CODES.INVALID_USER: 
        case INTERNAL_ERROR_CODES.INVALID_PARAMETER: 
        case INTERNAL_ERROR_CODES.MISSING_PARAMETER: 
        case INTERNAL_ERROR_CODES.INVALID_JSON_PARSER: 
            return new HttpResponseError(400, e);

        // 401 Unauthorized
        case INTERNAL_ERROR_CODES.MISSING_TOKEN: 
            return new HttpResponseError(401, e);

        // 403 Forbidden
        case INTERNAL_ERROR_CODES.NOT_AUTHORIZED: 
            return new HttpResponseError(403, e);

        // 404 Not Found
        case INTERNAL_ERROR_CODES.USER_NOT_FOUND: 
        case INTERNAL_ERROR_CODES.GROUP_NOT_FOUND:
        case INTERNAL_ERROR_CODES.PLAYER_NOT_FOUND:
            return new HttpResponseError(404, e);

        // 409 Conflict
        case INTERNAL_ERROR_CODES.USER_ALREADY_EXISTS: 
        case INTERNAL_ERROR_CODES.GROUP_ALREADY_EXISTS:
        case INTERNAL_ERROR_CODES.GROUP_FULL:
        case INTERNAL_ERROR_CODES.PLAYER_ALREADY_IN_GROUP:
            return new HttpResponseError(409, e);

        // 502 Bad Gateway
        case INTERNAL_ERROR_CODES.EXTERNAL_API_ERROR: 
            return new HttpResponseError(502, e);

        // 429 Too Many Requests
        case INTERNAL_ERROR_CODES.RATE_LIMIT_EXCEEDED: 
            return new HttpResponseError(429, e);

        // Default 500
        default: 
            console.error("ERRO NÃO TRATADO:", e);

            return new HttpResponseError(500, {
                internalError: INTERNAL_ERROR_CODES.SERVER_ERROR,
                description: e.message || "Unknown internal error."
            });
    }
}