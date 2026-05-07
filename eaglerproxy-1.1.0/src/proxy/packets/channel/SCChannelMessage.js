"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCChannelMessagePacket = void 0;
const Enums_js_1 = require("../../Enums.js");
const Protocol_js_1 = require("../../Protocol.js");
class SCChannelMessagePacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.SCChannelMessagePacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.C;
        this.sentAfterHandshake = true;
        this.messageType = Enums_js_1.Enums.ChannelMessageType.SERVER;
    }
    serialize() {
        return Buffer.concat([[this.packetId], Protocol_js_1.MineProtocol.writeString(this.channel), this.data].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    deserialize(packet) {
        packet = packet.subarray(1);
        const channel = Protocol_js_1.MineProtocol.readString(packet), data = channel.newBuffer;
        this.channel = channel.value;
        this.data = data;
        return this;
    }
}
exports.SCChannelMessagePacket = SCChannelMessagePacket;
