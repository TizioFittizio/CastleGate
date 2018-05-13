"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('./config/configSetup');
require('./db/mongoose');
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const userRouter_1 = require("./routes/userRouter");
exports.app = express();
const port = process.env.PORT || 5000;
const publicPath = path.join(__dirname, '../public');
const userRouter = new userRouter_1.UserRouter();
exports.app.use(express.static(publicPath));
exports.app.use(bodyParser.json());
exports.app.use('/auth', userRouter.getRouter());
exports.app.listen(port, (hostname) => {
    console.log(`CastleGate started at port ${port}`);
});
