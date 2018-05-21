import { Request, Response, NextFunction } from 'express';
import { IUserDocument } from './../interfaces/IUserDocument';
import { IUser, User } from '../models/user';
import { ErrorManager, ERROR_OCCURRED } from '../utils/errorManager';

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
            return ErrorManager.sendErrorResponse(res, ERROR_OCCURRED.TOKEN_REQUIRED);
        }
        const user = await User.findByToken(token);
        if (!user) {
            return ErrorManager.sendErrorResponse(res, ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
        }
        if (!user.enabled) {
            return ErrorManager.sendErrorResponse(res, ERROR_OCCURRED.DISABLED_USER);
        }
        (req as IAuthenticatedRequest).user = user;
        (req as IAuthenticatedRequest).token = token;
        next();
    }
    catch (e) {
        if (e.name === 'TokenExpiredError') {
            return ErrorManager.sendErrorResponse(res, ERROR_OCCURRED.NEW_TOKEN_REQUIRED);
        }
        return ErrorManager.sendErrorResponse(res, ERROR_OCCURRED.GENERIC_ERROR);
    }
};
