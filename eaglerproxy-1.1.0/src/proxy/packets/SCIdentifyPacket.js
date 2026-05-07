"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_js_1 = require("../../meta.js");
const Enums_js_1 = require("../Enums.js");
const Protocol_js_1 = require("../Protocol.js");
class SCIdentifyPacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.SCIdentifyPacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.C;
        this.sentAfterHandshake = false;
        this.protocolVer = meta_js_1.NETWORK_VERSION;
        this.gameVersion = meta_js_1.VANILLA_PROTOCOL_VERSION;
        this.branding = meta_js_1.PROXY_BRANDING;
        this.version = meta_js_1.PROXY_VERSION;
    }
    serialize() {
        return Buffer.concat([
            [0x02],
            Protocol_js_1.MineProtocol.writeShort(this.protocolVer),
            Protocol_js_1.MineProtocol.writeShort(this.gameVersion),
            Protocol_js_1.MineProtocol.writeString(this.branding),
            Protocol_js_1.MineProtocol.writeString(this.version),
            [0x00, 0x00, 0x00],
        ].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    deserialize(packet) {
        if (packet[0] != this.packetId)
            throw TypeError("Invalid packet ID detected!");
        packet = packet.subarray(1);
        const protoVer = Protocol_js_1.MineProtocol.readShort(packet), gameVer = Protocol_js_1.MineProtocol.readShort(protoVer.newBuffer), branding = Protocol_js_1.MineProtocol.readString(gameVer.newBuffer), version = Protocol_js_1.MineProtocol.readString(branding.newBuffer);
        this.gameVersion = gameVer.value;
        this.branding = branding.value;
        this.version = version.value;
        return this;
    }
}
exports.default = SCIdentifyPacket;
