import mongoose = require('mongoose');
import validator = require('validator');
import jwt = require('jsonwebtoken');
import bcrypt = require('bcrypt');
import { Schema, Document, Model, HookNextFunction } from 'mongoose';
import { IUserDocument } from '../interfaces/IUserDocument';
import { IUser } from './user';
import { MongoError } from 'mongodb';
import { ErrorManager, ERROR_OCCURRED } from './../utils/errorManager';

export interface IUser extends IUserDocument {
    generateAuthToken(updateLastAccess: boolean, agent: string): string;
    removeAuthToken(token: string): void;
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
        },
        agent: {
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
        default: !(process.env.MANUAL_USER_ENABLING === 'TRUE')
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
        return next(new Error(ERROR_OCCURRED.ALREADY_PRESENT_EMAIL));
    }

    // Validation error
    if (error.name === 'ValidationError') {
        // const errorReponse = new ErrorManager(
        //     ERROR_OCCURRED.VALIDATION_ERROR,
        //     (error as any).errors   // TODO should send this to client?
        // );
        return next(new Error(ERROR_OCCURRED.VALIDATION_ERROR));
    }

    // TODO if this come at this point that would not mean that there's necessarily an error?
    console.warn('Error not handeled:', error.code, error.name);

    next(error);
});

/**
 * Return a token used for actions that requires authentication
 */
schema.methods.generateAuthToken = async function(updateLastAccess: boolean, agent: string) {
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

    // Removing tokens of same agent
    user.tokens = user.tokens.filter(x => x.agent !== agent);
    user.tokens = user.tokens.concat([{token, agent}]);

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
            throw new Error(ERROR_OCCURRED.LOGIN_FAILED);
        }

        // Check if user is enabled
        if (!userLogin.enabled) {
            throw new Error(ERROR_OCCURRED.DISABLED_USER);
        }

        // Check password
        const passwordResult = await bcrypt.compare(password, userLogin.password);
        if (passwordResult) {

            // Authentication succesfull
            // The user will be saved with the token generation
            if (userLogin.badPasswordCount > 0) {
                userLogin.badPasswordCount = 0;
            }
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
            throw new Error(ERROR_OCCURRED.LOGIN_FAILED);
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
};

export const User: IUserModel = mongoose.model<IUser, IUserModel>('User', schema);
