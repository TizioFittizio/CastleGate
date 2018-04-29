import * as expect from 'expect';
import * as request from 'supertest';
import * as mocha from 'mocha';

import { app } from '../server';
import { populateUsers, users } from './seed/seed';
import { User } from '../models/user';
import { Response } from 'express';
import { ERROR_OCCURRED } from '../utils/errorResponse';

const route = '/auth';

beforeEach(populateUsers);

describe('GET /dummy', () => {
    it('should call dummy route correctly', done => {
        request(app)
            .get(route + '/dummy')
            .expect(418)
            .end(() => {
                done();
            });
    });
});

describe('POST /signUp', () => {
    it('should register a new user', done => {
        const body = {
            email: 'uno@due.tre',
            password: 'goriziastazionedigorizia'
        };
        request(app)
            .post(route + '/signUp')
            .send(body)
            .expect(201)
            .expect((res: request.Response) => {
                expect(res.header['x-auth']).toBeTruthy();
            })
            .end(async (err, res) => {
                try {
                    expect(err).toBeNull();
                    const user = await User.findOne({email: body.email});
                    expect(user).toBeTruthy();
                    expect(user!.email).toBe(body.email);
                    expect(user!.password !== body.password).toBeTruthy();
                    expect(user!.emailConfirmed).toBeFalsy();
                    expect(user!.enabled === !process.env.MANUAL_USER_ENABLING).toBeTruthy();
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
            password: 'C8PiBdAF6Vq4CE0Fzvo$9vbo$R4PD6t0TZZzwXiR2xrL3$TN@tX'
        };
        request(app)
            .post(route + '/signUp')
            .send(body)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.header['content-type'].indexOf('application/json') >= 0).toBeTruthy();
                expect(res.body.errorCode).toBe(ERROR_OCCURRED.ALREADY_PRESENT_EMAIL);
            })
            .end(done);
    });

    it('should return error for invalid data submitted', done => {
        const body = {
            email: 'asddsaasddsa',
            password: 'u'
        };
        request(app)
            .post(route + '/signUp')
            .send(body)
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.errorCode).toBe(ERROR_OCCURRED.VALIDATION_ERROR);
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
            .expect(200)
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
            .expect(400)
            .expect((res: request.Response) => {
                expect(res.body.errorCode).toBe(ERROR_OCCURRED.TOKEN_REQUIRED);
            })
            .end(done);
    });

    it('should not allow to enter if user is disabled', done => {
        request(app)
            .post(route + '/access')
            .set('x-auth', users[0].tokens[0].token)
            .expect(403)
            .expect((res: request.Response) => {
                expect(res.body.errorCode).toBe(ERROR_OCCURRED.DISABLED_USER);
            })
            .end(done);
    });

    it('should not allow to enter if token has expired', done => {
        request(app)
            .post(route + '/access')
            .set('x-auth', users[2].tokens[0].token)
            .expect(401)
            .expect((res: request.Response) => {
                expect(res.body.errorCode).toBe(ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
            })
            .end(done);
    });

});