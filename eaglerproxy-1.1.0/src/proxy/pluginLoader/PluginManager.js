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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
const fs = __importStar(require("fs/promises"));
const pathUtil = __importStar(require("path"));
const semver = __importStar(require("semver"));
const events_1 = require("events");
const url_1 = require("url");
const logger_js_1 = require("../../logger.js");
const meta_js_1 = require("../../meta.js");
const Util_js_1 = require("../Util.js");
const Enums_js_1 = require("../Enums.js");
const Chat_js_1 = require("../Chat.js");
const Constants_js_1 = require("../Constants.js");
const Motd_js_1 = require("../Motd.js");
const Player_js_1 = require("../Player.js");
const Protocol_js_1 = require("../Protocol.js");
const EaglerSkins_js_1 = require("../skins/EaglerSkins.js");
const BungeeUtil_js_1 = require("../BungeeUtil.js");
class PluginManager extends events_1.EventEmitter {
    constructor(loadDir) {
        super();
        this.Logger = logger_js_1.Logger;
        this.Enums = Enums_js_1.Enums;
        this.Chat = Chat_js_1.Chat;
        this.Constants = Constants_js_1.Constants;
        this.Motd = Motd_js_1.Motd;
        this.Player = Player_js_1.Player;
        this.MineProtocol = Protocol_js_1.MineProtocol;
        this.EaglerSkins = EaglerSkins_js_1.EaglerSkins;
        this.Util = Util_js_1.Util;
        this.BungeeUtil = BungeeUtil_js_1.BungeeUtil;
        this.setMaxListeners(0);
        this._loadDir = loadDir;
        this.plugins = new Map();
        this.Logger = logger_js_1.Logger;
        this._logger = new this.Logger("PluginManager");
    }
    async loadPlugins() {
        this._logger.info("Loading plugin metadata files...");
        const pluginMeta = await this._findPlugins(this._loadDir);
        await this._validatePluginList(pluginMeta);
        let pluginsString = "";
        for (const [id, plugin] of pluginMeta) {
            pluginsString += `${id}@${plugin.version}`;
        }
        pluginsString = pluginsString.substring(0, pluginsString.length - 1);
        this._logger.info(`Found ${pluginMeta.size} plugin(s): ${pluginsString}`);
        if (pluginMeta.size !== 0) {
            this._logger.info(`Loading ${pluginMeta.size} plugin(s)...`);
            const successLoadCount = await this._loadPlugins(pluginMeta, this._getLoadOrder(pluginMeta));
            this._logger.info(`Successfully loaded ${successLoadCount} plugin(s).`);
        }
        this.emit("pluginsFinishLoading", this);
    }
    async _findPlugins(dir) {
        const ret = new Map();
        const lsRes = (await Promise.all((await fs.readdir(dir)).filter((ent) => !ent.endsWith(".disabled")).map(async (res) => [pathUtil.join(dir, res), await fs.stat(pathUtil.join(dir, res))])));
        for (const [path, details] of lsRes) {
            if (details.isFile()) {
                if (path.endsWith(".jar")) {
                    this._logger.warn(`Non-EaglerProxy plugin found! (${path})`);
                    this._logger.warn(`BungeeCord plugins are NOT supported! Only custom EaglerProxy plugins are allowed.`);
                }
                else if (path.endsWith(".zip")) {
                    this._logger.warn(`.zip file found in plugin directory! (${path})`);
                    this._logger.warn(`A .zip file was found in the plugins directory! Perhaps you forgot to unzip it?`);
                }
                else
                    this._logger.debug(`Skipping file found in plugin folder: ${path}`);
            }
            else {
                const metadataPath = pathUtil.resolve(pathUtil.join(path, "metadata.json"));
                let metadata;
                try {
                    const file = await fs.readFile(metadataPath);
                    metadata = JSON.parse(file.toString());
                    // do some type checking
                    if (typeof metadata.name != "string")
                        throw new TypeError("<metadata>.name is either null or not of a string type!");
                    if (typeof metadata.id != "string")
                        throw new TypeError("<metadata>.id is either null or not of a string type!");
                    if (/ /gm.test(metadata.id))
                        throw new Error(`<metadata>.id contains whitespace!`);
                    if (!semver.valid(metadata.version))
                        throw new Error("<metadata>.version is either null, not a string, or is not a valid SemVer!");
                    if (typeof metadata.entry_point != "string")
                        throw new TypeError("<metadata>.entry_point is either null or not a string!");
                    if (!metadata.entry_point.endsWith(".js"))
                        throw new Error(`<metadata>.entry_point (${metadata.entry_point}) references a non-JavaScript file!`);
                    if (!(await Util_js_1.Util.fsExists(pathUtil.resolve(path, metadata.entry_point))))
                        throw new Error(`<metadata>.entry_point (${metadata.entry_point}) references a non-existent file!`);
                    if (metadata.requirements instanceof Array == false)
                        throw new TypeError("<metadata>.requirements is either null or not an array!");
                    for (const requirement of metadata.requirements) {
                        if (typeof requirement != "object" || requirement == null)
                            throw new TypeError(`<metadata>.requirements[${metadata.requirements.indexOf(requirement)}] is either null or not an object!`);
                        if (typeof requirement.id != "string")
                            throw new TypeError(`<metadata>.requirements[${metadata.requirements.indexOf(requirement)}].id is either null or not a string!`);
                        if (/ /gm.test(requirement.id))
                            throw new TypeError(`<metadata>.requirements[${metadata.requirements.indexOf(requirement)}].id contains whitespace!`);
                        if (semver.validRange(requirement.version) == null && requirement.version != "any")
                            throw new TypeError(`<metadata>.requirements[${metadata.requirements.indexOf(requirement)}].version is either null or not a valid SemVer!`);
                    }
                    if (metadata.load_after instanceof Array == false)
                        throw new TypeError("<metadata>.load_after is either null or not an array!");
                    for (const loadReq of metadata.load_after) {
                        if (typeof loadReq != "string")
                            throw new TypeError(`<metadata>.load_after[${metadata.load_after.indexOf(loadReq)}] is either null, or not a valid ID!`);
                        if (/ /gm.test(loadReq))
                            throw new TypeError(`<metadata>.load_after[${metadata.load_after.indexOf(loadReq)}] contains whitespace!`);
                    }
                    if (metadata.incompatibilities instanceof Array == false)
                        throw new TypeError("<metadata>.incompatibilities is either null or not an array!");
                    for (const incompatibility of metadata.incompatibilities) {
                        if (typeof incompatibility != "object" || incompatibility == null)
                            throw new TypeError(`<metadata>.incompatibilities[${metadata.load_after.indexOf(incompatibility)}] is either null or not an object!`);
                        if (typeof incompatibility.id != "string")
                            throw new TypeError(`<metadata>.incompatibilities[${metadata.load_after.indexOf(incompatibility)}].id is either null or not a string!`);
                        if (/ /gm.test(incompatibility.id))
                            throw new TypeError(`<metadata>.incompatibilities[${metadata.load_after.indexOf(incompatibility)}].id contains whitespace!`);
                        if (semver.validRange(incompatibility.version) == null)
                            throw new TypeError(`<metadata>.incompatibilities[${metadata.load_after.indexOf(incompatibility)}].version is either null or not a valid SemVer!`);
                    }
                    if (ret.has(metadata.id))
                        throw new Error(`Duplicate plugin ID detected: ${metadata.id}. Are there duplicate plugins in the plugin folder?`);
                    ret.set(metadata.id, {
                        path: pathUtil.resolve(path),
                        ...metadata,
                    });
                }
                catch (err) {
                    this._logger.warn(`Failed to load plugin metadata file at ${metadataPath}: ${err.stack ?? err}`);
                    this._logger.warn("This plugin will skip loading due to an error.");
                }
            }
        }
        return ret;
    }
    async _validatePluginList(plugins) {
        var _a;
        for (const [id, plugin] of plugins) {
            for (const req of plugin.requirements) {
                if (!plugins.has(req.id) && req.id != "eaglerproxy" && !req.id.startsWith("module:")) {
                    this._logger.fatal(`Error whilst loading plugins: Plugin ${plugin.name}@${plugin.version} requires plugin ${req.id}@${req.version}, but it is not found!`);
                    this._logger.fatal("Loading has halted due to missing dependencies.");
                    process.exit(1);
                }
                if (req.id == "eaglerproxy") {
                    if (!semver.satisfies(meta_js_1.PROXY_VERSION, req.version) && req.version != "any") {
                        this._logger.fatal(`Error whilst loading plugins: Plugin ${plugin.name}@${plugin.version} requires a proxy version that satisfies the SemVer requirement ${req.version}, but the proxy version is ${meta_js_1.PROXY_VERSION} and does not satisfy the SemVer requirement!`);
                        this._logger.fatal("Loading has halted due to dependency issues.");
                        process.exit(1);
                    }
                }
                else if (req.id.startsWith("module:")) {
                    const moduleName = req.id.replace("module:", "");
                    try {
                        await (_a = moduleName, Promise.resolve().then(() => __importStar(require(_a))));
                    }
                    catch (err) {
                        if (err.code == "ERR_MODULE_NOT_FOUND") {
                            this._logger.fatal(`Plugin ${plugin.name}@${plugin.version} requires NPM module ${moduleName}${req.version == "any" ? "" : `@${req.version}`} to be installed, but it is not found!`);
                            this._logger.fatal(`Please install this missing package by running "npm install ${moduleName}${req.version == "any" ? "" : `@${req.version}`}". If you're using yarn, run "yarn add ${moduleName}${req.version == "any" ? "" : `@${req.version}`}" instead.`);
                            this._logger.fatal("Loading has halted due to dependency issues.");
                            process.exit(1);
                        }
                    }
                }
                else {
                    let dep = plugins.get(req.id);
                    if (!semver.satisfies(dep.version, req.version) && req.version != "any") {
                        this._logger.fatal(`Error whilst loading plugins: Plugin ${plugin.name}@${plugin.version} requires a version of plugin ${dep.name} that satisfies the SemVer requirement ${req.version}, but the plugin ${dep.name}'s version is ${dep.version} and does not satisfy the SemVer requirement!`);
                        this._logger.fatal("Loading has halted due to dependency issues.");
                        process.exit(1);
                    }
                }
            }
            plugin.incompatibilities.forEach((incomp) => {
                const plugin_incomp = plugins.get(incomp.id);
                if (plugin_incomp) {
                    if (semver.satisfies(plugin_incomp.version, incomp.version)) {
                        this._logger.fatal(`Error whilst loading plugins: Plugin incompatibility found! Plugin ${plugin.name}@${plugin.version} is incompatible with ${plugin_incomp.name}@${plugin_incomp.version} as it satisfies the SemVer requirement of ${incomp.version}!`);
                        this._logger.fatal("Loading has halted due to plugin incompatibility issues.");
                        process.exit(1);
                    }
                }
                else if (incomp.id == "eaglerproxy") {
                    if (semver.satisfies(meta_js_1.PROXY_VERSION, incomp.version)) {
                        this._logger.fatal(`Error whilst loading plugins: Plugin ${plugin.name}@${plugin.version} is incompatible with proxy version ${meta_js_1.PROXY_VERSION} as it satisfies the SemVer requirement of ${incomp.version}!`);
                        this._logger.fatal("Loading has halted due to plugin incompatibility issues.");
                        process.exit(1);
                    }
                }
            });
        }
    }
    _getLoadOrder(plugins) {
        let order = [], lastPlugin;
        plugins.forEach((v) => order.push(v.id));
        for (const [id, plugin] of plugins) {
            const load = plugin.load_after.filter((dep) => plugins.has(dep));
            if (load.length < 0) {
                order.push(plugin.id);
            }
            else {
                let mostLastIndexFittingDeps = -1;
                for (const loadEnt of load) {
                    if (loadEnt != lastPlugin) {
                        if (order.indexOf(loadEnt) + 1 > mostLastIndexFittingDeps) {
                            mostLastIndexFittingDeps = order.indexOf(loadEnt) + 1;
                        }
                    }
                }
                if (mostLastIndexFittingDeps != -1) {
                    order.splice(order.indexOf(plugin.id), 1);
                    order.splice(mostLastIndexFittingDeps - 1, 0, plugin.id);
                    lastPlugin = plugin;
                }
            }
        }
        return order;
    }
    async _loadPlugins(plugins, order) {
        var _a;
        let successCount = 0;
        for (const id of order) {
            let pluginMeta = plugins.get(id);
            try {
                const imp = await (_a = process.platform == "win32" ? (0, url_1.pathToFileURL)(pathUtil.join(pluginMeta.path, pluginMeta.entry_point)).toString() : pathUtil.join(pluginMeta.path, pluginMeta.entry_point), Promise.resolve().then(() => __importStar(require(_a))));
                this.plugins.set(pluginMeta.id, {
                    exports: imp,
                    metadata: pluginMeta,
                });
                successCount++;
                this.emit("pluginLoad", pluginMeta.id, imp);
            }
            catch (err) {
                this._logger.warn(`Failed to load plugin entry point for plugin (${pluginMeta.name}) at ${pluginMeta.path}: ${err.stack ?? err}`);
                this._logger.warn("This plugin will skip loading due to an error.");
            }
            return successCount;
        }
    }
}
exports.PluginManager = PluginManager;
