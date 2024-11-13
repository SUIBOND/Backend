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
const app = (0, express_1.default)();
const port = 3000;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
const getDetails = (objectId) => __awaiter(void 0, void 0, void 0, function* () { });
const getStats = (objectId) => __awaiter(void 0, void 0, void 0, function* () { });
const getSummary = (objectId) => __awaiter(void 0, void 0, void 0, function* () { });
const getDevInfo = (objectId) => __awaiter(void 0, void 0, void 0, function* () { });
// Foundation 핸들러
const foundationHandler = asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { objectId } = req.query;
    const { subPath } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    let result;
    // subPath에 따라 다른 로직 처리
    switch (subPath) {
        case 'details':
            result = yield getDetails(objectId);
            break;
        case 'stats':
            result = yield getStats(objectId);
            break;
        case 'summary':
            result = yield getSummary(objectId);
            break;
        default:
            return res.status(404).send("Invalid subPath");
    }
    // if (!result) {
    //     return res.status(404).send("Object not found");
    // }
    res.json(result);
}));
// Developer 핸들러
const developerHandler = asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { objectId } = req.query;
    const { subPath } = req.params;
    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }
    let result;
    // subPath에 따라 다른 로직 처리
    switch (subPath) {
        case 'info':
            result = yield getDevInfo(objectId);
            break;
        // case 'stats':
        //     result = await getDevStats(objectId as string);
        //     break;
        // case 'projects':
        //     result = await getDevProjects(objectId as string);
        //     break;
        default:
            return res.status(404).send("Invalid subPath");
    }
    // if (!result) {
    //     return res.status(404).send("Object not found");
    // }
    res.json(result);
}));
// Foundation 경로 처리
app.get('/foundation/:subPath', foundationHandler);
// Developer 경로 처리
app.get('/developer/:subPath', developerHandler);
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
