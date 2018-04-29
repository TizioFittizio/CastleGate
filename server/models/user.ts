import mongoose = require('mongoose');
import validator = require('validator');
import jwt = require('jsonwebtoken');
import bcrypt = require('bcrypt');
import { Schema, Document, Model, HookNextFunction } from 'mongoose';
import { IUserDocument } from '../interfaces/IUserDocument';
import { IUser } from './user';
import { MongoError } from 'mongodb';
import { ErrorResponse, ERROR_OCCURRED } from './../utils/errorResponse';

export interface IUser extends IUserDocument {
    generateAuthToken(): string;
}

export interface IUserModel extends Model<IUser> {
    findByToken(token: string): Promise<IUser>;
}

export const schema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        minlength: 5,
        trim: true,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: 'Invalid email address'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    rememberMe: {
        type: Boolean,
        default: false
    },
    creationDate: {
        type: Date,
        default: Date.now()
    },
    lastEditDate: {
        type: Date,
        default: null
    },
    lastAccessDate: {
        type: Date,
        default: Date.now()
    },
    enabled: {
        type: Boolean,
        default: !process.env.MANUAL_USER_ENABLING
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    badPasswordCount: {
        type: Number,
        default: 0
    }
});

/**
 * Pre hook for editing, update the last edit time, and hash the password if changed
 */
schema.pre('save', async function(next: HookNextFunction) {

    const user = this as IUserDocument;

    if (user.isModified('password')) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(user.password, salt);
        user.password = hash;
    }

    if (!user.isModified('lastAccessDate')) {
        user.lastEditDate = new Date();
    }

    next();
});

/**
 * Post hook for checking errors and return them in readable format
 */
schema.post('save', async function(error: MongoError, doc: mongoose.Document, next: HookNextFunction) {

    // Duplicate email
    if (error.code === 11000) {
        return next(new Error(new ErrorResponse(ERROR_OCCURRED.ALREADY_PRESENT_EMAIL).get()));
    }

    // Validation error
    if (error.name === 'ValidationError') {
        const errorReponse = new ErrorResponse(
            ERROR_OCCURRED.VALIDATION_ERROR,
            (error as any).errors   //TODO custom model for errors?
        );
        return next(new Error(errorReponse.get()));
    }

    console.warn('Error not handeled:', error.code, error.name);

    next(error);
});

/**
 * Return a token used for actions that requires authentication
 */
schema.methods.generateAuthToken = async function() {

    const user = this as IUserDocument;
    const expirationTime = process.env.TOKEN_EXPIRATION_TIME;

    let token;
    if (expirationTime) {
        token = jwt.sign({id: user._id.toHexString()}, process.env.JWT_SECRET!, { expiresIn: `${expirationTime}` }).toString();
    }
    else {
        token = jwt.sign({id: user._id.toHexString()}, process.env.JWT_SECRET!);
    }
    user.tokens = user.tokens.concat([{token}]);
    await user.save();

    return Promise.resolve(token);
};

/**
 * Return a user with the token provided
 */
schema.statics.findByToken = async function(token: string): Promise<IUser | null> {

    const user = this as IUserDocument;
    let decoded : any;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!);
    }
    catch (e) {
        return Promise.reject(e);
    }

    return User.findOne({
        '_id': decoded.id,
        'tokens.token': token
    });
};

export const User: IUserModel = mongoose.model<IUser, IUserModel>('User', schema);