import * as expect from 'expect';
import * as request from 'supertest';
import * as mocha from 'mocha';

import { app } from '../server';
import { populateUsers, users, apiKeyTest } from './seed/seed';
import { User } from '../models/user';
import { Response } from 'express';
import { ERROR_OCCURRED } from '../utils/errorManager';

const route = '/auth';
const keyHeader = 'x-castlegate-key';
const invalidApiKey = '19';

const missingApiKeyMessage = 'should return an error for missing api key';
const invalidApiKeyMessage = 'should return an error for an invalid api key';

beforeEach(populateUsers);

describe('GET /dummy', () => {
    it('should call dummy route correctly', done => {
        request(app)
            .get(route + '/dummy')
            .set(keyHeader, apiKeyTest)
            .expect(418)
            .end(done);
    });

    it(missingApiKeyMessage, done => {
        request(app)
            .get(route + '/dummy')
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.MISSING_API_KEY);
            })
            .end(done);
    });

    it(invalidApiKeyMessage, done => {
        request(app)
            .get(route + '/dummy')
            .set(keyHeader, invalidApiKey)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.INVALID_API_KEY);
            })
            .end(done);
    });
});

describe('POST /signUp', () => {
    it('should register a new user', done => {
        const body = {
            email: 'uno@due.tre',
            password: Math.random() + ''
        };
        request(app)
            .post(route + '/signUp')
            .send(body)
            .set(keyHeader, apiKeyTest)
            .expect(201)
            .expect((res: request.Response) => {
                expect(res.header['x-auth']).toBeTruthy();
                expect(res.body.authId).toBeTruthy();
            })
            .end(async (err, res) => {
                try {
                    expect(err).toBeNull();
                    const user = await User.findOne({email: body.email});
                    expect(user).toBeTruthy();
                    expect(user!.email).toBe(body.email);
                    expect(user!.password !== body.password).toBeTruthy();
                    expect(user!.emailConfirmed).toBeFalsy();
                    expect(user!.tokens.length).toBe(1);
                    expect(user!.enabled === !(process.env.MANUAL_USER_ENABLING === 'true')).toBeTruthy();
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
    });

    it('should return error for email already used', done => {
        const body = {
            email: 'test@test.test',
            password: Math.random() + ''
        };
        request(app)
            .post(route + '/signUp')
            .send(body)
            .set(keyHeader, apiKeyTest)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.header['content-type'].indexOf('application/json') >= 0).toBeTruthy();
                expect(res.body.error).toBe(ERROR_OCCURRED.ALREADY_PRESENT_EMAIL);
            })
            .end(done);
    });

    it('should return error for invalid data submitted', done => {
        const body = {
            email: 'asddsaasddsa',
            password: (Math.random() + '').slice(0, 1)
        };
        request(app)
            .post(route + '/signUp')
            .send(body)
            .set(keyHeader, apiKeyTest)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.VALIDATION_ERROR);
                // TODO invalid fields are expected to be returned
            })
            .end(done);
    });

    // TODO test for missing fields?

    it(missingApiKeyMessage, done => {
        const body = {
            email: 'tre@duo.tre',
            password: Math.random() + ''
        };
        request(app)
            .post(route + '/signUp')
            .send(body)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.MISSING_API_KEY);
            })
            .end(done);
    });

    it(invalidApiKeyMessage, done => {
        const body = {
            email: 'aaa@aaa.aaa',
            password: Math.random() + ''
        };
        request(app)
            .post(route + '/signUp')
            .send(body)
            .set(keyHeader, invalidApiKey)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.INVALID_API_KEY);
            })
            .end(done);
    });

});

