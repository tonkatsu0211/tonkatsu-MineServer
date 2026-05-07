"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EaglerSkins = void 0;
const Constants_js_1 = require("../Constants.js");
const Enums_js_1 = require("../Enums.js");
const Protocol_js_1 = require("../Protocol.js");
const Util_js_1 = require("../Util.js");
const node_fetch_1 = __importDefault(require("node-fetch"));
// TODO: convert all functions to use MineProtocol's UUID manipulation functions
var EaglerSkins;
(function (EaglerSkins) {
    async function skinUrlFromUuid(uuid) {
        const response = (await (await (0, node_fetch_1.default)(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)).json());
        const parsed = JSON.parse(Buffer.from(response.properties[0].value, "base64").toString());
        return parsed.textures.SKIN.url;
    }
    EaglerSkins.skinUrlFromUuid = skinUrlFromUuid;
    function downloadSkin(skinUrl) {
        const url = new URL(skinUrl);
        if (url.protocol != "https:" && url.protocol != "http:")
            throw new Error("Invalid skin URL protocol!");
        return new Promise(async (res, rej) => {
            const skin = await (0, node_fetch_1.default)(skinUrl);
            if (skin.status != 200) {
                rej({
                    url: skinUrl,
                    status: skin.status,
                });
                return;
            }
            else {
                res(Buffer.from(await skin.arrayBuffer()));
            }
        });
    }
    EaglerSkins.downloadSkin = downloadSkin;
    function safeDownloadSkin(skinUrl, backoff) {
        return new Promise((res, rej) => {
            backoff.queueTask(async (err) => {
                if (err)
                    return rej(err);
                try {
                    res(await downloadSkin(skinUrl));
                }
                catch (err) {
                    if (err.status == 429)
                        throw new Error("Ratelimited!");
                    else
                        throw new Error("Unexpected HTTP status code: " + err.status);
                }
            });
        });
    }
    EaglerSkins.safeDownloadSkin = safeDownloadSkin;
    function readClientDownloadSkinRequestPacket(message) {
        const ret = {
            id: null,
            uuid: null,
            url: null,
        };
        const id = Protocol_js_1.MineProtocol.readVarInt(message), uuid = Protocol_js_1.MineProtocol.readUUID(id.newBuffer), url = Protocol_js_1.MineProtocol.readString(uuid.newBuffer, 1);
        ret.id = id.value;
        ret.uuid = uuid.value;
        ret.url = url.value;
        return ret;
    }
    EaglerSkins.readClientDownloadSkinRequestPacket = readClientDownloadSkinRequestPacket;
    function writeClientDownloadSkinRequestPacket(uuid, url) {
        return Buffer.concat([[Enums_js_1.Enums.EaglerSkinPacketId.CFetchSkinReq], Protocol_js_1.MineProtocol.writeUUID(uuid), [0x0], Protocol_js_1.MineProtocol.writeString(url)].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    EaglerSkins.writeClientDownloadSkinRequestPacket = writeClientDownloadSkinRequestPacket;
    function readServerFetchSkinResultBuiltInPacket(message) {
        const ret = {
            id: null,
            uuid: null,
            skinId: null,
        };
        const id = Protocol_js_1.MineProtocol.readVarInt(message), uuid = Protocol_js_1.MineProtocol.readUUID(id.newBuffer), skinId = Protocol_js_1.MineProtocol.readVarInt(id.newBuffer.subarray(id.newBuffer.length));
        ret.id = id.value;
        ret.uuid = uuid.value;
        ret.skinId = skinId.value;
        return this;
    }
    EaglerSkins.readServerFetchSkinResultBuiltInPacket = readServerFetchSkinResultBuiltInPacket;
    function writeServerFetchSkinResultBuiltInPacket(uuid, skinId) {
        uuid = typeof uuid == "string" ? Util_js_1.Util.uuidStringToBuffer(uuid) : uuid;
        return Buffer.concat([Buffer.from([Enums_js_1.Enums.EaglerSkinPacketId.SFetchSkinBuiltInRes]), uuid, Buffer.from([skinId >> 24, skinId >> 16, skinId >> 8, skinId & 0xff])]);
    }
    EaglerSkins.writeServerFetchSkinResultBuiltInPacket = writeServerFetchSkinResultBuiltInPacket;
    function readServerFetchSkinResultCustomPacket(message) {
        const ret = {
            id: null,
            uuid: null,
            skin: null,
        };
        const id = Protocol_js_1.MineProtocol.readVarInt(message), uuid = Protocol_js_1.MineProtocol.readUUID(id.newBuffer), skin = uuid.newBuffer.subarray(0, Constants_js_1.Constants.EAGLERCRAFT_SKIN_CUSTOM_LENGTH);
        ret.id = id.value;
        ret.uuid = uuid.value;
        ret.skin = skin;
        return this;
    }
    EaglerSkins.readServerFetchSkinResultCustomPacket = readServerFetchSkinResultCustomPacket;
    function writeClientFetchEaglerSkin(uuid, url) {
        uuid = typeof uuid == "string" ? Util_js_1.Util.uuidStringToBuffer(uuid) : uuid;
        return Buffer.concat([[Enums_js_1.Enums.EaglerSkinPacketId.CFetchSkinEaglerPlayerReq], uuid, [0x00], Protocol_js_1.MineProtocol.writeString(url)].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    EaglerSkins.writeClientFetchEaglerSkin = writeClientFetchEaglerSkin;
    function writeServerFetchSkinResultCustomPacket(uuid, skin, downloaded) {
        uuid = typeof uuid == "string" ? Util_js_1.Util.uuidStringToBuffer(uuid) : uuid;
        return Buffer.concat([
            [Enums_js_1.Enums.EaglerSkinPacketId.SFetchSkinRes],
            uuid,
            [-1],
            skin.subarray(0, Constants_js_1.Constants.EAGLERCRAFT_SKIN_CUSTOM_LENGTH),
        ].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    EaglerSkins.writeServerFetchSkinResultCustomPacket = writeServerFetchSkinResultCustomPacket;
    function readClientFetchEaglerSkinPacket(buff) {
        const ret = {
            id: null,
            uuid: null,
        };
        const id = Protocol_js_1.MineProtocol.readVarInt(buff), uuid = Protocol_js_1.MineProtocol.readUUID(id.newBuffer);
        ret.id = id.value;
        ret.uuid = uuid.value;
        return ret;
    }
    EaglerSkins.readClientFetchEaglerSkinPacket = readClientFetchEaglerSkinPacket;
    class EaglerSkin {
    }
    EaglerSkins.EaglerSkin = EaglerSkin;
})(EaglerSkins = exports.EaglerSkins || (exports.EaglerSkins = {}));
