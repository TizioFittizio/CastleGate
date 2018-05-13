"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ERROR_OCCURRED;
(function (ERROR_OCCURRED) {
    ERROR_OCCURRED[ERROR_OCCURRED["GENERIC_ERROR"] = 0] = "GENERIC_ERROR";
    ERROR_OCCURRED[ERROR_OCCURRED["ALREADY_PRESENT_EMAIL"] = 1] = "ALREADY_PRESENT_EMAIL";
    ERROR_OCCURRED[ERROR_OCCURRED["VALIDATION_ERROR"] = 2] = "VALIDATION_ERROR";
    ERROR_OCCURRED[ERROR_OCCURRED["TOKEN_REQUIRED"] = 3] = "TOKEN_REQUIRED";
    ERROR_OCCURRED[ERROR_OCCURRED["NEW_TOKEN_REQUIRED"] = 4] = "NEW_TOKEN_REQUIRED";
    ERROR_OCCURRED[ERROR_OCCURRED["DISABLED_USER"] = 5] = "DISABLED_USER";
    ERROR_OCCURRED[ERROR_OCCURRED["LOGIN_FAILED"] = 6] = "LOGIN_FAILED";
})(ERROR_OCCURRED = exports.ERROR_OCCURRED || (exports.ERROR_OCCURRED = {}));
class ErrorResponse {
    constructor(error, data) {
        this.error = error;
        this.data = data || {};
    }
    get() {
        return JSON.stringify({
            errorCode: this.error,
            data: this.data
        });
    }
}
exports.ErrorResponse = ErrorResponse;
