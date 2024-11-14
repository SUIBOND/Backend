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
// apis.ts
const express_1 = __importDefault(require("express"));
const object_1 = require("./object"); // getOwnedObjects import
const parse_1 = require("./parse"); // parse.ts에서 변환 함수 가져오기
const app = (0, express_1.default)();
const port = 3000;
const packageId = '0xd41317eeb1dbb1be8d818f8505fa674cb99debe112f0e221e2e9194227bd2cbf'; // Platform ID variable
app.use(express_1.default.json()); // Parse JSON request body
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Refactored endpoint to check for FoundationCap or DeveloperCap, using a wallet address as a path parameter
app.get('/validation/:walletAddress', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const walletAddress = req.params.walletAddress;
    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }
    try {
        // Use getOwnedObjects function from object.ts
        const ownedObjects = yield (0, object_1.getOwnedObjects)(walletAddress);
        console.log("Owned objects response:", ownedObjects);
        // Construct the type strings dynamically using packageId
        const foundationCapType = `${packageId}::foundation_cap::FoundationCap`;
        const developerCapType = `${packageId}::developer_cap::DeveloperCap`;
        console.log(`Looking for FoundationCap type: ${foundationCapType}`);
        console.log(`Looking for DeveloperCap type: ${developerCapType}`);
        // Find FoundationCap and DeveloperCap objects
        const foundationCap = ownedObjects.find((obj) => { var _a; return ((_a = obj.data) === null || _a === void 0 ? void 0 : _a.type) === foundationCapType; });
        const developerCap = ownedObjects.find((obj) => { var _a; return ((_a = obj.data) === null || _a === void 0 ? void 0 : _a.type) === developerCapType; });
        let result = null;
        if (foundationCap) {
            // Retrieve detailed FoundationCap object data using getObject function
            const foundationCapObjectId = foundationCap.data.objectId;
            const foundationCapDetails = yield (0, object_1.getObject)(foundationCapObjectId);
            console.log("FoundationCap details:", foundationCapDetails); // 로그 추가
            result = { type: "FoundationCap", details: foundationCapDetails };
        }
        if (developerCap) { // Separate if to allow both caps to be processed
            // Retrieve detailed DeveloperCap object data using getObject function
            const developerCapObjectId = developerCap.data.objectId;
            const developerCapDetails = yield (0, object_1.getObject)(developerCapObjectId);
            console.log("DeveloperCap details:", developerCapDetails); // 로그 추가
            if (result) {
                // If both caps are present, add DeveloperCap details
                result.message = "Both FoundationCap and DeveloperCap are owned.";
                result.developerCapDetails = developerCapDetails;
            }
            else {
                // If only DeveloperCap is present
                result = { type: "DeveloperCap", details: developerCapDetails };
            }
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
// Refactored endpoint to retrieve detailed foundation information
// platformId가 소유하고 있는 전체 foundation의 목록을 가져오는 endpoint
app.get('/foundations/:platformId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { platformId } = req.params;
    if (!platformId) {
        return res.status(400).send("Platform Object ID is required");
    }
    // 1. platformId로 객체 가져오기
    const result = yield (0, object_1.getObject)(platformId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    // 2. 해당 객체에서 foundation_ids 추출
    const foundationIds = (_b = (_a = result.content) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }
    // 3. foundationIds 각각에 대해 객체를 가져오고 파싱
    const foundationDetailsPromises = foundationIds.map((foundationId) => __awaiter(void 0, void 0, void 0, function* () {
        const foundationData = yield (0, object_1.getObject)(foundationId); // foundation 데이터 가져오기
        return (0, parse_1.parseFoundationData)(foundationData); // 가져온 데이터를 파싱
    }));
    // 4. 모든 foundation 데이터를 파싱한 후 결과 반환
    const foundation = yield Promise.all(foundationDetailsPromises);
    res.json({ foundation }); // 파싱된 데이터를 응답으로 반환
})));
// Utility to filter specified fields from an object
const filterFields = (obj, fieldsToRemove) => {
    if (typeof obj !== 'object' || obj === null)
        return obj;
    const filteredObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (fieldsToRemove.includes(key))
            continue;
        filteredObj[key] = filterFields(obj[key], fieldsToRemove);
    }
    return filteredObj;
};
// Function to retrieve and filter foundation and bounty details
// foundationId가 소유하고 있는 bounty의 상세 정보를 가져오는 endpoint
app.get('/foundations/bounties/:foundationId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { foundationId } = req.params;
    if (!foundationId) {
        return res.status(400).send("Foundation ID is required");
    }
    const foundationResult = yield (0, object_1.getObject)(foundationId);
    if (!foundationResult) {
        return res.status(404).send("Foundation not found");
    }
    const _c = foundationResult.content.fields, { bounty_table, bounty_table_keys } = _c, otherFields = __rest(_c, ["bounty_table", "bounty_table_keys"]);
    const filteredFoundationDetails = Object.assign(Object.assign({}, foundationResult), { content: Object.assign(Object.assign({}, foundationResult.content), { fields: otherFields }) });
    const bountyDetailsPromises = (bounty_table_keys || []).map((bountyKey) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, object_1.getObject)(bountyKey); }));
    const bountyDetails = yield Promise.all(bountyDetailsPromises);
    const filteredBountyDetails = bountyDetails.map(bountyDetail => filterFields(bountyDetail, ["digest", "version", "dataType", "hasPublicTransfer"]));
    res.json({
        foundationDetails: filteredFoundationDetails,
        bountyDetails: filteredBountyDetails
    });
})));
// New endpoint to retrieve DeveloperCap details by developerCapId
// 해당 developerCapId가 소유한 proposals 데이터를 얻을 수 있음
app.get('/developer/proposals/:developerCapId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { developerCapId } = req.params;
    if (!developerCapId) {
        return res.status(400).json({ error: "DeveloperCap ID is required" });
    }
    try {
        const developerCapDetails = yield (0, object_1.getObject)(developerCapId);
        if (!developerCapDetails) {
            return res.status(404).json({ error: "DeveloperCap not found" });
        }
        res.json({ developerCapDetails });
    }
    catch (error) {
        console.error("Error fetching DeveloperCap details:", error);
        res.status(500).json({ error: "Failed to retrieve DeveloperCap details" });
    }
})));
// app.get('/object/:platformId', asyncHandler(async (req: Request, res: Response) => {
//     const { platformId } = req.params;
//     if (!platformId) {
//         return res.status(400).json({ error: "Platform ID is required" });
//     }
//     try {
//         // Retrieve the main object details using platformId
//         const objectDetails = await getObject(platformId);
//         if (!objectDetails) {
//             return res.status(404).json({ error: "Object not found" });
//         }
//         // Extract foundation_ids and bounty_table_keys from the object details
//         const foundationIds = objectDetails.content?.fields?.foundation_ids;
//         const foundationDetails: any[] = [];
//         if (foundationIds && Array.isArray(foundationIds) && foundationIds.length > 0) {
//             // Fetch details of each foundation_id using getObject
//             const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
//                 const foundationDetail = await getObject(foundationId);
//                 if (foundationDetail && foundationDetail.content?.fields?.bounty_table_keys) {
//                     // Fetch details of each bounty_table_key within the foundation
//                     const bountyTableKeys = foundationDetail.content.fields.bounty_table_keys;
//                     const bountyDetailsPromises = bountyTableKeys.map(async (bountyKey: string) => {
//                         // Fetch the object details for each bounty_key
//                         return await getObject(bountyKey);
//                     });
//                     const bountyDetails = await Promise.all(bountyDetailsPromises);
//                     foundationDetail.content.fields.bounty_details = bountyDetails;
//                 }
//                 return foundationDetail;
//             });
//             foundationDetails.push(...await Promise.all(foundationDetailsPromises));
//         }
//         // Add foundation details to the response
//         objectDetails.content.fields.foundation_details = foundationDetails;
//         // Fetch and add all bounty table keys object details into response
//         if (foundationDetails.length > 0) {
//             const allBountyDetails = foundationDetails.flatMap((foundationDetail: any) =>
//                 foundationDetail.content?.fields?.bounty_details || []
//             );
//             // Fetch object details for all bounty keys
//             const allBountyDetailsPromises = allBountyDetails.map(async (bountyDetail: any) => {
//                 return await getObject(bountyDetail.objectId);
//             });
//             const allBountyDetailsFetched = await Promise.all(allBountyDetailsPromises);
//             // Append these objects to the response
//             objectDetails.content.fields.all_bounty_details = allBountyDetailsFetched;
//         }
//         // Return the object details including all bounty table objects
//         res.json({ objectDetails });
//     } catch (error) {
//         console.error("Error fetching object details:", error);
//         res.status(500).json({ error: "Failed to retrieve object details" });
//     }
// }));
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
