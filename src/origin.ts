import express, { Request, Response, NextFunction } from 'express';
import { getObject } from './object';

const app = express();
const port = 4000;

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

// Existing /get-object/:objectId endpoint (only retrieves by package ID)
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

// Existing /get-foundation-details/:objectId endpoint
app.get('/get-foundation-details/:objectId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }

    // Retrieve foundation_ids by looking up the given objectId
    const result = await getObject(objectId);

    if (!result) {
        return res.status(404).send("Object not found");
    }

    const foundationIds = result.content?.fields?.foundation_ids;

    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }

    // Perform additional queries using foundation_ids
    const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
        const foundationData = await getObject(foundationId);
        return foundationData;
    });

    // Asynchronously retrieve all foundation details
    const foundationDetails = await Promise.all(foundationDetailsPromises);

    // Return the foundation details
    res.json({
        foundationDetails
    });
}));

// Retrieve detailed bounty information
app.get('/get-bounty-details/:objectId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }

    // Retrieve foundation_ids by looking up the given objectId
    const result = await getObject(objectId);

    if (!result) {
        return res.status(404).send("Object not found");
    }

    const foundationIds = result.content?.fields?.foundation_ids;

    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }

    // Perform additional queries using foundation_ids
    const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
        const foundationData = await getObject(foundationId);
        return foundationData;
    });

    // Asynchronously retrieve all foundation details
    const foundationDetails = await Promise.all(foundationDetailsPromises);

    // Use each foundation's bounty_table_keys for additional queries
    const bountyDetailsPromises = foundationDetails.map(async (foundationDetail: any) => {
        const bountyTableKeys = foundationDetail.content?.fields?.bounty_table_keys;

        if (!bountyTableKeys || !Array.isArray(bountyTableKeys) || bountyTableKeys.length === 0) {
            return null;
        }

        // Perform additional queries using bounty_table_keys
        const bountyDetails = await Promise.all(bountyTableKeys.map(async (bountyKey: string) => {
            const bountyData = await getObject(bountyKey);
            return bountyData;
        }));

        return bountyDetails;
    });

    // Asynchronously retrieve all bounty data
    const bountyDetails = await Promise.all(bountyDetailsPromises);

    // Return the bounty details
    res.json({
        bountyDetails
    });
}));

app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
