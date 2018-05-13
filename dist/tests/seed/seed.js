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
const mongodb = require("mongodb");
const jwt = require("jsonwebtoken");
const user_1 = require("../../models/user");
const ids = [new mongodb.ObjectID(), new mongodb.ObjectID(), new mongodb.ObjectID()];
const passwords = ['1234567654321', '6k6Kp#v0hyaGoMMW', '987876765654543432321!'];
exports.users = [
    {
        _id: ids[0],
        email: 'test@test.test',
        password: passwords[0],
        tokens: [
            {
                token: jwt.sign({ id: ids[0] }, process.env.JWT_SECRET).toString(),
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
                token: jwt.sign({ id: ids[1] }, process.env.JWT_SECRET).toString(),
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
                token: jwt.sign({ id: ids[2] }, process.env.JWT_SECRET, { expiresIn: '0s' }).toString(),
                agent: 'TEST'
            }
        ],
        enabled: true
    }
];
exports.populateUsers = () => __awaiter(this, void 0, void 0, function* () {
    try {
        yield user_1.User.remove({});
        yield Promise.all([
            new user_1.User(exports.users[0]).save(),
            new user_1.User(exports.users[1]).save(),
            new user_1.User(exports.users[2]).save()
        ]);
        return Promise.resolve();
    }
    catch (e) {
        console.warn(e);
        return Promise.reject(e.message);
    }
});
