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
const app = (0, express_1.default)();
const port = 4000;
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
app.get('/get-foundation-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    const foundationIds = (_b = (_a = result.content) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.foundation_ids;
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
    var _c, _d;
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    const foundationIds = (_d = (_c = result.content) === null || _c === void 0 ? void 0 : _c.fields) === null || _d === void 0 ? void 0 : _d.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }
    const foundationDetailsPromises = foundationIds.map((foundationId) => __awaiter(void 0, void 0, void 0, function* () {
        const foundationData = yield (0, object_1.getObject)(foundationId);
        return foundationData;
    }));
    const foundationDetails = yield Promise.all(foundationDetailsPromises);
    const bountyDetailsPromises = foundationDetails.map((foundationDetail) => __awaiter(void 0, void 0, void 0, function* () {
        var _e, _f;
        const bountyTableKeys = (_f = (_e = foundationDetail.content) === null || _e === void 0 ? void 0 : _e.fields) === null || _f === void 0 ? void 0 : _f.bounty_table_keys;
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
// /get-foundation-bounty-details/:foundationId 엔드포인트
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
    const _g = foundationResult.content.fields, { bounty_table, bounty_table_keys } = _g, otherFields = __rest(_g, ["bounty_table", "bounty_table_keys"]);
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
// New endpoint to retrieve completed bounty details
app.get('/get-completed-bounty-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j;
    const { objectId } = req.params;
    const result = yield (0, object_1.getObject)(objectId);
    const completedIds = ((_j = (_h = result.content) === null || _h === void 0 ? void 0 : _h.fields) === null || _j === void 0 ? void 0 : _j.completed) || [];
    const completedDetails = yield Promise.all(completedIds.map((completedId) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield (0, object_1.getObject)(completedId);
        return data;
    })));
    res.json({ completedDetails });
})));
// New endpoint to retrieve processing bounty details
app.get('/get-processing-bounty-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k, _l;
    const { objectId } = req.params;
    const result = yield (0, object_1.getObject)(objectId);
    const processingIds = ((_l = (_k = result.content) === null || _k === void 0 ? void 0 : _k.fields) === null || _l === void 0 ? void 0 : _l.processing) || [];
    const processingDetails = yield Promise.all(processingIds.map((processingId) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield (0, object_1.getObject)(processingId);
        return data;
    })));
    res.json({ processingDetails });
})));
// New endpoint to retrieve unconfirmed proposal bounty details
app.get('/get-unconfirmed-bounty-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _m, _o;
    const { objectId } = req.params;
    const result = yield (0, object_1.getObject)(objectId);
    const unconfirmedProposalIds = ((_o = (_m = result.content) === null || _m === void 0 ? void 0 : _m.fields) === null || _o === void 0 ? void 0 : _o.unconfirmedProposal) || [];
    const unconfirmedProposalDetails = yield Promise.all(unconfirmedProposalIds.map((proposalId) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield (0, object_1.getObject)(proposalId);
        return data;
    })));
    res.json({ unconfirmedProposalDetails });
})));
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
