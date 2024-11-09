import express, { Request, Response, NextFunction } from 'express';
import { getObject } from './object';

const app = express();
const port = 3000;

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

app.get('/get-object/:objectId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }

    const result = await getObject(objectId);

    if (!result) {
        return res.status(404).send("Object not found");
    }

    res.json(result);
}));

app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});