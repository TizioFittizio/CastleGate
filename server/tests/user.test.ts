import * as expect from 'expect';
import * as request from 'supertest';
import * as mocha from 'mocha';

import { app } from '../server';
import { populateUsers } from './seed/seed';
import { User } from '../models/user';
import { Response } from 'express';

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
    //creazione corretta
    //email gia usata
    //errori validazione
    //non ci si deve poter loggare se si è disabilitati all' inizio
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
            .end(done);
    });
});