"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSetSkinPacket = void 0;
const Constants_js_1 = require("../Constants.js");
const Enums_js_1 = require("../Enums.js");
const Protocol_js_1 = require("../Protocol.js");
class CSSetSkinPacket {
    constructor() {
        this.packetId = Enums_js_1.Enums.PacketId.CSSetSkinPacket;
        this.type = "packet";
        this.boundTo = Enums_js_1.Enums.PacketBounds.S;
        this.sentAfterHandshake = false;
        this.version = "skin_v1";
    }
    serialize() {
        if (this.skinType == Enums_js_1.Enums.SkinType.BUILTIN) {
            return Buffer.concat([
                Buffer.from([this.packetId]),
                Protocol_js_1.MineProtocol.writeString(this.version),
                Protocol_js_1.MineProtocol.writeVarInt(this.skinDimensions),
                this.skin,
            ]);
        }
        else {
            return Buffer.concat([
                [this.packetId],
                Protocol_js_1.MineProtocol.writeString(this.version),
                Constants_js_1.Constants.MAGIC_ENDING_CLIENT_UPLOAD_SKIN_BUILTIN,
                [this.skinId],
            ].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr))));
        }
    }
    deserialize(packet) {
        packet = packet.subarray(1);
        const version = Protocol_js_1.MineProtocol.readString(packet);
        let skinType;
        if (!Constants_js_1.Constants.MAGIC_ENDING_CLIENT_UPLOAD_SKIN_BUILTIN.some((byte, index) => byte !== version.newBuffer[index])) {
            // built in
            skinType = Enums_js_1.Enums.SkinType.BUILTIN;
            const id = Protocol_js_1.MineProtocol.readVarInt(version.newBuffer.subarray(Constants_js_1.Constants.MAGIC_ENDING_CLIENT_UPLOAD_SKIN_BUILTIN.length));
            this.version = version.value;
            this.skinType = skinType;
            this.skinId = id.value;
            return this;
        }
        else {
            // custom
            skinType = Enums_js_1.Enums.SkinType.CUSTOM;
            const dimensions = Protocol_js_1.MineProtocol.readVarInt(version.newBuffer), skin = dimensions.newBuffer.subarray(3).subarray(0, 16384);
            this.version = version.value;
            this.skinType = skinType;
            this.skinDimensions = dimensions.value;
            this.skin = skin;
            return this;
        }
    }
}
exports.CSSetSkinPacket = CSSetSkinPacket;
