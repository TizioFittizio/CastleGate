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
    generateAuthToken(updateLastAccess: boolean): string;
    removeAuthToken(token: string): string;
}

export interface IUserModel extends Model<IUser> {
    findByToken(token: string): Promise<IUser>;
    findByCredentials(email: string, password: string): Promise<IUser>;
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
 * Pre hook for editing, update the last edit time for email and password, and hash the password if changed
 */
schema.pre('save', async function(next: HookNextFunction) {

    const user = this as IUserDocument;

    if (user.isModified('password')) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(user.password, salt);
        user.password = hash;
    }

    if (user.isModified('password') && user.isModified('email')) {
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
            (error as any).errors   // TODO custom model for errors?
        );
        return next(new Error(errorReponse.get()));
    }

    console.warn('Error not handeled:', error.code, error.name);

    next(error);
});

/**
 * Return a token used for actions that requires authentication
 */
schema.methods.generateAuthToken = async function(updateLastAccess: boolean) {

    const user = this as IUserDocument;
    const expirationTime = process.env.TOKEN_EXPIRATION_TIME;

    let token;
    if (expirationTime) {
        token = jwt.sign(
            {id: user._id.toHexString()},
            process.env.JWT_SECRET!,
            { expiresIn: `${expirationTime}` }
        ).toString();
    }
    else {
        token = jwt.sign({id: user._id.toHexString()}, process.env.JWT_SECRET!);
    }
    user.tokens = user.tokens.concat([{token}]);

    if (updateLastAccess) {
        user.lastAccessDate = new Date();
    }
    await user.save();

    return Promise.resolve(token);
};

/**
 * Remove the token specified for the user
 */
schema.methods.removeAuthToken = function(token: string) {
    const user = this as IUserDocument;
    return user.update({
        $pull: {
            tokens: {
                token
            }
        }
    });
};

/**
 * Return a user with the token provided
 */
schema.statics.findByToken = async function(token: string): Promise<IUser | null> {
    let decoded: any;

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

/**
 * Return an user for the email and the correct password provided
 * If the email is correct but the password is wrong the badPassword count increment
 * Reaching the limit of incorrects password will disable the user
 */
schema.statics.findByCredentials = async function(email: string, password: string) {
    try {

        // Find user and check valid arguments
        const userLogin = await User.findOne({email});
        if (!userLogin || !password) {
            throw new Error(new ErrorResponse(ERROR_OCCURRED.LOGIN_FAILED).get());
        }

        // Check if user is enabled
        if (!userLogin.enabled) {
            throw new Error(new ErrorResponse(ERROR_OCCURRED.DISABLED_USER).get());
        }

        // Check password
        const passwordResult = await bcrypt.compare(password, userLogin.password);
        if (passwordResult) {

            // Authentication succesfull
            return Promise.resolve(userLogin);
        }
        else {

            // Authentication failed
            const badPasswordLimit = process.env.BAD_PASSWORD_LIMIT;
            if (badPasswordLimit) {
                userLogin.badPasswordCount ++;
                if (userLogin.badPasswordCount >= +badPasswordLimit) {
                    userLogin.enabled = false;
                }
                await userLogin.save();
            }
            throw new Error(new ErrorResponse(ERROR_OCCURRED.LOGIN_FAILED).get());
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
};

export const User: IUserModel = mongoose.model<IUser, IUserModel>('User', schema);
