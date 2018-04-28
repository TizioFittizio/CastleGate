require('./config/config.ts');
require('./db/mongoose.ts');

import express = require('express');
import path = require('path');
import { UserRouter } from './routes/userRouter';

const app = express();
const port = process.env.PORT || 3000;

const publicPath = path.join(__dirname, '../public');
const userRouter = new UserRouter();

app.use(express.static(publicPath));
app.use('/auth', userRouter.getRouter());

app.listen(3000, (hostname: string) => {
    console.log(`CastleGate started at port ${port}`);
});