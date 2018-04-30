export enum ERROR_OCCURRED {
    GENERIC_ERROR,
    ALREADY_PRESENT_EMAIL,
    VALIDATION_ERROR,
    TOKEN_REQUIRED,
    NEW_TOKEN_REQUIRED,
    DISABLED_USER,
    LOGIN_FAILED
}

export class ErrorResponse {

    private error: ERROR_OCCURRED;
    private data: object;

    constructor(error: ERROR_OCCURRED, data?: object) {
        this.error = error;
        this.data = data || {};
    }

    public get() {
        return JSON.stringify({
            errorCode: this.error,
            data: this.data
        });
    }

}
