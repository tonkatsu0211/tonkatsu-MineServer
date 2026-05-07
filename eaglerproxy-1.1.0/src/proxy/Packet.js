"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPackets = void 0;
const path_1 = require("path");
const url_1 = require("url");
const Util_js_1 = require("./Util.js");
async function loadPackets(dir) {
    const files = (await Util_js_1.Util.recursiveFileSearch(dir ?? (0, path_1.join)((0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url)), "packets"))).filter((f) => f.endsWith(".js") && !f.endsWith(".disabled.js"));
    const packetRegistry = new Map();
    for (const file of files) {
        const imp = await (_a = process.platform == "win32" ? (0, url_1.pathToFileURL)(file).toString() : file, Promise.resolve().then(() => __importStar(require(_a))));
        for (const val of Object.values(imp)) {
            if (val != null) {
                let e;
                try {
                    e = new val();
                }
                catch { }
                if (e != null && e.type == "packet") {
                    e.class = val;
                    packetRegistry.set(e.packetId, e);
                }
            }
        }
    }
    return packetRegistry;
}
exports.loadPackets = loadPackets;
