"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_js_1 = require("../../meta.js");
const Enums_js_1 = require("../Enums.js");
const Protocol_js_1 = require("../Protocol.js");
class CSLoginPacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.CSLoginPacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.S;
        this.sentAfterHandshake = false;
        this.networkVersion = meta_js_1.NETWORK_VERSION;
        this.gameVersion = meta_js_1.VANILLA_PROTOCOL_VERSION;
    }
    serialize() {
        return Buffer.concat([
            [Enums_js_1.Enums.PacketId.CSLoginPacket],
            [0x02],
            Protocol_js_1.MineProtocol.writeShort(0x01),
            Protocol_js_1.MineProtocol.writeShort(this.networkVersion),
            Protocol_js_1.MineProtocol.writeShort(0x01),
            Protocol_js_1.MineProtocol.writeShort(this.gameVersion),
            Protocol_js_1.MineProtocol.writeString(this.brand),
            Protocol_js_1.MineProtocol.writeString(this.version),
            [0x00],
            Protocol_js_1.MineProtocol.writeString(this.username),
        ].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    deserialize(packet) {
        if (packet[0] != this.packetId)
            throw TypeError("Invalid packet ID detected!");
        packet = packet.subarray(2);
        let fard = Protocol_js_1.MineProtocol.readShort(packet);
        // Math.min used in feeble attempt at anti DoS
        let fv = Math.min(8, fard.value);
        for (let i = 0; i < fv; i++) {
            fard = Protocol_js_1.MineProtocol.readShort(fard.newBuffer);
        }
        fard = Protocol_js_1.MineProtocol.readShort(fard.newBuffer);
        fv = Math.min(8, fard.value);
        for (let i = 0; i < fv; i++) {
            fard = Protocol_js_1.MineProtocol.readShort(fard.newBuffer);
        }
        const brand = Protocol_js_1.MineProtocol.readString(fard.newBuffer), version = Protocol_js_1.MineProtocol.readString(brand.newBuffer), username = Protocol_js_1.MineProtocol.readString(version.newBuffer, 1);
        this.brand = brand.value;
        this.version = version.value;
        this.username = username.value;
        return this;
    }
}
exports.default = CSLoginPacket;
