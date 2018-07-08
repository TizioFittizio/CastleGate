import mongodb = require('mongodb');
import jwt = require('jsonwebtoken');
import { User } from '../../models/user';

const ids = [new mongodb.ObjectID(), new mongodb.ObjectID(), new mongodb.ObjectID()];
const passwords = ['1234567654321', '6k6Kp#v0hyaGoMMW', '987876765654543432321!'];

export const users = [
    {
        _id: ids[0],
        email: 'test@test.test',
        password: passwords[0],
        tokens: [
            {
                token: jwt.sign({id: ids[0]}, process.env.JWT_SECRET!).toString(),
                agent: 'TEST'
            }
        ],
        enabled: false
    },
    {
        _id: ids[1],
        email: 'prova@prova.com',
        password: passwords[1],
        tokens: [
            {
                token: jwt.sign({id: ids[1]}, process.env.JWT_SECRET!).toString(),
                agent: 'TEST'
            }
        ],
        enabled: true
    },
    {
        _id: ids[2],
        email: 'aaaaa@aaaaa.com',
        password: passwords[2],
        tokens: [
            {
                token: jwt.sign({id: ids[2]}, process.env.JWT_SECRET!, {expiresIn: '0s'}).toString(),
                agent: 'TEST'
            }
        ],
        enabled: true
    }
];

export const populateUsers = async () => {
    try {
        await User.remove({});
        await Promise.all([
            new User(users[0]).save(),
            new User(users[1]).save(),
            new User(users[2]).save()
        ]);
        return Promise.resolve();
    }
    catch (e) {
        console.warn(e);
        return Promise.reject(e.message);
    }
};

export const apiKeyTest = '1234567890';
