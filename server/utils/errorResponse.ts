export enum ERROR_OCCURRED {
    GENERIC_ERROR,
    ALREADY_PRESENT_EMAIL
}

export class ErrorResponse {

    private error: ERROR_OCCURRED;
    private message: string;

    constructor(error: ERROR_OCCURRED, message?: string) {
        this.error = error;
        this.message = message || '';
    }

    public get() {
        return JSON.stringify({
            errorCode: this.error,
            message: this.message
        });
    }

}