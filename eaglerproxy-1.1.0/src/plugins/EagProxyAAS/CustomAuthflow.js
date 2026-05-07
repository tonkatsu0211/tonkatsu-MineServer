"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomAuthflow = void 0;
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const Constants_js_1 = __importDefault(require("prismarine-auth/src/common/Constants.js"));
const { Endpoints, msalConfig } = Constants_js_1.default;
const LiveTokenManager_js_1 = __importDefault(require("prismarine-auth/src/TokenManagers/LiveTokenManager.js"));
const MinecraftJavaTokenManager_js_1 = __importDefault(require("prismarine-auth/src/TokenManagers/MinecraftJavaTokenManager.js"));
const XboxTokenManager_js_1 = __importDefault(require("prismarine-auth/src/TokenManagers/XboxTokenManager.js"));
const MsaTokenManager_js_1 = __importDefault(require("prismarine-auth/src/TokenManagers/MsaTokenManager.js"));
const MinecraftBedrockTokenManager_js_1 = __importDefault(require("prismarine-auth/src/TokenManagers/MinecraftBedrockTokenManager.js"));
async function retry(methodFn, beforeRetry, times) {
    while (times--) {
        if (times !== 0) {
            try {
                return await methodFn();
            }
            catch (e) {
                if (e instanceof URIError) {
                    throw e;
                }
                else {
                    // debug(e);
                }
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await beforeRetry();
        }
        else {
            return await methodFn();
        }
    }
}
class CustomAuthflow {
    constructor(username = "", cache, options, codeCallback) {
        this.username = username;
        if (options && !options.flow) {
            throw new Error("Missing 'flow' argument in options. See docs for more information.");
        }
        this.options = options || { flow: "msal" };
        this.initTokenManagers(username, cache);
        this.codeCallback = codeCallback;
    }
    initTokenManagers(username, cache) {
        if (this.options.flow === "live" || this.options.flow === "sisu") {
            if (!this.options.authTitle)
                throw new Error(`Please specify an "authTitle" in Authflow constructor when using ${this.options.flow} flow`);
            this.msa = new LiveTokenManager_js_1.default(this.options.authTitle, ["service::user.auth.xboxlive.com::MBI_SSL"], cache({ cacheName: this.options.flow, username }));
            this.doTitleAuth = true;
        }
        else if (this.options.flow === "msal") {
            const config = Object.assign({ ...msalConfig }, this.options.authTitle ? { auth: { ...msalConfig.auth, clientId: this.options.authTitle } } : {});
            this.msa = new MsaTokenManager_js_1.default(config, ["XboxLive.signin", "offline_access"], cache({ cacheName: "msal", username }));
        }
        else {
            throw new Error(`Unknown flow: ${this.options.flow} (expected "live", "sisu", or "msal")`);
        }
        const keyPair = crypto_1.default.generateKeyPairSync("ec", { namedCurve: "P-256" });
        this.xbl = new XboxTokenManager_js_1.default(keyPair, cache({ cacheName: "xbl", username }));
        this.mba = new MinecraftBedrockTokenManager_js_1.default(cache({ cacheName: "bed", username }));
        this.mca = new MinecraftJavaTokenManager_js_1.default(cache({ cacheName: "mca", username }));
    }
    static resetTokenCaches(cache) {
        if (!cache)
            throw new Error("You must provide a cache directory to reset.");
        try {
            if (fs_1.default.existsSync(cache)) {
                fs_1.default.rmSync(cache, { recursive: true });
                return true;
            }
        }
        catch (e) {
            console.log("Failed to clear cache dir", e);
            return false;
        }
    }
    async getMsaToken() {
        if (await this.msa.verifyTokens()) {
            const { token } = await this.msa.getAccessToken();
            return token;
        }
        else {
            const ret = await this.msa.authDeviceCode((response) => {
                if (this.codeCallback)
                    return this.codeCallback(response);
                console.info("[msa] First time signing in. Please authenticate now:");
                console.info(response.message);
            });
            if (ret.account) {
                console.info(`[msa] Signed in as ${ret.account.username}`);
            }
            else {
                // We don't get extra account data here per scope
                console.info("[msa] Signed in with Microsoft");
            }
            return ret.accessToken;
        }
    }
    async getXboxToken(relyingParty = this.options.relyingParty || Endpoints.XboxRelyingParty, forceRefresh = false) {
        const options = { ...this.options, relyingParty };
        const { xstsToken, userToken, deviceToken, titleToken } = await this.xbl.getCachedTokens(relyingParty);
        if (xstsToken.valid && !forceRefresh) {
            return xstsToken.data;
        }
        if (options.password) {
            const xsts = await this.xbl.doReplayAuth(this.username, options.password, options);
            return xsts;
        }
        return await retry(async () => {
            const msaToken = await this.getMsaToken();
            // sisu flow generates user and title tokens differently to other flows and should also be used to refresh them if they are invalid
            if (options.flow === "sisu" && (!userToken.valid || !deviceToken.valid || !titleToken.valid)) {
                const dt = await this.xbl.getDeviceToken(options);
                const sisu = await this.xbl.doSisuAuth(msaToken, dt, options);
                return sisu;
            }
            const ut = userToken.token ?? (await this.xbl.getUserToken(msaToken, options.flow === "msal"));
            const dt = deviceToken.token ?? (await this.xbl.getDeviceToken(options));
            const tt = titleToken.token ?? (this.doTitleAuth ? await this.xbl.getTitleToken(msaToken, dt) : undefined);
            const xsts = await this.xbl.getXSTSToken({ userToken: ut, deviceToken: dt, titleToken: tt }, options);
            return xsts;
        }, () => {
            this.msa.forceRefresh = true;
        }, 2);
    }
    async getMinecraftJavaToken(options = {}, quit) {
        const response = { token: "", entitlements: {}, profile: {} };
        if (await this.mca.verifyTokens()) {
            const { token } = await this.mca.getCachedAccessToken();
            response.token = token;
        }
        else {
            await retry(async () => {
                const xsts = await this.getXboxToken(Endpoints.PCXSTSRelyingParty);
                response.token = await this.mca.getAccessToken(xsts);
                if (quit.quit)
                    return;
            }, () => {
                this.xbl.forceRefresh = true;
            }, 2);
        }
        if (quit.quit)
            return;
        if (options.fetchEntitlements) {
            response.entitlements = await this.mca.fetchEntitlements(response.token).catch((e) => { });
        }
        if (options.fetchProfile) {
            response.profile = await this.mca.fetchProfile(response.token).catch((e) => { });
        }
        if (options.fetchCertificates) {
            response.certificates = await this.mca.fetchCertificates(response.token).catch((e) => []);
        }
        return response;
    }
    async getMinecraftBedrockToken(publicKey) {
        // TODO: Fix cache, in order to do cache we also need to cache the ECDH keys so disable it
        // is this even a good idea to cache?
        if ((await this.mba.verifyTokens()) && false) {
            // eslint-disable-line
            const { chain } = this.mba.getCachedAccessToken();
            return chain;
        }
        else {
            if (!publicKey)
                throw new Error("Need to specifiy a ECDH x509 URL encoded public key");
            return await retry(async () => {
                const xsts = await this.getXboxToken(Endpoints.BedrockXSTSRelyingParty);
                const token = await this.mba.getAccessToken(publicKey, xsts);
                // If we want to auth with a title ID, make sure there's a TitleID in the response
                const body = JSON.parse(Buffer.from(token.chain[1].split(".")[1], "base64").toString());
                if (!body.extraData.titleId && this.doTitleAuth) {
                    throw Error("missing titleId in response");
                }
                return token.chain;
            }, () => {
                this.xbl.forceRefresh = true;
            }, 2);
        }
    }
}
exports.CustomAuthflow = CustomAuthflow;
