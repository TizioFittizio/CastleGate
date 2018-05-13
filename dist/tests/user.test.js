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
const expect = require("expect");
const request = require("supertest");
const server_1 = require("../server");
const seed_1 = require("./seed/seed");
const user_1 = require("../models/user");
const errorResponse_1 = require("../utils/errorResponse");
const route = '/auth';
beforeEach(seed_1.populateUsers);
describe('GET /dummy', () => {
    it('should call dummy route correctly', done => {
        request(server_1.app)
            .get(route + '/dummy')
            .expect(2000)
            .end(() => {
            done();
        });
    });
});
describe('POST /signUp', () => {
    it('should register a new user', done => {
        const body = {
            email: 'uno@due.tre',
            password: Math.random() + ''
        };
        request(server_1.app)
            .post(route + '/signUp')
            .send(body)
            .expect(201)
            .expect((res) => {
            expect(res.header['x-auth']).toBeTruthy();
            expect(res.body.authId).toBeTruthy();
        })
            .end((err, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                expect(err).toBeNull();
                const user = yield user_1.User.findOne({ email: body.email });
                expect(user).toBeTruthy();
                expect(user.email).toBe(body.email);
                expect(user.password !== body.password).toBeTruthy();
                expect(user.emailConfirmed).toBeFalsy();
                expect(user.tokens.length).toBe(1);
                expect(user.enabled === !(process.env.MANUAL_USER_ENABLING === 'true')).toBeTruthy();
                done();
            }
            catch (e) {
                done(e);
            }
        }));
    });
    it('should return error for email already used', done => {
        const body = {
            email: 'test@test.test',
            password: Math.random() + ''
        };
        request(server_1.app)
            .post(route + '/signUp')
            .send(body)
            .expect(400)
            .expect((res) => {
            expect(res.header['content-type'].indexOf('application/json') >= 0).toBeTruthy();
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.ALREADY_PRESENT_EMAIL);
        })
            .end(done);
    });
    it('should return error for invalid data submitted', done => {
        const body = {
            email: 'asddsaasddsa',
            password: (Math.random() + '').slice(0, 1)
        };
        request(server_1.app)
            .post(route + '/signUp')
            .send(body)
            .expect(400)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.VALIDATION_ERROR);
        })
            .end(done);
    });
});
describe('POST /access', () => {
    it('should enter correctly', done => {
        let lastAccess;
        user_1.User.findById(seed_1.users[1]._id)
            .then(user => {
            lastAccess = user.lastAccessDate;
        });
        request(server_1.app)
            .post(route + '/access')
            .set('x-auth', seed_1.users[1].tokens[0].token)
            .expect(200)
            .expect((res) => {
            expect(res.body.authId).toBeTruthy();
        })
            .end((err, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                expect(err).toBeNull();
                const testUserEntered = yield user_1.User.findById(seed_1.users[1]._id);
                expect(testUserEntered.lastAccessDate !== lastAccess).toBeTruthy();
                done();
            }
            catch (e) {
                done(e);
            }
        }));
    });
    it('should not allow to enter without a token', done => {
        request(server_1.app)
            .post(route + '/access')
            .expect(400)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.TOKEN_REQUIRED);
        })
            .end(done);
    });
    it('should not allow to enter if user is disabled', done => {
        request(server_1.app)
            .post(route + '/access')
            .set('x-auth', seed_1.users[0].tokens[0].token)
            .expect(403)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.DISABLED_USER);
        })
            .end(done);
    });
    it('should not allow to enter if token has expired', done => {
        request(server_1.app)
            .post(route + '/access')
            .set('x-auth', seed_1.users[2].tokens[0].token)
            .expect(401)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
        })
            .end(done);
    });
});
describe('POST /signIn', () => {
    it('should authenticate correctly', done => {
        let lastAccess;
        user_1.User.findById(seed_1.users[1]._id)
            .then(user => {
            lastAccess = user.lastAccessDate;
        });
        const body = {
            email: seed_1.users[1].email,
            password: seed_1.users[1].password
        };
        request(server_1.app)
            .post(route + '/signIn')
            .send(body)
            .expect(200)
            .expect((res) => {
            expect(res.header['x-auth']).toBeTruthy();
            expect(res.body.authId).toBeTruthy();
        })
            .end((err, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                expect(err).toBeNull();
                const userLogged = yield user_1.User.findById(seed_1.users[1]._id);
                expect(userLogged.lastAccessDate !== lastAccess).toBeTruthy();
                expect(userLogged.badPasswordCount).toBe(0);
                expect(userLogged.tokens.length).toBe(2);
                done();
            }
            catch (e) {
                done(e);
            }
        }));
    });
    it('should fail for missing params', done => {
        request(server_1.app)
            .post(route + '/signIn')
            .send({})
            .expect(400)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.LOGIN_FAILED);
        })
            .end(done);
    });
    it('should fail with incorrect credentials', done => {
        request(server_1.app)
            .post(route + '/signIn')
            .send({
            email: seed_1.users[1].email,
            password: seed_1.users[1].password + 'a'
        })
            .expect(400)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.LOGIN_FAILED);
        })
            .end(done);
    });
    it('should not allow to enter invalid users', done => {
        request(server_1.app)
            .post(route + '/signIn')
            .send({
            email: seed_1.users[0].email,
            password: seed_1.users[0].password
        })
            .expect(400)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.DISABLED_USER);
        })
            .end(done);
    });
});
describe('POST /signOut', () => {
    it('should log out correctly', done => {
        request(server_1.app)
            .post(route + '/signOut')
            .set('x-auth', seed_1.users[1].tokens[0].token)
            .expect(200)
            .end(done);
    });
    it('should not log out with an invalid token', done => {
        request(server_1.app)
            .post(route + '/signOut')
            .set('x-auth', seed_1.users[2].tokens[0].token)
            .expect(401)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
        })
            .end(done);
    });
    it('should not log out without a token', done => {
        request(server_1.app)
            .post(route + '/signOut')
            .expect(400)
            .expect((res) => {
            expect(res.body.errorCode).toBe(errorResponse_1.ERROR_OCCURRED.TOKEN_REQUIRED);
        })
            .end(done);
    });
});
