"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCSyncUuidPacket = void 0;
const Enums_js_1 = require("../Enums.js");
const Protocol_js_1 = require("../Protocol.js");
const Util_js_1 = require("../Util.js");
class SCSyncUuidPacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.SCSyncUuidPacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.C;
        this.sentAfterHandshake = false;
    }
    serialize() {
        return Buffer.concat([
            [this.packetId],
            Protocol_js_1.MineProtocol.writeString(this.username),
            Util_js_1.Util.uuidStringToBuffer(this.uuid),
        ].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
    }
    deserialize(packet) {
        packet = packet.subarray(1);
        const username = Protocol_js_1.MineProtocol.readString(packet), uuid = username.newBuffer.subarray(0, 15);
        this.username = username.value;
        this.uuid = Util_js_1.Util.uuidBufferToString(uuid);
        return this;
    }
}
exports.SCSyncUuidPacket = SCSyncUuidPacket;
