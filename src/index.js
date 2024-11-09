"use strict";
// src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
// 간단한 루트 라우터
app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});
// 다른 라우터 예제
app.get('/greet', (req, res) => {
    const name = req.query.name || 'Guest';
    res.send(`Hello, ${name}!`);
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
