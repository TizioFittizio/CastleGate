import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import { BaseRouter, IRoute, Method } from './baseRouter';
import { authenticate, IAuthenticatedRequest } from '../middlewares/authenticate';
import { ErrorManager, ERROR_OCCURRED } from '../utils/errorManager';

export class UserRouter extends BaseRouter {

    protected readonly userRoutes: IRoute[] = [
        {
            url: '/dummy',
            method: Method.GET,
            action: this.dummy.bind(this)
        },
        {
            url: '/signUp',
            method: Method.POST,
            action: this.signUp.bind(this)
        },
        {
            url: '/access',
            method: Method.POST,
            action: this.access.bind(this),
            middlewares: [authenticate]
        },
        {
            url: '/signIn',
            method: Method.POST,
            action: this.signIn.bind(this)
        },
        {
            url: '/signOut',
            method: Method.POST,
            action: this.signOut.bind(this),
            middlewares: [authenticate]
        }
    ];

    constructor() {
        super();
        this.setRoutes(this.userRoutes);
        this.setupAPI();
    }

    private async dummy(req: Request, res: Response) {
        res.status(418).send();
    }

    /**
     * User registration, password and email are required
     * @param req Express request
     * @param res Express response
     */
    private async signUp(req: Request, res: Response) {
        try {
            const body = {
                password: req.body.password,
                email: req.body.email
            };
            const agent = req.get('User-Agent') || 'unknown';
            const userCreated = new User(body);
            await userCreated.save();
            const token = await userCreated.generateAuthToken(true, agent);
            res.header('x-auth', token).status(201).send({
                authId: userCreated._id
            });
        }
        catch (e) {
            return this.handleError(res, e);
        }
    }

    /**
     * Given a token as x-auth header, try to return a valid user
     * @param req Express request
     * @param res Express response
     */
    private async access(req: Request, res: Response) {
        try {
            const authReq = (req as IAuthenticatedRequest);
            authReq.user.lastAccessDate = new Date();
            await authReq.user.save();
            res.status(200).send({
                authId: (req as IAuthenticatedRequest).user._id
            });
        }
        catch (e) {
            return this.handleError(res, e);
        }
    }

    private async signIn(req: Request, res: Response) {
        try {
            const body = {
                password: req.body.password,
                email: req.body.email
            };
            const agent = req.get('User-Agent') || 'unknown';
            const user = await User.findByCredentials(body.email, body.password);
            user.lastAccessDate = new Date();
            const token = await user.generateAuthToken(true, agent);
            res.header('x-auth', token).status(200).send({
                authId: user._id
            });
        }
        catch (e) {
            return this.handleError(res, e);
        }
    }

    private async signOut(req: Request, res: Response) {
        try {
            const authReq = (req as IAuthenticatedRequest);
            await authReq.user.removeAuthToken(authReq.token);
            res.status(200).send();
        }
        catch (e) {
            return this.handleError(res, e);
        }
    }

    /**
     * Error handler
     * @param res Express response
     * @param e Error to return
     */
    private handleError(res: Response, e: Error) {
        console.log(e);
        ErrorManager.sendErrorResponse(res, e.message);
    }
}
