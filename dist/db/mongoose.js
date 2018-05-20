"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI)
    .catch(e => {
    console.error('!');
    console.error('Unable to connect to mongo db: ' + e.message);
    process.exit(1);
});
module.exports = mongoose;
