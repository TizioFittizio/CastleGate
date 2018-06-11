import { Request, Response, NextFunction } from 'express';
import { ERROR_OCCURRED, ErrorManager } from '../utils/errorManager';

export const apiKey = async (req: Request, res: Response, next: NextFunction) => {
    const key = req.header('x-castlegate-key');
    if (!key) {
        return ErrorManager.sendErrorResponse(res, ERROR_OCCURRED.MISSING_API_KEY);
    }
    if (key !== process.env.API_KEY){
        return ErrorManager.sendErrorResponse(res, ERROR_OCCURRED.INVALID_API_KEY);
    }
    next();
};
