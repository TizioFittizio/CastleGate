"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../models/user");
const errorManager_1 = require("../utils/errorManager");
const NOT_ENABLED = 'NOT_ENABLED';
const NO_TOKEN = 'NO_TOKEN';
const contentType = 'application/json';
exports.authenticate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const token = req.header('x-auth');
        if (!token) {
            return errorManager_1.ErrorManager.sendErrorResponse(res, errorManager_1.ERROR_OCCURRED.TOKEN_REQUIRED);
        }
        const user = yield user_1.User.findByToken(token);
        if (!user) {
            return errorManager_1.ErrorManager.sendErrorResponse(res, errorManager_1.ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
        }
        if (!user.enabled) {
            return errorManager_1.ErrorManager.sendErrorResponse(res, errorManager_1.ERROR_OCCURRED.DISABLED_USER);
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (e) {
        if (e.name === 'TokenExpiredError') {
            return errorManager_1.ErrorManager.sendErrorResponse(res, errorManager_1.ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
        }
        return errorManager_1.ErrorManager.sendErrorResponse(res, errorManager_1.ERROR_OCCURRED.GENERIC_ERROR);
    }
});
