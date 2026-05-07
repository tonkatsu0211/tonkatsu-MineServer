"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BucketRatelimiter_js_1 = __importDefault(require("./BucketRatelimiter.js"));
class ProxyRatelimitManager {
    constructor(config) {
        this.http = new BucketRatelimiter_js_1.default(config.limits.http, config.limits.http);
        this.ws = new BucketRatelimiter_js_1.default(config.limits.ws, config.limits.ws);
        this.motd = new BucketRatelimiter_js_1.default(config.limits.motd, config.limits.motd);
        this.connect = new BucketRatelimiter_js_1.default(config.limits.connect, config.limits.connect);
        this.skinsIP = new BucketRatelimiter_js_1.default(config.limits.skinsIp, config.limits.skinsIp);
        this.skinsConnection = new BucketRatelimiter_js_1.default(config.limits.skins, config.limits.skins);
    }
}
exports.default = ProxyRatelimitManager;
