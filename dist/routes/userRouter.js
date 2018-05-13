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
const baseRouter_1 = require("./baseRouter");
const authenticate_1 = require("../middlewares/authenticate");
const errorResponse_1 = require("../utils/errorResponse");
class UserRouter extends baseRouter_1.BaseRouter {
    constructor() {
        super();
        this.userRoutes = [
            {
                url: '/dummy',
                method: baseRouter_1.Method.GET,
                action: this.dummy.bind(this)
            },
            {
                url: '/signUp',
                method: baseRouter_1.Method.POST,
                action: this.signUp.bind(this)
            },
            {
                url: '/access',
                method: baseRouter_1.Method.POST,
                action: this.access.bind(this),
                middlewares: [authenticate_1.authenticate]
            },
            {
                url: '/signIn',
                method: baseRouter_1.Method.POST,
                action: this.signIn.bind(this)
            },
            {
                url: '/signOut',
                method: baseRouter_1.Method.POST,
                action: this.signOut.bind(this),
                middlewares: [authenticate_1.authenticate]
            }
        ];
        this.setRoutes(this.userRoutes);
        this.setupAPI();
    }
    dummy(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.status(418).send();
        });
    }
    signUp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = {
                    password: req.body.password,
                    email: req.body.email
                };
                const agent = req.get('User-Agent') || 'unknown';
                const userCreated = new user_1.User(body);
                yield userCreated.save();
                const token = yield userCreated.generateAuthToken(true, agent);
                res.header('x-auth', token).status(201).send({
                    authId: userCreated._id
                });
            }
            catch (e) {
                return this.handleError(res, e);
            }
        });
    }
    access(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authReq = req;
                authReq.user.lastAccessDate = new Date();
                yield authReq.user.save();
                res.status(200).send({
                    authId: req.user._id
                });
            }
            catch (e) {
                return this.handleError(res, e);
            }
        });
    }
    signIn(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = {
                    password: req.body.password,
                    email: req.body.email
                };
                const agent = req.get('User-Agent') || 'unknown';
                const user = yield user_1.User.findByCredentials(body.email, body.password);
                user.lastAccessDate = new Date();
                const token = yield user.generateAuthToken(true, agent);
                res.header('x-auth', token).status(200).send({
                    authId: user._id
                });
            }
            catch (e) {
                return this.handleError(res, e);
            }
        });
    }
    signOut(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authReq = req;
                yield authReq.user.removeAuthToken(authReq.token);
                res.status(200).send();
            }
            catch (e) {
                return this.handleError(res, e);
            }
        });
    }
    handleError(res, e) {
        try {
            JSON.parse(e.message);
        }
        catch (err) {
            e.message = new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.GENERIC_ERROR, { message: e.message }).get();
        }
        res.status(400).contentType('application/json').send(e.message);
    }
}
exports.UserRouter = UserRouter;
