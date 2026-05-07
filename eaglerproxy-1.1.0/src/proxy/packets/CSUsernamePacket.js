"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSUsernamePacket = void 0;
const Enums_js_1 = require("../Enums.js");
const Protocol_js_1 = require("../Protocol.js");
class CSUsernamePacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.CSUsernamePacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.S;
        this.sentAfterHandshake = false;
    }
    serialize() {
        return Buffer.concat([
            [this.packetId],
            Protocol_js_1.MineProtocol.writeString(this.username),
            Protocol_js_1.MineProtocol.writeString(CSUsernamePacket.DEFAULT),
            [0x0],
        ].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    deserialize(packet) {
        packet = packet.subarray(1);
        const username = Protocol_js_1.MineProtocol.readString(packet);
        this.username = username.value;
        return this;
    }
}
exports.CSUsernamePacket = CSUsernamePacket;
CSUsernamePacket.DEFAULT = "default";
