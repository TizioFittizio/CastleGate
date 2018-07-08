import { Response } from 'express';

export enum ERROR_OCCURRED {
    GENERIC_ERROR = 'GENERIC_ERROR',
    ALREADY_PRESENT_EMAIL = 'ALREADY_PRESENT_EMAIL',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    TOKEN_REQUIRED = 'TOKEN_REQUIRED',
    NEW_TOKEN_REQUIRED = 'NEW_TOKEN_REQUIRED',
    DISABLED_USER = 'DISABLED_USER',
    LOGIN_FAILED = 'LOGIN_FAILED',
    MONGO_ERROR = 'MONGO_ERROR',
    MISSING_API_KEY = 'MISSING_API_KEY',
    INVALID_API_KEY = 'INVALID_API_KEY'
}

/**
 * Class used to reply to the client with a formatted error
 */
export abstract class ErrorManager {

    /**
     * Send to the client a formatted error, the error should be an ERROR_OCURRED,
     * this will give the appropriate status code to the client
     */
    public static sendErrorResponse = (res: Response, error: ERROR_OCCURRED | string) => {
        if (typeof error === 'string') {
            error = ErrorManager.getErrorTypeFromString(error);
        }
        const errorOccured = error as ERROR_OCCURRED;
        res
            .status(ErrorManager.getErrorStatus(errorOccured))
            .contentType('application/json')
            .send(ErrorManager.getResponse(errorOccured));
    }

    private static getErrorTypeFromString = (error: string): ERROR_OCCURRED => {
        for (const e in ERROR_OCCURRED) {
            if (error === e) {
                return e as ERROR_OCCURRED;
            }
        }
        return ERROR_OCCURRED.GENERIC_ERROR;
    }

    private static getResponse(error: ERROR_OCCURRED, data?: any) {
        return {
            error,
            data
        };
    }

    private static getErrorStatus(e: ERROR_OCCURRED) {
        let status = 400;
        switch (e){
            case ERROR_OCCURRED.DISABLED_USER:
                status = 403;
                break;
            case ERROR_OCCURRED.LOGIN_FAILED:
            case ERROR_OCCURRED.TOKEN_REQUIRED:
            case ERROR_OCCURRED.NEW_TOKEN_REQUIRED:
                status = 401;
                break;
        }
        return status;
    }

}
