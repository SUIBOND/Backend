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
const port = 4000;
const platformId = '0x75aa898bf3a52a8cba6e885a950a1a2a02a5ff9c4d3dba94c03084efcc201986'; // 플랫폼 ID 변수화
// 미들웨어 추가: 요청 본문 파싱
app.use(express_1.default.json()); // 요청 본문이 JSON인 경우 파싱해줍니다.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Store the connected wallet address (this can be changed to store in DB or session)
let connectedWalletAddress = null;
// Endpoint to set the connected wallet address
app.post('/set-connected-wallet-address', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).send("Wallet address is required");
    }
    // Store the wallet address
    connectedWalletAddress = walletAddress;
    console.log(`Connected wallet address: ${connectedWalletAddress}`);
    res.status(200).send({ message: "Wallet address set successfully" });
})));
// /check-foundation-or-developer API
app.get('/check-foundation-or-developer', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const walletAddress = req.query.address;
    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }
    try {
        // External API call
        const response = yield axios_1.default.post('https://fullnode.testnet.sui.io:443', {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getOwnedObjects',
            params: [
                walletAddress,
                {
                    filter: {
                        MatchAll: [
                            { StructType: "0x75aa898bf3a52a8cba6e885a950a1a2a02a5ff9c4d3dba94c03084efcc201986::foundation::Foundation" },
                            { StructType: "0x75aa898bf3a52a8cba6e885a950a1a2a02a5ff9c4d3dba94c03084efcc201986::developer::Developer" }
                        ]
                    },
                    options: {
                        showType: true,
                        showOwner: true,
                        showPreviousTransaction: true
                    }
                },
                null,
                3
            ]
        });
        // Response verification
        const ownedObjects = ((_a = response.data.result) === null || _a === void 0 ? void 0 : _a.data) || [];
        console.log("Owned objects response:", ownedObjects);
        if (!Array.isArray(ownedObjects)) {
            res.status(500).json({ error: "Invalid data format received from API" });
            return;
        }
        // Logging each object type for debugging
        ownedObjects.forEach((obj, index) => {
            console.log(`Object ${index} type:`, obj.data.type);
        });
        // Check for Foundation or Developer object ownership
        const hasFoundationObject = ownedObjects.some((obj) => { var _a; return ((_a = obj.data) === null || _a === void 0 ? void 0 : _a.type) === "0x75aa898bf3a52a8cba6e885a950a1a2a02a5ff9c4d3dba94c03084efcc201986::foundation::Foundation"; });
        const hasDeveloperObject = ownedObjects.some((obj) => { var _a; return ((_a = obj.data) === null || _a === void 0 ? void 0 : _a.type) === "0x75aa898bf3a52a8cba6e885a950a1a2a02a5ff9c4d3dba94c03084efcc201986::developer::Developer"; });
        if (hasFoundationObject) {
            res.json({ result: 1 });
        }
        else if (hasDeveloperObject) {
            res.json({ result: 0 });
        }
        else {
            res.json({ result: null });
        }
    }
    catch (error) {
        console.error("Error fetching owned objects:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
})));
app.get('/getownedobject', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const walletAddress = req.query.address;
    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }
    try {
        const response = yield axios_1.default.post('https://rpc-testnet.suiscan.xyz:443', {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getOwnedObjects',
            params: [
                walletAddress,
                {
                    filter: {
                        MatchAll: [
                            { StructType: "0x2::coin::Coin<0x2::sui::SUI>" } // package::module::structure
                            // 0x75aa898bf3a52a8cba6e885a950a1a2a02a5ff9c4d3dba94c03084efcc201986::foundation::Foundation
                            // 0x75aa898bf3a52a8cba6e885a950a1a2a02a5ff9c4d3dba94c03084efcc201986::developer::Developer
                        ]
                    },
                    options: {
                        showType: true,
                        showOwner: true,
                        showPreviousTransaction: true
                    }
                },
                null,
                3 // Limit results to 3 items
            ]
        });
        res.json(response.data.result);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching owned objects', details: error.message });
    }
})));
// Existing /get-object/:objectId endpoint
app.get('/get-object/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    // Use the connected wallet address here if needed
    if (connectedWalletAddress) {
        console.log(`Using connected wallet address: ${connectedWalletAddress}`);
    }
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    res.json(result);
})));
// Existing /get-foundation-details/:objectId endpoint
app.get('/get-foundation-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c;
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
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
app.get('/get-bounty-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
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
    const filteredObj = Array.isArray(obj) ? [] : {}; // 객체 타입을 명시적으로 지정
    for (const key in obj) {
        if (fieldsToRemove.includes(key))
            continue;
        filteredObj[key] = filterFields(obj[key], fieldsToRemove);
    }
    return filteredObj;
};
// digest, version, dataType, hasPublicTransfer 없는 버전
// foundationID 파라미터 전달 시 foundation과 bounty 상세 정보를 가져오는 엔드포인트
app.get('/get-foundation-bounty-details/:foundationId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { foundationId } = req.params;
    if (!foundationId) {
        return res.status(400).send("Foundation ID is required");
    }
    // Foundation 객체에서 데이터 가져오기
    const foundationResult = yield (0, object_1.getObject)(foundationId);
    if (!foundationResult) {
        return res.status(404).send("Foundation not found");
    }
    // foundationDetails에서 bounty_table과 bounty_table_keys 제거
    const _h = foundationResult.content.fields, { bounty_table, bounty_table_keys } = _h, otherFields = __rest(_h, ["bounty_table", "bounty_table_keys"]);
    const filteredFoundationDetails = Object.assign(Object.assign({}, foundationResult), { content: Object.assign(Object.assign({}, foundationResult.content), { fields: otherFields }) });
    // bounty_table_keys의 각 키를 사용하여 bountyDetails 가져오기
    const bountyDetailsPromises = (bounty_table_keys || []).map((bountyKey) => __awaiter(void 0, void 0, void 0, function* () {
        return yield (0, object_1.getObject)(bountyKey);
    }));
    const bountyDetails = yield Promise.all(bountyDetailsPromises);
    // bountyDetails를 foundationDetails 내부에 포함
    const finalResult = {
        foundationDetails: Object.assign(Object.assign({}, filteredFoundationDetails), { content: Object.assign(Object.assign({}, filteredFoundationDetails.content), { fields: Object.assign(Object.assign({}, filteredFoundationDetails.content.fields), { bountyDetails: bountyDetails.filter(Boolean) // null 값을 제외하고 반환
                 }) }) })
    };
    // digest, version, dataType, hasPublicTransfer 필드를 제거
    const fieldsToRemove = ['digest', 'version', 'dataType', 'hasPublicTransfer'];
    const filteredResult = filterFields(finalResult, fieldsToRemove);
    res.json(filteredResult);
})));
// digest, version, dataType, hasPublicTransfer 있는 버전
// // foundationId로 foundation과 bounty 상세 정보를 얻는 새로운 엔드포인트
// app.get('/get-foundation-bounty-details/:foundationId', asyncHandler(async (req: Request, res: Response) => {
//     const { foundationId } = req.params;
//     if (!foundationId) {
//         return res.status(400).send("Foundation ID is required");
//     }
//     // Foundation 객체에서 데이터 가져오기
//     const foundationResult = await getObject(foundationId);
//     if (!foundationResult) {
//         return res.status(404).send("Foundation not found");
//     }
//     // foundationDetails에서 bounty_table과 bounty_table_keys를 제거
//     const { bounty_table, bounty_table_keys, ...otherFields } = foundationResult.content.fields;
//     const filteredFoundationDetails = {
//         ...foundationResult,
//         content: {
//             ...foundationResult.content,
//             fields: otherFields
//         }
//     };
//     // bounty_table_keys의 각 키를 사용하여 bountyDetails 가져오기
//     const bountyDetailsPromises = (bounty_table_keys || []).map(async (bountyKey: string) => {
//         return await getObject(bountyKey);
//     });
//     const bountyDetails = await Promise.all(bountyDetailsPromises);
//     // bountyDetails를 foundationDetails 내부에 포함
//     const finalResult = {
//         foundationDetails: {
//             ...filteredFoundationDetails,
//             content: {
//                 ...filteredFoundationDetails.content,
//                 fields: {
//                     ...filteredFoundationDetails.content.fields,
//                     bountyDetails: bountyDetails.filter(Boolean) // null 값을 제외하고 반환
//                 }
//             }
//         }
//     };
//     res.json(finalResult);
// }));
// New endpoint to get all bounty details based on platform ID
app.get('/get-all-bounties/:platformId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k;
    const { platformId } = req.params;
    if (!platformId) {
        return res.status(400).send("Platform ID is required");
    }
    // Step 1: Get platform details to retrieve foundation_ids
    const platformResult = yield (0, object_1.getObject)(platformId);
    if (!platformResult) {
        return res.status(404).send("Platform not found");
    }
    const foundationIds = (_k = (_j = platformResult.content) === null || _j === void 0 ? void 0 : _j.fields) === null || _k === void 0 ? void 0 : _k.foundation_ids;
    if (!foundationIds || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the platform object");
    }
    // Step 2: For each foundation ID, fetch the bounty table keys
    const foundationDetailsPromises = foundationIds.map((foundationId) => __awaiter(void 0, void 0, void 0, function* () {
        var _l, _m;
        const foundationResult = yield (0, object_1.getObject)(foundationId);
        if (foundationResult) {
            return ((_m = (_l = foundationResult.content) === null || _l === void 0 ? void 0 : _l.fields) === null || _m === void 0 ? void 0 : _m.bounty_table_keys) || [];
        }
        return [];
    }));
    const allBountyTableKeys = yield Promise.all(foundationDetailsPromises);
    // Flatten all bounty table keys into a single array
    const bountyTableKeys = allBountyTableKeys.flat();
    if (bountyTableKeys.length === 0) {
        return res.status(404).send("No bounty table keys found in the foundation objects");
    }
    // Step 3: For each bounty table key, fetch the bounty details
    const bountyDetailsPromises = bountyTableKeys.map((bountyKey) => __awaiter(void 0, void 0, void 0, function* () {
        const bountyResult = yield (0, object_1.getObject)(bountyKey);
        return bountyResult || null;
    }));
    const bountyDetails = yield Promise.all(bountyDetailsPromises);
    // Filter out any null values (if any)
    const validBountyDetails = bountyDetails.filter(Boolean);
    if (validBountyDetails.length === 0) {
        return res.status(404).send("No valid bounty details found");
    }
    // Return all the valid bounty details
    res.json({ bountyDetails: validBountyDetails });
})));
// New endpoint to retrieve completed bounty details
app.get('/get-completed-bounty-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _o, _p;
    const { objectId } = req.params;
    const result = yield (0, object_1.getObject)(objectId);
    const completedIds = ((_p = (_o = result.content) === null || _o === void 0 ? void 0 : _o.fields) === null || _p === void 0 ? void 0 : _p.completed) || [];
    const completedDetails = yield Promise.all(completedIds.map((completedId) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield (0, object_1.getObject)(completedId);
        return data;
    })));
    res.json({ completedDetails });
})));
// New endpoint to retrieve processing bounty details
app.get('/get-processing-bounty-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _q, _r;
    const { objectId } = req.params;
    const result = yield (0, object_1.getObject)(objectId);
    const processingIds = ((_r = (_q = result.content) === null || _q === void 0 ? void 0 : _q.fields) === null || _r === void 0 ? void 0 : _r.processing) || [];
    const processingDetails = yield Promise.all(processingIds.map((processingId) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield (0, object_1.getObject)(processingId);
        return data;
    })));
    res.json({ processingDetails });
})));
// New endpoint to retrieve unconfirmed proposal bounty details
app.get('/get-unconfirmed-bounty-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _s, _t;
    const { objectId } = req.params;
    const result = yield (0, object_1.getObject)(objectId);
    const unconfirmedProposalIds = ((_t = (_s = result.content) === null || _s === void 0 ? void 0 : _s.fields) === null || _t === void 0 ? void 0 : _t.unconfirmedProposal) || [];
    const unconfirmedProposalDetails = yield Promise.all(unconfirmedProposalIds.map((proposalId) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield (0, object_1.getObject)(proposalId);
        return data;
    })));
    res.json({ unconfirmedProposalDetails });
})));
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
