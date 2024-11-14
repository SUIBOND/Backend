import express, { Request, Response, NextFunction } from 'express';
import { getObject } from './object';
import axios from 'axios';



const app = express();
const port = 4000;
const platformId = '0x75aa898bf3a52a8cba6e885a950a1a2a02a5ff9c4d3dba94c03084efcc201986'; // 플랫폼 ID 변수화

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

// 미들웨어 추가: 요청 본문 파싱
app.use(express.json()); // 요청 본문이 JSON인 경우 파싱해줍니다.

app.get('/identification/:wallet_address', asyncHandler(async (req: Request, res: Response) => {

    try {

    } catch (error: any) {
    }
}));



app.get('/foundation/:id', asyncHandler(async (req: Request, res: Response) => {

    try {

    } catch (error: any) {
    }
}));

app.get('/foundations', asyncHandler(async (req: Request, res: Response) => {

    try {

    } catch (error: any) {
    }
}));

app.get('/bounty/:id', asyncHandler(async (req: Request, res: Response) => {

    try {

    } catch (error: any) {
    }
}));

app.get('/bounties', asyncHandler(async (req: Request, res: Response) => {

    try {

    } catch (error: any) {
    }
}));


app.get('/proposal/:id', asyncHandler(async (req: Request, res: Response) => {

    try {

    } catch (error: any) {
    }
}));

app.get('/proposals', asyncHandler(async (req: Request, res: Response) => {

    try {

    } catch (error: any) {
    }
}));





app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