describe('POST /access', () => {
    it('should enter correctly', done => {

        let lastAccess: Date;
        User.findById(users[1]._id)
        .then(user => {
            lastAccess = user!.lastAccessDate;
        });

        request(app)
            .post(route + '/access')
            .set('x-auth', users[1].tokens[0].token)
            .set(keyHeader, apiKeyTest)
            .expect(200)
            .expect((res: request.Response) => {
                expect(res.body.authId).toBeTruthy();
            })
            .end(async (err, res) => {
                try {
                    expect(err).toBeNull();
                    const testUserEntered = await User.findById(users[1]._id);
                    expect(testUserEntered!.lastAccessDate !== lastAccess).toBeTruthy();
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
    });

    it('should not allow to enter without a token', done => {
        request(app)
            .post(route + '/access')
            .set(keyHeader, apiKeyTest)
            .expect(401)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.TOKEN_REQUIRED);
            })
            .end(done);
    });

    it('should not allow to enter if user is disabled', done => {
        request(app)
            .post(route + '/access')
            .set('x-auth', users[0].tokens[0].token)
            .set(keyHeader, apiKeyTest)
            .expect(403)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.DISABLED_USER);
            })
            .end(done);
    });

    it('should not allow to enter if token has expired', done => {
        request(app)
            .post(route + '/access')
            .set('x-auth', users[2].tokens[0].token)
            .set(keyHeader, apiKeyTest)
            .expect(401)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
            })
            .end(done);
    });

    it(missingApiKeyMessage, done => {
        request(app)
            .post(route + '/access')
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.MISSING_API_KEY);
            })
            .end(done);
    });

    it(invalidApiKeyMessage, done => {
        request(app)
        .post(route + '/access')
        .set(keyHeader, invalidApiKey)
        .expect(400)
        .expect((res: request.Response) => {
            expect(res.body.error).toBe(ERROR_OCCURRED.INVALID_API_KEY);
        })
        .end(done);
    });

});

describe('POST /signIn', () => {
    it('should authenticate correctly', done => {

        let lastAccess: Date;
        User.findById(users[1]._id)
        .then(user => {
            lastAccess = user!.lastAccessDate;
        });

        const body = {
            email: users[1].email,
            password: users[1].password
        };

        request(app)
            .post(route + '/signIn')
            .send(body)
            .set(keyHeader, apiKeyTest)
            .expect(200)
            .expect((res: request.Response) => {
                expect(res.header['x-auth']).toBeTruthy();
                expect(res.body.authId).toBeTruthy();
            })
            .end(async (err, res) => {
                try {
                    expect(err).toBeNull();
                    const userLogged = await User.findById(users[1]._id);
                    expect(userLogged!.lastAccessDate !== lastAccess).toBeTruthy();
                    expect(userLogged!.badPasswordCount).toBe(0);
                    expect(userLogged!.tokens.length).toBe(2);
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
    });

    it('should fail for missing params', done => {
        request(app)
            .post(route + '/signIn')
            .send({})
            .set(keyHeader, apiKeyTest)
            .expect(401)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.LOGIN_FAILED);
            })
            .end(done);
    });

    it('should fail with incorrect credentials', done => {
        request(app)
            .post(route + '/signIn')
            .send({
                email: users[1].email,
                password: users[1].password + 'a'
            })
            .set(keyHeader, apiKeyTest)
            .expect(401)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.LOGIN_FAILED);
            })
            .end(done);
    });

    it('should not allow to enter disabled users', done => {
        request(app)
            .post(route + '/signIn')
            .send({
                email: users[0].email,
                password: users[0].password
            })
            .set(keyHeader, apiKeyTest)
            .expect(403)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.DISABLED_USER);
            })
            .end(done);
    });

    it(missingApiKeyMessage, done => {
        request(app)
            .post(route + '/signIn')
            .send({
                email: users[0].email,
                password: users[0].password
            })
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.MISSING_API_KEY);
            })
            .end(done);
    });

    it(invalidApiKeyMessage, done => {
        request(app)
            .post(route + '/signIn')
            .send({
                email: users[0].email,
                password: users[0].password
            })
            .set(keyHeader, invalidApiKey)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.INVALID_API_KEY);
            })
            .end(done);
    });

    // TODO should be blocked after reaching max attempts for password

});

describe('POST /signOut', () => {
    it('should log out correctly', done => {
        request(app)
            .post(route + '/signOut')
            .set('x-auth', users[1].tokens[0].token)
            .set(keyHeader, apiKeyTest)
            .expect(200)
            .end(done);
    });

    it('should not log out with an invalid token', done => {
        request(app)
            .post(route + '/signOut')
            .set('x-auth', users[2].tokens[0].token)
            .set(keyHeader, apiKeyTest)
            .expect(401)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
            })
            .end(done);
    });

    it('should not log out without a token', done => {
        request(app)
            .post(route + '/signOut')
            .set(keyHeader, apiKeyTest)
            .expect(401)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.TOKEN_REQUIRED);
            })
            .end(done);
    });

    it(missingApiKeyMessage, done => {
        request(app)
            .post(route + '/signOut')
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.MISSING_API_KEY);
            })
            .end(done);
    });

    it(invalidApiKeyMessage, done => {
        request(app)
            .post(route + '/signOut')
            .set(keyHeader, invalidApiKey)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.error).toBe(ERROR_OCCURRED.INVALID_API_KEY);
            })
            .end(done);
    });
});
