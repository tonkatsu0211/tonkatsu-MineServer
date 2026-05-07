"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_js_1 = require("../Chat.js");
const Enums_js_1 = require("../Enums.js");
const Protocol_js_1 = require("../Protocol.js");
class SCDisconnectPacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.SCDisconnectPacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.C;
        this.sentAfterHandshake = false;
    }
    serialize() {
        const msg = typeof this.reason == "string"
            ? this.reason
            : Chat_js_1.Chat.chatToPlainString(this.reason);
        return Buffer.concat([
            [0xff],
            Protocol_js_1.MineProtocol.writeVarInt(SCDisconnectPacket.REASON),
            Protocol_js_1.MineProtocol.writeString(" " + msg + " "),
        ].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    deserialize(packet) {
        if (packet[0] != this.packetId)
            throw new Error("Invalid packet ID!");
        packet = packet.subarray(1 + Protocol_js_1.MineProtocol.writeVarInt(SCDisconnectPacket.REASON).length);
        const reason = Protocol_js_1.MineProtocol.readString(packet);
        this.reason = reason.value;
        return this;
    }
}
exports.default = SCDisconnectPacket;
SCDisconnectPacket.REASON = 0x8;
