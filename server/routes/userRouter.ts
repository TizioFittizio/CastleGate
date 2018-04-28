import { BaseRouter, Route, Method } from './baseRouter';
import { Router, Request, Response, NextFunction } from 'express';
export class UserRouter extends BaseRouter {

    protected readonly userRoutes: Route[] = [
        {
            url: '/dummy',
            method: Method.GET,
            action: this.dummy
        }
    ];

    constructor() {
        super();
        this.setRoutes(this.userRoutes);
        this.setupAPI();
    }

    private async dummy (req: Request, res: Response) {
        res.status(418).send();
    }
}