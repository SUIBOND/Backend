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
const express_1 = __importDefault(require("express"));
const object_1 = require("./object");
const app = (0, express_1.default)();
const port = 4000;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// 기존 /get-object/:objectId 엔드포인트 (패키지 ID로만 조회)
app.get('/get-object/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    // 원래 결과만 반환
    res.json(result);
})));
// 기존 /get-foundation-details/:objectId 엔드포인트
app.get('/get-foundation-details/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    // 주어진 objectId로 조회하여 foundation_ids 가져오기
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    const foundationIds = (_b = (_a = result.content) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }
    // foundation_ids로 추가 조회 수행
    const foundationDetailsPromises = foundationIds.map((foundationId) => __awaiter(void 0, void 0, void 0, function* () {
        const foundationData = yield (0, object_1.getObject)(foundationId);
        return foundationData;
    }));
    // 모든 foundation 상세 데이터를 비동기로 조회
    const foundationDetails = yield Promise.all(foundationDetailsPromises);
    // 원래 결과와 foundationDetails 추가하여 반환
    res.json({
        foundationDetails
    });
})));
// 새로운 /get-foundation-details-with-bounty/:objectId 엔드포인트
app.get('/get-foundation-details-with-bounty/:objectId', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const { objectId } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    // 주어진 objectId로 조회하여 foundation_ids 가져오기
    const result = yield (0, object_1.getObject)(objectId);
    if (!result) {
        return res.status(404).send("Object not found");
    }
    const foundationIds = (_d = (_c = result.content) === null || _c === void 0 ? void 0 : _c.fields) === null || _d === void 0 ? void 0 : _d.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }
    // foundation_ids로 추가 조회 수행
    const foundationDetailsPromises = foundationIds.map((foundationId) => __awaiter(void 0, void 0, void 0, function* () {
        const foundationData = yield (0, object_1.getObject)(foundationId);
        return foundationData;
    }));
    // 모든 foundation 상세 데이터를 비동기로 조회
    const foundationDetails = yield Promise.all(foundationDetailsPromises);
    // 각 foundation의 bounty_table_keys를 사용해 추가 조회
    const bountyDetailsPromises = foundationDetails.map((foundationDetail) => __awaiter(void 0, void 0, void 0, function* () {
        var _e, _f;
        const bountyTableKeys = (_f = (_e = foundationDetail.content) === null || _e === void 0 ? void 0 : _e.fields) === null || _f === void 0 ? void 0 : _f.bounty_table_keys;
        if (!bountyTableKeys || !Array.isArray(bountyTableKeys) || bountyTableKeys.length === 0) {
            return null;
        }
        // bounty_table_keys로 추가 조회 수행
        const bountyDetails = yield Promise.all(bountyTableKeys.map((bountyKey) => __awaiter(void 0, void 0, void 0, function* () {
            const bountyData = yield (0, object_1.getObject)(bountyKey);
            return bountyData;
        })));
        return bountyDetails;
    }));
    // 모든 bounty 데이터 비동기로 조회
    const bountyDetails = yield Promise.all(bountyDetailsPromises);
    // 원래 결과, foundationDetails, 그리고 bountyDetails를 추가하여 반환
    res.json({
        bountyDetails
    });
})));
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
