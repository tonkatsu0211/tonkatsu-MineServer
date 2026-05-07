"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const crypto_1 = require("crypto");
const events_1 = __importDefault(require("events"));
const prismarine_auth_1 = __importDefault(require("prismarine-auth"));
const CustomAuthflow_js_1 = require("./CustomAuthflow.js");
const { Authflow, Titles } = prismarine_auth_1.default;
const Enums = PLUGIN_MANAGER.Enums;
class InMemoryCache {
    constructor() {
        this.cache = {};
    }
    async getCached() {
        return this.cache;
    }
    async setCached(value) {
        this.cache = value;
    }
    async setCachedPartial(value) {
        this.cache = {
            ...this.cache,
            ...value,
        };
    }
}
function auth(quit) {
    const emitter = new events_1.default();
    const userIdentifier = (0, crypto_1.randomUUID)();
    const flow = new CustomAuthflow_js_1.CustomAuthflow(userIdentifier, ({ username, cacheName }) => new InMemoryCache(), {
        authTitle: Titles.MinecraftJava,
        flow: "sisu",
        deviceType: "Win32",
    }, (code) => {
        console.log = () => { };
        emitter.emit("code", code);
    });
    flow
        .getMinecraftJavaToken({ fetchProfile: true }, quit)
        .then(async (data) => {
        if (!data || quit.quit)
            return;
        const _data = (await flow.mca.cache.getCached()).mca;
        if (data.profile == null || data.profile.error)
            return emitter.emit("error", new Error(Enums.ChatColor.RED + "Couldn't fetch profile data, does the account own Minecraft: Java Edition?"));
        emitter.emit("done", {
            accessToken: data.token,
            expiresOn: _data.obtainedOn + _data.expires_in * 1000,
            selectedProfile: data.profile,
            availableProfiles: [data.profile],
        });
    })
        .catch((err) => {
        if (err.toString().includes("Not Found"))
            emitter.emit("error", new Error(Enums.ChatColor.RED + "The provided account doesn't own Minecraft: Java Edition!"));
        else
            emitter.emit("error", new Error(Enums.ChatColor.YELLOW + err.toString()));
    });
    return emitter;
}
exports.auth = auth;
