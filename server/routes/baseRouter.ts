import { Router, Request, Response, NextFunction } from 'express';

export type RouteAction = (req: Request, res: Response) => void;
export type RouteMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export interface Route {

    url: string;
    method: Method;
    action: RouteAction;
    middlewares?: RouteMiddleware[];

}

export enum Method {
    GET = 'GET',
    POST = 'POST',
    PATCH = 'PATCH',
    DELETE = 'DELETE'
}

export abstract class BaseRouter {

    private router: Router;
    private routes : Route[];

    constructor() {
        this.router = Router();
        this.routes = [];
    }

    protected setRoutes(routes: Route[]): void {
        this.routes = routes;
    }

    protected setupAPI() {

        if (!this.routes.length) {
            return console.warn('No routes for this router');
        }

        for (const route of this.routes) {

            const middlewares = route.middlewares && route.middlewares.length ? route.middlewares : [];

            switch (route.method) {
                case Method.GET:
                    this.router.get(route.url, ...middlewares, route.action);
                    break;
                case Method.POST:
                    this.router.post(route.url, ...middlewares, route.action);
                    break;
                case Method.PATCH:
                    this.router.patch(route.url, ...middlewares, route.action);
                    break;
                case Method.DELETE:
                    this.router.delete(route.url, ...middlewares, route.action);
            }

        }
    }

    public getRouter() {
        return this.router;
    }

}