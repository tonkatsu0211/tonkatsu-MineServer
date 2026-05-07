"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
class DiskDB {
    constructor(folder, encoder, decoder, nameGenerator) {
        this.folder = path_1.default.isAbsolute(folder) ? folder : path_1.default.resolve(folder);
        this.encoder = encoder;
        this.decoder = decoder;
        this.nameGenerator = nameGenerator;
        if (!fs_1.default.existsSync(this.folder))
            fs_1.default.mkdirSync(this.folder);
    }
    async filter(f) {
        for (const file of await promises_1.default.readdir(this.folder)) {
            const fp = path_1.default.join(this.folder, file);
            if (!f(this.decoder(await promises_1.default.readFile(fp))))
                await promises_1.default.rm(fp);
        }
    }
    async get(k) {
        k = this.nameGenerator(k);
        if (!DiskDB.VALIDATION_REGEX.test(k))
            throw new InvalidKeyError("Invalid key, key can only consist of alphanumeric characters and _");
        const pth = path_1.default.join(this.folder, `${k}.data`);
        try {
            return this.decoder(await promises_1.default.readFile(pth));
        }
        catch (err) {
            return null;
        }
    }
    async set(k, v) {
        k = this.nameGenerator(k);
        if (!DiskDB.VALIDATION_REGEX.test(k))
            throw new InvalidKeyError("Invalid key, key can only consist of alphanumeric characters and _");
        const pth = path_1.default.join(this.folder, `${k}.data`);
        await promises_1.default.writeFile(pth, this.encoder(v));
    }
}
exports.default = DiskDB;
DiskDB.VALIDATION_REGEX = /^[0-9a-zA-Z_]+$/;
class InvalidKeyError extends Error {
    constructor(msg) {
        super(`[InvalidKeyError] : ${msg}`);
        this.name = "InvalidKeyError";
        Object.setPrototypeOf(this, InvalidKeyError);
    }
}
