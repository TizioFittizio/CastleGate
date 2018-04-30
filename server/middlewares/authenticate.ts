import { Request, Response, NextFunction } from 'express';
import { IUserDocument } from './../interfaces/IUserDocument';
import { IUser, User } from '../models/user';
import { ErrorResponse, ERROR_OCCURRED } from '../utils/errorResponse';

const NOT_ENABLED = 'NOT_ENABLED';
const NO_TOKEN = 'NO_TOKEN';

export interface IAuthenticatedRequest extends Request {
    user: IUser;
    token: string;
}

// TODO static access from an util class
const contentType = 'application/json';

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
        (req as IAuthenticatedRequest).user = user;
        (req as IAuthenticatedRequest).token = token;
        next();
    }
    catch (e) {
        if (e.message === NOT_ENABLED) {
            return res.contentType(contentType).status(403).send(
                new ErrorResponse(ERROR_OCCURRED.DISABLED_USER).get()
            );
        }
        if (e.message === NO_TOKEN) {
            return res.contentType(contentType).status(400).send(
                new ErrorResponse(ERROR_OCCURRED.TOKEN_REQUIRED).get()
            );
        }
        res.status(401).contentType(contentType).send(
            new ErrorResponse(ERROR_OCCURRED.NEW_TOKEN_REQUIRED).get()
        );
    }
};
