"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSReadyPacket = void 0;
const Enums_js_1 = require("../Enums.js");
class CSReadyPacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.CSReadyPacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.S;
        this.sentAfterHandshake = false;
    }
    serialize() {
        return Buffer.from([this.packetId]);
    }
    deserialize(packet) {
        return this;
    }
}
exports.CSReadyPacket = CSReadyPacket;
