import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import { BaseRouter, Route, Method } from './baseRouter';

export class UserRouter extends BaseRouter {

    protected readonly userRoutes: Route[] = [
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
            url: '/signIn',
            method: Method.POST,
            action: this.signIn.bind(this)
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
            const userCreated = new User(body);
            await userCreated.save();
            const token = await userCreated.generateAuthToken();
            res.header('x-auth', token).status(201).send();
        }
        catch (e) {
            return this.handleError(res, e);
        }
    }

    private async signIn(req: Request, res: Response) {
        try {
            const token = req.header('x-auth');
            const user = await User.findByToken(token!);
            res.status(user ? 204 : 401).send();
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
        console.log('[ERR]', e.message);
        res.status(400).send(e.message);
    }
}