require('./config/configSetup');
require('./db/mongoose');

import express = require('express');
import bodyParser = require('body-parser');
import path = require('path');
import { UserRouter } from './routes/userRouter';

export const app = express();
const port = process.env.PORT || 5000;

const publicPath = path.join(__dirname, '../public');
const userRouter = new UserRouter();

app.use(express.static(publicPath));
app.use(bodyParser.json());
app.use('/auth', userRouter.getRouter());

app.listen(port, (hostname: string) => {
    console.log(`CastleGate started at port ${port}`);
});
