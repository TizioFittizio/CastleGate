import { Request, Response, NextFunction } from 'express';
import { IUserDocument } from './../interfaces/IUserDocument';
import { IUser, User } from '../models/user';
import { ErrorResponse, ERROR_OCCURRED } from '../utils/errorResponse';

const NOT_ENABLED = 'NOT_ENABLED';
const NO_TOKEN = 'NO_TOKEN';

export interface AuthenticatedRequest extends Request {
    user: IUser;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('x-auth');
        if (!token) {
            throw new Error(NO_TOKEN);
        }
        const user = await User.findByToken(token);
        if (!user) {
            throw new Error();
        }
        if (!user.enabled) {
            throw new Error(NOT_ENABLED);
        }
        (req as AuthenticatedRequest).user = user;
        next();
    }
    catch (e) {
        if (e.message === NOT_ENABLED) {
            return res.status(403).send(
                new ErrorResponse(ERROR_OCCURRED.DISABLED_USER).get()
            );
        }
        if (e.message === NO_TOKEN) {
            return res.status(400).send(
                new ErrorResponse(ERROR_OCCURRED.TOKEN_REQUIRED).get()
            );
        }
        res.status(401).contentType('application/json').send(
            new ErrorResponse(ERROR_OCCURRED.NEW_TOKEN_REQUIRED).get()
        );
    }
};