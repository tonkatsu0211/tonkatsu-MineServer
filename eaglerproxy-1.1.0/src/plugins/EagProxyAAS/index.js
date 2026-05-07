"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_js_1 = require("./config.js");
const minecraft_protocol_1 = require("minecraft-protocol");
const types_js_1 = require("./types.js");
const utils_js_1 = require("./utils.js");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const endpoints_js_1 = require("./service/endpoints.js");
const PluginManager = PLUGIN_MANAGER;
const metadata = JSON.parse((0, fs_1.readFileSync)(process.platform == "win32" ? path_1.default.join(path_1.default.dirname(new URL(import.meta.url).pathname), "metadata.json").slice(1) : path_1.default.join(path_1.default.dirname(new URL(import.meta.url).pathname), "metadata.json")).toString());
const Logger = PluginManager.Logger;
const Enums = PluginManager.Enums;
const Chat = PluginManager.Chat;
const Constants = PluginManager.Constants;
const Motd = PluginManager.Motd;
const Player = PluginManager.Player;
const MineProtocol = PluginManager.MineProtocol;
const EaglerSkins = PluginManager.EaglerSkins;
const Util = PluginManager.Util;
(0, utils_js_1.hushConsole)();
const logger = new Logger("EaglerProxyAAS");
logger.info(`Starting ${metadata.name} v${metadata.version}...`);
logger.info(`(internal server port: ${config_js_1.config.bindInternalServerPort}, internal server IP: ${config_js_1.config.bindInternalServerIp})`);
logger.info("Starting internal server...");
let server = (0, minecraft_protocol_1.createServer)({
    host: config_js_1.config.bindInternalServerIp,
    port: config_js_1.config.bindInternalServerPort,
    motdMsg: `${Enums.ChatColor.GOLD}EaglerProxy as a Service`,
    "online-mode": false,
    version: "1.8.9",
}), sGlobals = {
    server: server,
    players: new Map(),
};
(0, utils_js_1.setSG)(sGlobals);
server.on("login", async (client) => {
    const proxyPlayer = PluginManager.proxy.players.get(client.username);
    if (proxyPlayer != null) {
        const url = new URL(proxyPlayer.ws.httpRequest.url, `http${PluginManager.proxy.config.tls?.enabled ? "s" : ""}://${proxyPlayer.ws.httpRequest.headers.host}`);
        let host = url.searchParams.get("ip"), port = url.searchParams.get("port"), type = url.searchParams.get("authType");
        let params = undefined;
        if (host != undefined && url.searchParams.size > 0) {
            if (!config_js_1.config.allowDirectConnectEndpoints) {
                return proxyPlayer.disconnect(Enums.ChatColor.RED + "Direct connect endpoints are disabled");
            }
            if (config_js_1.config.disallowHypixel && /^(?:[\w-]+\.)?hypixel\.net$/.test(host)) {
                return proxyPlayer.disconnect(Enums.ChatColor.RED + "Hypixel is disabled for this proxy");
            }
            if (isNaN(Number(port)) && port != null)
                return proxyPlayer.disconnect(Enums.ChatColor.RED + "Bad port number");
            else if (port == null)
                port = "25565";
            if (!(await (0, utils_js_1.isValidIp)(host))) {
                return proxyPlayer.disconnect(Enums.ChatColor.RED + "Bad host");
            }
            if (type != "OFFLINE" && type != "ONLINE" && type != "THEALTENING" && type != null) {
                return proxyPlayer.disconnect(Enums.ChatColor.RED + "Bad authType provided");
            }
            else if (type == null)
                type = undefined;
            type = type == undefined ? undefined : type == "OFFLINE" ? types_js_1.ConnectType.OFFLINE : type == "ONLINE" ? types_js_1.ConnectType.ONLINE : types_js_1.ConnectType.THEALTENING;
            let sess = undefined;
            // try {
            //   sess = JSON.parse(url.searchParams.get("session"));
            // } catch (e) {
            //   console.log(e);
            //   return proxyPlayer.disconnect(Enums.ChatColor.RED + "Bad session data provided (get a new URL?)");
            // }
            // if (sess && sess.expires_on != null && sess.expires_on < Date.now()) {
            //   return proxyPlayer.disconnect(Enums.ChatColor.RED + "Session expired (get a new URL/try reloggging?)");
            // }
            params = {
                ip: host,
                port: Number(port),
                mode: type,
                session: sess,
            };
        }
        logger.info(`Client ${client.username} has connected to the authentication server.`);
        client.on("end", () => {
            sGlobals.players.delete(client.username);
            logger.info(`Client ${client.username} has disconnected from the authentication server.`);
        });
        const cs = {
            state: types_js_1.ConnectionState.AUTH,
            gameClient: client,
            token: null,
            lastStatusUpdate: null,
        };
        sGlobals.players.set(client.username, cs);
        (0, utils_js_1.handleConnect)(cs, params);
    }
    else {
        logger.warn(`Proxy player object is null for ${client.username}?!`);
        client.end("Indirect connection to internal authentication server detected!");
    }
});
logger.info("Redirecting backend server IP... (this is required for the plugin to function)");
CONFIG.adapter.server = {
    host: config_js_1.config.bindInternalServerIp,
    port: config_js_1.config.bindInternalServerPort,
};
CONFIG.adapter.motd = {
    l1: Enums.ChatColor.GOLD + "EaglerProxy as a Service",
};
if (config_js_1.config.allowDirectConnectEndpoints) {
    PLUGIN_MANAGER.addListener("proxyFinishLoading", () => {
        (0, endpoints_js_1.registerEndpoints)();
        if (config_js_1.config.allowDirectConnectEndpoints) {
            PluginManager.proxy.config.motd = "REALTIME";
            PluginManager.proxy.on("fetchMotd", (ws, req, result) => {
                let url = new URL(req.url, "https://bogus.lol"), ip = url.searchParams.get("ip"), port = url.searchParams.get("port");
                port = port || "25565";
                if (!config_js_1.config.allowCustomPorts && port != "25565")
                    return;
                if (ip != null && !isNaN(Number(port))) {
                    // check if ip is public
                    result.motd = new Promise(async (res) => {
                        if (await (0, utils_js_1.isValidIp)(ip)) {
                            res(await Motd.MOTD.generateMOTDFromPing(ip, Number(port), PluginManager.proxy.config.useNatives || true));
                        }
                        res(null);
                    });
                }
            });
        }
    });
}
