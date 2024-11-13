import express, { Request, Response, NextFunction } from 'express';
import { getObject } from './object';

const app = express();
const port = 3000;

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

const getDetails = async (objectId: string) => { };
const getStats = async (objectId: string) => { };
const getSummary = async (objectId: string) => { };
const getDevInfo = async (objectId: string) => { };


// Foundation 핸들러
const foundationHandler = asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.query;
    const { subPath } = req.params;

    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }

    let result;

    // subPath에 따라 다른 로직 처리
    switch (subPath) {
        case 'details':
            result = await getDetails(objectId as string);
            break;
        case 'stats':
            result = await getStats(objectId as string);
            break;
        case 'summary':
            result = await getSummary(objectId as string);
            break;
        default:
            return res.status(404).send("Invalid subPath");
    }

    // if (!result) {
    //     return res.status(404).send("Object not found");
    // }

    res.json(result);
});

// Developer 핸들러
const developerHandler = asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.query;
    const { subPath } = req.params;

    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }

    let result;

    // subPath에 따라 다른 로직 처리
    switch (subPath) {
        case 'info':
            result = await getDevInfo(objectId as string);
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
});

// Foundation 경로 처리
app.get('/foundation/:subPath', foundationHandler);

// Developer 경로 처리
app.get('/developer/:subPath', developerHandler);

app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
