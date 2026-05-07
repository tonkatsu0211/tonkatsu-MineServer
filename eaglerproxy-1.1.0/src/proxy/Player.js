"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const events_1 = __importDefault(require("events"));
const minecraft_protocol_1 = __importStar(require("minecraft-protocol"));
const logger_js_1 = require("../logger.js");
const Chat_js_1 = require("./Chat.js");
const Enums_js_1 = require("./Enums.js");
const SCDisconnectPacket_js_1 = __importDefault(require("./packets/SCDisconnectPacket.js"));
const Protocol_js_1 = require("./Protocol.js");
const Util_js_1 = require("./Util.js");
const BungeeUtil_js_1 = require("./BungeeUtil.js");
const { createSerializer, createDeserializer } = minecraft_protocol_1.default;
class Player extends events_1.default {
    constructor(ws, playerName, serverConnection) {
        super();
        this.state = Enums_js_1.Enums.ClientState.PRE_HANDSHAKE;
        this._switchingServers = false;
        this._alreadyConnected = false;
        this._logger = new logger_js_1.Logger(`PlayerHandler-${playerName}`);
        this.ws = ws;
        this.username = playerName;
        this.serverConnection = serverConnection;
        if (this.username != null)
            this.uuid = Util_js_1.Util.generateUUIDFromPlayer(this.username);
        this.serverSerializer = createSerializer({
            state: minecraft_protocol_1.states.PLAY,
            isServer: true,
            version: "1.8.9",
            customPackets: null,
        });
        this.clientSerializer = createSerializer({
            state: minecraft_protocol_1.states.PLAY,
            isServer: false,
            version: "1.8.9",
            customPackets: null,
        });
        this.serverDeserializer = createDeserializer({
            state: minecraft_protocol_1.states.PLAY,
            isServer: true,
            version: "1.8.9",
            customPackets: null,
        });
        this.clientDeserializer = createSerializer({
            state: minecraft_protocol_1.states.PLAY,
            isServer: true,
            version: "1.8.9",
            customPackets: null,
        });
    }
    initListeners() {
        this.ws.on("close", () => {
            this.state = Enums_js_1.Enums.ClientState.DISCONNECTED;
            if (this.serverConnection)
                this.serverConnection.end();
            this.emit("disconnect", this);
        });
        this.ws.on("message", (msg) => {
            if (msg instanceof Buffer == false)
                return;
            const decoder = PACKET_REGISTRY.get(msg[0]);
            if (decoder && decoder.sentAfterHandshake) {
                if (!decoder && this.state != Enums_js_1.Enums.ClientState.POST_HANDSHAKE && msg.length >= 1) {
                    this._logger.warn(`Packet with ID 0x${Buffer.from([msg[0]]).toString("hex")} is missing a corresponding packet handler! Processing for this packet will be skipped.`);
                }
                else {
                    let parsed, err;
                    try {
                        parsed = new decoder.class();
                        parsed.deserialize(msg);
                    }
                    catch (err) {
                        if (this.state != Enums_js_1.Enums.ClientState.POST_HANDSHAKE)
                            this._logger.warn(`Packet ID 0x${Buffer.from([msg[0]]).toString("hex")} failed to parse! The packet will be skipped.`);
                        err = true;
                    }
                    if (!err) {
                        this.emit("proxyPacket", parsed, this);
                        return;
                    }
                }
            }
            else {
                try {
                    const parsed = this.serverDeserializer.parsePacketBuffer(msg)?.data, translated = this.translator.translatePacketClient(parsed.params, parsed), packetData = {
                        name: translated[0],
                        params: translated[1],
                        cancel: false,
                    };
                    this.emit("vanillaPacket", packetData, "CLIENT", this);
                    if (!packetData.cancel) {
                        this._sendPacketToServer(this.clientSerializer.createPacketBuffer({
                            name: packetData.name,
                            params: packetData.params,
                        }));
                    }
                }
                catch (err) {
                    this._logger.debug(`Client ${this.username} sent an unrecognized packet that could not be parsed!\n${err.stack ?? err}`);
                }
            }
        });
    }
    write(packet) {
        this.ws.send(packet.serialize());
    }
    async read(packetId, filter) {
        let res;
        await Util_js_1.Util.awaitPacket(this.ws, (packet) => {
            if ((packetId != null && packetId == packet[0]) || packetId == null) {
                const decoder = PACKET_REGISTRY.get(packet[0]);
                if (decoder != null && decoder.packetId == packet[0] && (this.state == Enums_js_1.Enums.ClientState.PRE_HANDSHAKE || decoder.sentAfterHandshake) && decoder.boundTo == Enums_js_1.Enums.PacketBounds.S) {
                    let parsed, err = false;
                    try {
                        parsed = new decoder.class();
                        parsed.deserialize(packet);
                    }
                    catch (_err) {
                        err = true;
                    }
                    if (!err) {
                        if (filter && filter(parsed)) {
                            res = parsed;
                            return true;
                        }
                        else if (filter == null) {
                            res = parsed;
                            return true;
                        }
                    }
                }
            }
            return false;
        });
        return res;
    }
    disconnect(message) {
        if (this.state == Enums_js_1.Enums.ClientState.POST_HANDSHAKE) {
            this.ws.send(Buffer.concat([[0x40], Protocol_js_1.MineProtocol.writeString(typeof message == "string" ? message : JSON.stringify(message))].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr)))));
            this.ws.close();
        }
        else {
            const packet = new SCDisconnectPacket_js_1.default();
            packet.reason = message;
            this.ws.send(packet.serialize());
            this.ws.close();
        }
    }
    async connect(options) {
        if (this._alreadyConnected)
            throw new Error(`Invalid state: Player has already been connected to a server, and .connect() was just called. Please use switchServers() instead.`);
        this._alreadyConnected = true;
        this.serverConnection = (0, minecraft_protocol_1.createClient)(Object.assign({
            version: "1.8.9",
            keepAlive: false,
            hideErrors: false,
        }, options));
        await this._bindListenersMineClient(this.serverConnection);
    }
    switchServers(options) {
        if (!this._alreadyConnected)
            throw new Error(`Invalid state: Player hasn't already been connected to a server, and .switchServers() has been called. Please use .connect() when initially connecting to a server, and only use .switchServers() if you want to switch servers.`);
        return new Promise(async (res, rej) => {
            const oldConnection = this.serverConnection;
            this._switchingServers = true;
            this.ws.send(this.serverSerializer.createPacketBuffer({
                name: "chat",
                params: {
                    message: `${Enums_js_1.Enums.ChatColor.GRAY}Switching servers...`,
                    position: 1,
                },
            }));
            this.ws.send(this.serverSerializer.createPacketBuffer({
                name: "playerlist_header",
                params: {
                    header: JSON.stringify({
                        text: "",
                    }),
                    footer: JSON.stringify({
                        text: "",
                    }),
                },
            }));
            this.serverConnection = (0, minecraft_protocol_1.createClient)(Object.assign({
                version: "1.8.9",
                keepAlive: false,
                hideErrors: false,
            }, options));
            await this._bindListenersMineClient(this.serverConnection, true, () => oldConnection.end())
                .then(() => {
                this.emit("switchServer", this.serverConnection, this);
                res();
            })
                .catch((err) => {
                this.serverConnection = oldConnection;
                rej(err);
            });
        });
    }
    async _bindListenersMineClient(client, switchingServers, onSwitch) {
        return new Promise((res, rej) => {
            let stream = false, uuid;
            const listener = (msg) => {
                if (stream) {
                    client.writeRaw(msg);
                }
            }, errListener = (err) => {
                if (!stream) {
                    rej(err);
                }
                else {
                    this.disconnect(`${Enums_js_1.Enums.ChatColor.RED}Something went wrong: ${err.stack ?? err}`);
                }
            };
            setTimeout(() => {
                if (!stream && this.state != Enums_js_1.Enums.ClientState.DISCONNECTED) {
                    client.end("Timed out waiting for server connection.");
                    this.disconnect(Enums_js_1.Enums.ChatColor.RED + "Timed out waiting for server connection!");
                    throw new Error("Timed out waiting for server connection!");
                }
            }, 30000);
            client.on("error", errListener);
            client.on("end", (reason) => {
                if (!this._switchingServers && !switchingServers) {
                    this.disconnect(this._kickMessage ?? reason);
                }
                this.ws.removeListener("message", listener);
            });
            client.once("connect", () => {
                this.emit("joinServer", client, this);
            });
            client.on("packet", (packet, meta) => {
                if (meta.name == "kick_disconnect") {
                    let json;
                    try {
                        json = JSON.parse(packet.reason);
                    }
                    catch { }
                    if (json != null) {
                        this._kickMessage = Chat_js_1.Chat.chatToPlainString(json);
                    }
                    else
                        this._kickMessage = packet.reason;
                    this._switchingServers = false;
                    this.disconnect(this._kickMessage);
                }
                else if (meta.name == "disconnect") {
                    let json;
                    try {
                        json = JSON.parse(packet.reason);
                    }
                    catch { }
                    if (json != null) {
                        this._kickMessage = Chat_js_1.Chat.chatToPlainString(json);
                    }
                    else
                        this._kickMessage = packet.reason;
                    this._switchingServers = false;
                    this.disconnect(this._kickMessage);
                }
                if (!stream) {
                    if (switchingServers) {
                        if (meta.name == "login" && meta.state == minecraft_protocol_1.states.PLAY && uuid) {
                            this.translator = new BungeeUtil_js_1.BungeeUtil.PacketUUIDTranslator(client.uuid, this.uuid);
                            const pckSeq = BungeeUtil_js_1.BungeeUtil.getRespawnSequence(packet, this.serverSerializer);
                            this.ws.send(this.serverSerializer.createPacketBuffer({
                                name: "login",
                                params: packet,
                            }));
                            pckSeq.forEach((p) => this.ws.send(p));
                            stream = true;
                            if (onSwitch)
                                onSwitch();
                            res(null);
                        }
                        else if (meta.name == "success" && meta.state == minecraft_protocol_1.states.LOGIN && !uuid) {
                            uuid = packet.uuid;
                        }
                    }
                    else {
                        if (meta.name == "login" && meta.state == minecraft_protocol_1.states.PLAY && uuid) {
                            this.translator = new BungeeUtil_js_1.BungeeUtil.PacketUUIDTranslator(client.uuid, this.uuid);
                            this.ws.send(this.serverSerializer.createPacketBuffer({
                                name: "login",
                                params: packet,
                            }));
                            stream = true;
                            if (onSwitch)
                                onSwitch();
                            res(null);
                        }
                        else if (meta.name == "success" && meta.state == minecraft_protocol_1.states.LOGIN && !uuid) {
                            uuid = packet.uuid;
                        }
                    }
                }
                else {
                    const translated = this.translator.translatePacketServer(packet, meta), eventData = {
                        name: translated[0],
                        params: translated[1],
                        cancel: false,
                    };
                    this.emit("vanillaPacket", eventData, "SERVER", this);
                    if (!eventData.cancel) {
                        this.ws.send(this.serverSerializer.createPacketBuffer({
                            name: eventData.name,
                            params: eventData.params,
                        }));
                    }
                }
            });
            this._sendPacketToServer = listener;
        });
    }
}
exports.Player = Player;
