"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Motd = void 0;
const crypto_1 = require("crypto");
const minecraft_protocol_1 = __importDefault(require("minecraft-protocol"));
const meta_js_1 = require("../meta.js");
const Chat_js_1 = require("./Chat.js");
const Constants_js_1 = require("./Constants.js");
const ImageEditor_js_1 = require("./skins/ImageEditor.js");
const { ping } = minecraft_protocol_1.default;
var Motd;
(function (Motd) {
    class MOTD {
        constructor(motd, native, image) {
            this.jsonMotd = motd;
            this.image = image;
            this.usingNatives = native;
        }
        static async generateMOTDFromPing(host, port, useNatives) {
            const pingRes = await ping({ host: host, port: port });
            if (typeof pingRes.version == "string")
                throw new Error("Non-1.8 server detected!");
            else {
                const newPingRes = pingRes;
                let image;
                if (newPingRes.favicon != null) {
                    if (!newPingRes.favicon.startsWith(Constants_js_1.Constants.IMAGE_DATA_PREPEND))
                        throw new Error("Invalid MOTD image!");
                    image = useNatives
                        ? await ImageEditor_js_1.ImageEditor.generateEaglerMOTDImage(Buffer.from(newPingRes.favicon.substring(Constants_js_1.Constants.IMAGE_DATA_PREPEND.length), "base64"))
                        : await ImageEditor_js_1.ImageEditor.generateEaglerMOTDImageJS(Buffer.from(newPingRes.favicon.substring(Constants_js_1.Constants.IMAGE_DATA_PREPEND.length), "base64"));
                }
                return new MOTD({
                    brand: meta_js_1.PROXY_BRANDING,
                    cracked: true,
                    data: {
                        cache: true,
                        icon: newPingRes.favicon != null ? true : false,
                        max: newPingRes.players.max,
                        motd: [typeof newPingRes.description == "string" ? newPingRes.description : Chat_js_1.Chat.chatToPlainString(newPingRes.description), ""],
                        online: newPingRes.players.online,
                        players: newPingRes.players.sample != null ? newPingRes.players.sample.map((v) => v.name) : [],
                    },
                    name: "placeholder name",
                    secure: false,
                    time: Date.now(),
                    type: "motd",
                    uuid: (0, crypto_1.randomUUID)(),
                    vers: `${meta_js_1.PROXY_BRANDING}/${meta_js_1.PROXY_VERSION}`,
                }, useNatives, image);
            }
        }
        static async generateMOTDFromConfig(config, useNatives) {
            if (typeof config.motd != "string") {
                const motd = new MOTD({
                    brand: meta_js_1.PROXY_BRANDING,
                    cracked: true,
                    data: {
                        cache: true,
                        icon: config.motd.iconURL != null ? true : false,
                        max: config.maxConcurrentClients,
                        motd: [config.motd.l1, config.motd.l2 ?? ""],
                        online: 0,
                        players: [],
                    },
                    name: config.name,
                    secure: false,
                    time: Date.now(),
                    type: "motd",
                    uuid: (0, crypto_1.randomUUID)(),
                    vers: `${meta_js_1.PROXY_BRANDING}/${meta_js_1.PROXY_VERSION}`,
                }, useNatives);
                if (config.motd.iconURL != null) {
                    motd.image = useNatives ? await ImageEditor_js_1.ImageEditor.generateEaglerMOTDImage(config.motd.iconURL) : await ImageEditor_js_1.ImageEditor.generateEaglerMOTDImageJS(config.motd.iconURL); // TODO: swap between native and pure JS
                }
                return motd;
            }
            else
                throw new Error("MOTD is set to be forwarded in the config!");
        }
        toBuffer() {
            return [JSON.stringify(this.jsonMotd), this.image];
        }
    }
    Motd.MOTD = MOTD;
})(Motd = exports.Motd || (exports.Motd = {}));
