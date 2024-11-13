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
const port = 3000;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
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
// Foundation 전체 데이터 가져오기
app.get('/foundation/', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
// Developer 전체 데이터 가져오기
app.get('/developer/', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
