"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnedObjects = exports.multiGetObjects = exports.getObject = exports.client = void 0;
const client_1 = require("@mysten/sui/client");
const axios_1 = __importDefault(require("axios"));
const TESTNET_ENDPOINT = "https://rpc-testnet.suiscan.xyz:443";
exports.client = new client_1.SuiClient({ url: TESTNET_ENDPOINT });
const getObject = (objectId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!objectId) {
        return;
    }
    try {
        const input = {
            id: objectId,
            options: {
                showContent: true,
            }
        };
        const res = yield exports.client.getObject(input);
        return res.data;
    }
    catch (e) {
        console.log("getObject failed: ", e, "objectId: ", objectId);
    }
});
exports.getObject = getObject;
const multiGetObjects = (objectIds) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const input = {
            ids: objectIds,
        };
        const res = yield exports.client.multiGetObjects(input);
        return res.map((r) => r.data);
    }
    catch (e) {
        console.error("batchGetObjects failed", e);
    }
});
exports.multiGetObjects = multiGetObjects;
// New getOwnedObjects function
const getOwnedObjects = (walletAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const response = yield axios_1.default.post(TESTNET_ENDPOINT, {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getOwnedObjects',
            params: [
                walletAddress,
                {
                    options: { showType: true },
                }
            ]
        });
        return ((_a = response.data.result) === null || _a === void 0 ? void 0 : _a.data) || [];
    }
    catch (error) {
        console.error("getOwnedObjects failed:", error);
    }
});
exports.getOwnedObjects = getOwnedObjects;
