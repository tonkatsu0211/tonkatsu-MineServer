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
const dotenv = __importStar(require("dotenv"));
const Proxy_js_1 = require("./proxy/Proxy.js");
const config_js_1 = require("./config.js");
dotenv.config();
const logger_js_1 = require("./logger.js");
const meta_js_1 = require("./meta.js");
const PluginManager_js_1 = require("./proxy/pluginLoader/PluginManager.js");
const path_1 = require("path");
const url_1 = require("url");
const ImageEditor_js_1 = require("./proxy/skins/ImageEditor.js");
const logger = new logger_js_1.Logger("Launcher");
let proxy;
global.CONFIG = config_js_1.config;
config_js_1.config.adapter.useNatives = config_js_1.config.adapter.useNatives ?? true;
logger.info("Loading libraries...");
await ImageEditor_js_1.ImageEditor.loadLibraries(config_js_1.config.adapter.useNatives);
logger.info("Loading plugins...");
const pluginManager = new PluginManager_js_1.PluginManager((0, path_1.join)((0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url)), "plugins"));
global.PLUGIN_MANAGER = pluginManager;
await pluginManager.loadPlugins();
proxy = new Proxy_js_1.Proxy(config_js_1.config.adapter, pluginManager);
pluginManager.proxy = proxy;
logger.info(`Launching ${meta_js_1.PROXY_BRANDING}...`);
await proxy.init();
global.PROXY = proxy;
