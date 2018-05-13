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
const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose_1 = require("mongoose");
const errorResponse_1 = require("./../utils/errorResponse");
exports.schema = new mongoose_1.Schema({
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
exports.schema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
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
});
exports.schema.post('save', function (error, doc, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (error.code === 11000) {
            return next(new Error(new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.ALREADY_PRESENT_EMAIL).get()));
        }
        if (error.name === 'ValidationError') {
            const errorReponse = new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.VALIDATION_ERROR, error.errors);
            return next(new Error(errorReponse.get()));
        }
        console.warn('Error not handeled:', error.code, error.name);
        next(error);
    });
});
exports.schema.methods.generateAuthToken = function (updateLastAccess, agent) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        const expirationTime = process.env.TOKEN_EXPIRATION_TIME;
        let token;
        if (expirationTime) {
            token = jwt.sign({ id: user._id.toHexString() }, process.env.JWT_SECRET, { expiresIn: `${expirationTime}` }).toString();
        }
        else {
            token = jwt.sign({ id: user._id.toHexString() }, process.env.JWT_SECRET);
        }
        user.tokens = user.tokens.filter(x => x.agent !== agent);
        user.tokens = user.tokens.concat([{ token, agent }]);
        if (updateLastAccess) {
            user.lastAccessDate = new Date();
        }
        yield user.save();
        return Promise.resolve(token);
    });
};
exports.schema.methods.removeAuthToken = function (token) {
    const user = this;
    return user.update({
        $pull: {
            tokens: {
                token
            }
        }
    });
};
exports.schema.statics.findByToken = function (token) {
    return __awaiter(this, void 0, void 0, function* () {
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }
        catch (e) {
            return Promise.reject(e);
        }
        return exports.User.findOne({
            '_id': decoded.id,
            'tokens.token': token
        });
    });
};
exports.schema.statics.findByCredentials = function (email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userLogin = yield exports.User.findOne({ email });
            if (!userLogin || !password) {
                throw new Error(new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.LOGIN_FAILED).get());
            }
            if (!userLogin.enabled) {
                throw new Error(new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.DISABLED_USER).get());
            }
            const passwordResult = yield bcrypt.compare(password, userLogin.password);
            if (passwordResult) {
                if (userLogin.badPasswordCount > 0) {
                    userLogin.badPasswordCount = 0;
                }
                return Promise.resolve(userLogin);
            }
            else {
                const badPasswordLimit = process.env.BAD_PASSWORD_LIMIT;
                if (badPasswordLimit) {
                    userLogin.badPasswordCount++;
                    if (userLogin.badPasswordCount >= +badPasswordLimit) {
                        userLogin.enabled = false;
                    }
                    yield userLogin.save();
                }
                throw new Error(new errorResponse_1.ErrorResponse(errorResponse_1.ERROR_OCCURRED.LOGIN_FAILED).get());
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
    });
};
exports.User = mongoose.model('User', exports.schema);
