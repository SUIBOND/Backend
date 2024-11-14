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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const object_1 = require("./object");
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
const port = 3000;
const packageId = '0x7e86551436c07a7c548ab2ebc4007284d8bfca9b2f4e9445a9738f0d664d1f4a'; // Platform ID variable
const SUI_RPC_ENDPOINT = 'https://fullnode.testnet.sui.io:443'; // Sui RPC Endpoint (example for testnet)
// Add middleware: parse request body
app.use(express_1.default.json()); // Parse JSON request body
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// wallet address 입력 시 해당 wallet address의 foundation_cap, developer_cap 확인 가능
app.get('/check-foundation-or-developer/:walletAddress', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const walletAddress = req.params.walletAddress;
    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }
    try {
        const response = yield axios_1.default.post(SUI_RPC_ENDPOINT, {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getOwnedObjects',
            params: [
                walletAddress,
                {
                    options: { showType: true }
                }
            ]
        });
        const ownedObjects = ((_a = response.data.result) === null || _a === void 0 ? void 0 : _a.data) || [];
        console.log("Owned objects response:", ownedObjects);
        // Construct the type strings dynamically using platformId
        const foundationCapType = `${packageId}::foundation_cap::FoundationCap`;
        const developerCapType = `${packageId}::developer_cap::DeveloperCap`;
        const foundationCap = ownedObjects.find((obj) => { var _a; return ((_a = obj.data) === null || _a === void 0 ? void 0 : _a.type) === foundationCapType; });
        const developerCap = ownedObjects.find((obj) => { var _a; return ((_a = obj.data) === null || _a === void 0 ? void 0 : _a.type) === developerCapType; });
        let result = null;
        if (foundationCap) {
            // Retrieve detailed FoundationCap object data via /get-object
            const foundationCapObjectId = foundationCap.data.objectId;
            const foundationCapDetails = yield (0, object_1.getObject)(foundationCapObjectId);
            result = { type: "FoundationCap", details: foundationCapDetails };
        }
        else if (developerCap) {
            // Retrieve detailed DeveloperCap object data via /get-object
            const developerCapObjectId = developerCap.data.objectId;
            const developerCapDetails = yield (0, object_1.getObject)(developerCapObjectId);
            result = { type: "DeveloperCap", details: developerCapDetails };
        }
        if (!result) {
            res.status(404).json({ error: "No DeveloperCap or FoundationCap found" });
        }
        else {
            res.json(result);
        }
    }
    catch (error) {
        console.error("Error fetching owned objects:", error);
        res.status(500).json({ error: "Failed to retrieve owned objects" });
    }
})));
// Set up the `/getownedobject/:walletAddress` route
app.get('/getownedobject/:walletAddress', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { walletAddress } = req.params;
    try {
        // Configure Sui JSON-RPC request
        const response = yield axios_1.default.post(SUI_RPC_ENDPOINT, {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getAllCoins',
            params: [walletAddress],
        });
        // Extract object data from RPC call result
        const objects = response.data.result.data;
        // Return response in JSON format
        res.json({ ownedObjects: objects });
    }
    catch (error) {
        console.error('Error fetching owned objects:', error);
        res.status(500).json({ error: 'Failed to retrieve owned objects' });
    }
}));
// Existing /get-object/:objectId endpoint
app.get('/get-object/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    res.json(result);
})));
// Existing /get-foundation-details/:objectId endpoint
// platformObjId 입력 시 모든 foundation 출력 / bounty_table, bounty_table_keys, foundation_name, foundation_cap, owner 확인 가능
app.get('/get-all-foundation-details/:platformId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Platform Object ID is required");
    }
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    const foundationIds = (_c = (_b = result.content) === null || _b === void 0 ? void 0 : _b.fields) === null || _c === void 0 ? void 0 : _c.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }
    const foundationDetailsPromises = foundationIds.map((foundationId) => __awaiter(void 0, void 0, void 0, function* () {
        const foundationData = yield (0, object_1.getObject)(foundationId);
        return foundationData;
    }));
    const foundationDetails = yield Promise.all(foundationDetailsPromises);
    res.json({
        foundationDetails
    });
})));
// Retrieve detailed bounty information
// platformObjId 입력 시 모든 bounty 출력 / bounty_type, foundation(bounty_owner), fund_balance, max_amount, min_amount, foundation_name, proposals(completed, processing, unconfirmed) 확인 가능
app.get('/get-bounty-details/:platformId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Platform Object ID is required");
    }
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    const foundationIds = (_e = (_d = result.content) === null || _d === void 0 ? void 0 : _d.fields) === null || _e === void 0 ? void 0 : _e.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }
    const foundationDetailsPromises = foundationIds.map((foundationId) => __awaiter(void 0, void 0, void 0, function* () {
        const foundationData = yield (0, object_1.getObject)(foundationId);
        return foundationData;
    }));
    const foundationDetails = yield Promise.all(foundationDetailsPromises);
    const bountyDetailsPromises = foundationDetails.map((foundationDetail) => __awaiter(void 0, void 0, void 0, function* () {
        var _f, _g;
        const bountyTableKeys = (_g = (_f = foundationDetail.content) === null || _f === void 0 ? void 0 : _f.fields) === null || _g === void 0 ? void 0 : _g.bounty_table_keys;
        if (!bountyTableKeys || !Array.isArray(bountyTableKeys) || bountyTableKeys.length === 0) {
            return null;
        }
        const bountyDetails = yield Promise.all(bountyTableKeys.map((bountyKey) => __awaiter(void 0, void 0, void 0, function* () {
            const bountyData = yield (0, object_1.getObject)(bountyKey);
            return bountyData;
        })));
        return bountyDetails;
    }));
    const bountyDetails = yield Promise.all(bountyDetailsPromises);
    res.json({
        bountyDetails
    });
})));
const filterFields = (obj, fieldsToRemove) => {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    const filteredObj = Array.isArray(obj) ? [] : {}; // Explicitly define object type
    for (const key in obj) {
        if (fieldsToRemove.includes(key))
            continue;
        filteredObj[key] = filterFields(obj[key], fieldsToRemove);
    }
    return filteredObj;
};
// Version without digest, version, dataType, hasPublicTransfer
// Endpoint to get foundation and bounty details when foundationID is provided
app.get('/get-foundation-bounty-details/:foundationId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { foundationId } = req.params;
    if (!foundationId) {
        return res.status(400).send("Foundation ID is required");
    }
    // Get data from Foundation object
    const foundationResult = yield (0, object_1.getObject)(foundationId);
    if (!foundationResult) {
        return res.status(404).send("Foundation not found");
    }
    // Remove bounty_table and bounty_table_keys from foundationDetails
    const _h = foundationResult.content.fields, { bounty_table, bounty_table_keys } = _h, otherFields = __rest(_h, ["bounty_table", "bounty_table_keys"]);
    const filteredFoundationDetails = Object.assign(Object.assign({}, foundationResult), { content: Object.assign(Object.assign({}, foundationResult.content), { fields: otherFields }) });
    // Retrieve bountyDetails using each key in bounty_table_keys
    const bountyDetailsPromises = (bounty_table_keys || []).map((bountyKey) => __awaiter(void 0, void 0, void 0, function* () {
        return yield (0, object_1.getObject)(bountyKey);
    }));
    const bountyDetails = yield Promise.all(bountyDetailsPromises);
    const filteredBountyDetails = bountyDetails.map(bountyDetail => filterFields(bountyDetail, ["digest", "version", "dataType", "hasPublicTransfer"]));
    res.json({
        foundationDetails: filteredFoundationDetails,
        bountyDetails: filteredBountyDetails
    });
})));
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
