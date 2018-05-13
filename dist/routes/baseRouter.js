"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
var Method;
(function (Method) {
    Method["GET"] = "GET";
    Method["POST"] = "POST";
    Method["PATCH"] = "PATCH";
    Method["DELETE"] = "DELETE";
})(Method = exports.Method || (exports.Method = {}));
class BaseRouter {
    constructor() {
        this.router = express_1.Router();
        this.routes = [];
    }
    getRouter() {
        return this.router;
    }
    setRoutes(routes) {
        this.routes = routes;
    }
    setupAPI() {
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
}
exports.BaseRouter = BaseRouter;
