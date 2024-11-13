import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const app = express();
const port = 3000;

// Async wrapper to handle errors, returning Promise<void> for compatibility
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };

app.get('/example/getownedobject', asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.query.address as string;
    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }

    try {
        const response = await axios.post('https://fullnode.testnet.sui.io:443', {
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
    } catch (error: any) {
        res.status(500).json({ error: 'Error fetching owned objects', details: error.message });
    }
}));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
