"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCReadyPacket = void 0;
const Enums_js_1 = require("../Enums.js");
class SCReadyPacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.SCReadyPacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.C;
        this.sentAfterHandshake = false;
    }
    serialize() {
        return Buffer.from([this.packetId]);
    }
    deserialize(packet) {
        return this;
    }
}
exports.SCReadyPacket = SCReadyPacket;
