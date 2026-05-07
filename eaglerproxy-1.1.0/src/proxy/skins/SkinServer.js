"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkinServer = void 0;
const DiskDB_js_1 = __importDefault(require("../databases/DiskDB.js"));
const crypto_1 = __importDefault(require("crypto"));
const logger_js_1 = require("../../logger.js");
const Constants_js_1 = require("../Constants.js");
const Enums_js_1 = require("../Enums.js");
const Util_js_1 = require("../Util.js");
const SCChannelMessage_js_1 = require("../packets/channel/SCChannelMessage.js");
const EaglerSkins_js_1 = require("./EaglerSkins.js");
const ImageEditor_js_1 = require("./ImageEditor.js");
const Protocol_js_1 = require("../Protocol.js");
const ExponentialBackoffRequestController_js_1 = __importDefault(require("../ratelimit/ExponentialBackoffRequestController.js"));
class SkinServer {
    constructor(proxy, native, sweepInterval, cacheLifetime, cacheFolder = "./skinCache", useCache = true, allowedSkinDomains) {
        this.allowedSkinDomains = allowedSkinDomains ?? ["textures.minecraft.net"];
        if (useCache) {
            this.cache = new DiskDB_js_1.default(cacheFolder, (v) => exportCachedSkin(v), (b) => readCachedSkin(b), (k) => k.replaceAll("-", ""));
        }
        this.proxy = proxy ?? PROXY;
        this.usingCache = useCache;
        this.usingNative = native;
        this.lifetime = cacheLifetime;
        this.backoffController = new ExponentialBackoffRequestController_js_1.default();
        this._logger = new logger_js_1.Logger("SkinServer");
        this._logger.info("Started EaglercraftX skin server.");
        if (useCache)
            this.deleteTask = setInterval(async () => await this.cache.filter((ent) => Date.now() < ent.expires), sweepInterval);
    }
    unload() {
        if (this.deleteTask != null)
            clearInterval(this.deleteTask);
    }
    async handleRequest(packet, caller, proxy) {
        if (packet.messageType == Enums_js_1.Enums.ChannelMessageType.SERVER)
            throw new Error("Server message was passed to client message handler!");
        else if (packet.channel != Constants_js_1.Constants.EAGLERCRAFT_SKIN_CHANNEL_NAME)
            throw new Error("Cannot handle non-EaglerX skin channel messages!");
        {
            const rl = proxy.ratelimit.skinsConnection.consume(caller.username), rlip = proxy.ratelimit.skinsIP.consume(caller.ws._socket.remoteAddress);
            if (!rl.success || !rlip.success)
                return;
        }
        switch (packet.data[0]) {
            default:
                throw new Error("Unknown operation!");
                break;
            case Enums_js_1.Enums.EaglerSkinPacketId.CFetchSkinEaglerPlayerReq:
                const parsedPacket_0 = EaglerSkins_js_1.EaglerSkins.readClientFetchEaglerSkinPacket(packet.data);
                const player = this.proxy.fetchUserByUUID(parsedPacket_0.uuid);
                if (player) {
                    if (player.skin.type == Enums_js_1.Enums.SkinType.BUILTIN) {
                        const response = new SCChannelMessage_js_1.SCChannelMessagePacket();
                        response.channel = Constants_js_1.Constants.EAGLERCRAFT_SKIN_CHANNEL_NAME;
                        response.data = EaglerSkins_js_1.EaglerSkins.writeServerFetchSkinResultBuiltInPacket(player.uuid, player.skin.builtInSkin);
                        caller.write(response);
                    }
                    else if (player.skin.type == Enums_js_1.Enums.SkinType.CUSTOM) {
                        const response = new SCChannelMessage_js_1.SCChannelMessagePacket();
                        response.channel = Constants_js_1.Constants.EAGLERCRAFT_SKIN_CHANNEL_NAME;
                        response.data = EaglerSkins_js_1.EaglerSkins.writeServerFetchSkinResultCustomPacket(player.uuid, player.skin.skin, false);
                        caller.write(response);
                    }
                    else
                        this._logger.warn(`Player ${caller.username} attempted to fetch player ${player.uuid}'s skin, but their skin hasn't loaded yet!`);
                }
                break;
            case Enums_js_1.Enums.EaglerSkinPacketId.CFetchSkinReq:
                const parsedPacket_1 = EaglerSkins_js_1.EaglerSkins.readClientDownloadSkinRequestPacket(packet.data), url = new URL(parsedPacket_1.url).hostname;
                if (!this.allowedSkinDomains.some((domain) => Util_js_1.Util.areDomainsEqual(domain, url))) {
                    this._logger.warn(`Player ${caller.username} tried to download a skin with a disallowed domain name (${url})!`);
                    break;
                }
                try {
                    let cacheHit = null, skin = null;
                    if (this.usingCache) {
                        (cacheHit = await this.cache.get(parsedPacket_1.uuid)), (skin = cacheHit != null ? cacheHit.data : null);
                        if (!skin) {
                            const fetched = await EaglerSkins_js_1.EaglerSkins.safeDownloadSkin(parsedPacket_1.url, this.backoffController);
                            skin = fetched;
                            await this.cache.set(parsedPacket_1.uuid, {
                                uuid: parsedPacket_1.uuid,
                                expires: Date.now() + this.lifetime,
                                data: fetched,
                            });
                        }
                    }
                    else {
                        skin = await EaglerSkins_js_1.EaglerSkins.safeDownloadSkin(parsedPacket_1.url, this.backoffController);
                    }
                    const processed = this.usingNative ? await ImageEditor_js_1.ImageEditor.toEaglerSkin(skin) : await ImageEditor_js_1.ImageEditor.toEaglerSkinJS(skin), response = new SCChannelMessage_js_1.SCChannelMessagePacket();
                    response.channel = Constants_js_1.Constants.EAGLERCRAFT_SKIN_CHANNEL_NAME;
                    response.data = EaglerSkins_js_1.EaglerSkins.writeServerFetchSkinResultCustomPacket(parsedPacket_1.uuid, processed, true);
                    caller.write(response);
                }
                catch (err) {
                    this._logger.warn(`Failed to fetch skin URL ${parsedPacket_1.url} for player ${caller.username}: ${err.stack ?? err}`);
                }
        }
    }
}
exports.SkinServer = SkinServer;
function digestMd5Hex(data) {
    return crypto_1.default.createHash("md5").update(data).digest("hex");
}
function exportCachedSkin(skin) {
    const endUuid = Protocol_js_1.MineProtocol.writeString(skin.uuid), encExp = Protocol_js_1.MineProtocol.writeVarLong(skin.expires), encSkin = Protocol_js_1.MineProtocol.writeBinary(skin.data);
    return Buffer.concat([endUuid, encExp, encSkin]);
}
function readCachedSkin(data) {
    const readUuid = Protocol_js_1.MineProtocol.readString(data), readExp = Protocol_js_1.MineProtocol.readVarLong(readUuid.newBuffer), readSkin = Protocol_js_1.MineProtocol.readBinary(readExp.newBuffer);
    return {
        uuid: readUuid.value,
        expires: readExp.value,
        data: readSkin.value,
    };
}
