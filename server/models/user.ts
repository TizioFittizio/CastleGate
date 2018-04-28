import mongoose = require('mongoose');
import validator = require('validator');
import jwt = require('jsonwebtoken');
import bcrypt = require('bcrypt');

const allowSameIpMultipleConnections = process.env.ALLOW_SAME_IP_MULTIPLE_CONNECTIONS || true;

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 5,
        trim: true,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: "Invalid email address"
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true,
        },
        ip: {
            type: String,
            required: !allowSameIpMultipleConnections,
            unique: !allowSameIpMultipleConnections
        },
        time: {
            type: Number
        },
        token: {
            type: String,
            required: true
        }
    }]
})

/**
 * Override JSON response for this model
 */
UserSchema.methods.toJSON = function(){
    const user = this.toObject();
    return {
        ma: "buh"
    }
}

export const User = mongoose.model('User', UserSchema);

