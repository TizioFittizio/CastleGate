import mongodb = require('mongodb');
import jwt = require('jsonwebtoken');
import { User } from '../../models/user';

const ids = [new mongodb.ObjectID(), new mongodb.ObjectID()];

export const users = [
    {
        _id: ids[0],
        email: 'test@test.test',
        password: '1234567654321',
        tokens: []
    },
    {
        _id: ids[1],
        email: 'prova@prova.com',
        password: '6k6Kp#v0hyaGoMMW',
        tokens: [
            {
                token: jwt.sign({_id: ids[1], access: 'auth'}, process.env.JWT_SECRET!).toString()
            }
        ]
    }
];

export const populateUsers = async () => {
    try {
        await User.remove({});
        await Promise.all([new User(users[0]).save(), new User(users[1]).save()]);
        return Promise.resolve();
    }
    catch (e) {
        console.warn(e);
        return Promise.reject(e.message);
    }
};