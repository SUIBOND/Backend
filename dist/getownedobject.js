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
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
const port = 3000;
// Async wrapper to handle errors, returning Promise<void> for compatibility
const asyncHandler = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
};
app.get('/example/getownedobject', asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const walletAddress = req.query.address;
    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }
    try {
        const response = yield axios_1.default.post('https://fullnode.testnet.sui.io:443', {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getOwnedObjects',
            params: [
                walletAddress,
                {
                    filter: {
                        MatchAll: [
                            { StructType: "0x2::coin::Coin<0x2::sui::SUI>" }
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
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
