import { Response } from 'express';

export enum ERROR_OCCURRED {
    GENERIC_ERROR = 'GENERIC_ERROR',
    ALREADY_PRESENT_EMAIL = 'ALREADY_PRESENT_EMAIL',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    TOKEN_REQUIRED = 'TOKEN_REQUIRED',
    NEW_TOKEN_REQUIRED = 'NEW_TOKEN_REQUIRED',
    DISABLED_USER = 'DISABLED_USER',
    LOGIN_FAILED = 'LOGIN_FAILED',
    MONGO_ERROR = 'MONGO_ERROR'
}

// asd export class ErrorResponse {

//     private error: ERROR_OCCURRED;
//     private data: object;

//     constructor(error: ERROR_OCCURRED, data?: object) {
//         this.error = error;
//         this.data = data || {};
//     }

//     public get() {
//         return JSON.stringify({
//             errorCode: this.error,
//             data: this.data
//         });
//     }

// }

// TODO DOCUMENT THIS CLASS

export abstract class ErrorManager {

    public static getErrorTypeFromString = (error: string): ERROR_OCCURRED => {
        for (const e in ERROR_OCCURRED) {
            if (error === e) {
                return e as ERROR_OCCURRED;
            }
        }
        return ERROR_OCCURRED.GENERIC_ERROR;
    }

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

    // public errorType: ERROR_OCCURRED;
    // public errorStatus: number;
    // public data: any;

    // constructor(errorType: ERROR_OCCURRED | string, data?: any) {
    //     if (typeof errorType === 'string') {
    //         this.errorType = ErrorManager.getErrorTypeFromString(errorType);
    //     }
    //     else {
    //         this.errorType = errorType;
    //     }
    //     this.data = data || null;
    //     this.errorStatus = 400;
    //     this.updateErrorStatus();
    // }

}
