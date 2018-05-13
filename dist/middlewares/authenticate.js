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
const errorResponse_1 = require("../utils/errorResponse");
const NOT_ENABLED = 'NOT_ENABLED';
const NO_TOKEN = 'NO_TOKEN';
const contentType = 'application/json';
exports.authenticate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const token = req.header('x-auth');
        if (!token) {
            throw new Error(NO_TOKEN);
        }
        const user = yield user_1.User.findByToken(token);
        if (!user) {
            throw new Error();
        }
        if (!user.enabled) {
            throw new Error(NOT_ENABLED);
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (e) {
        if (e.message === NOT_ENABLED) {
            return res.contentType(contentType).status(403).send(new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.DISABLED_USER).get());
        }
        if (e.message === NO_TOKEN) {
            return res.contentType(contentType).status(400).send(new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.TOKEN_REQUIRED).get());
        }
        res.status(401).contentType(contentType).send(new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.NEW_TOKEN_REQUIRED).get());
    }
});
