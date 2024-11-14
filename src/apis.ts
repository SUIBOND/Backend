import express, { Request, Response, NextFunction } from 'express';
import { getObject } from './object';
import axios from 'axios';

const app = express();
const port = 3000;
const packageId = '0x7e86551436c07a7c548ab2ebc4007284d8bfca9b2f4e9445a9738f0d664d1f4a'; // Platform ID variable
const SUI_RPC_ENDPOINT = 'https://fullnode.testnet.sui.io:443'; // Sui RPC Endpoint (example for testnet)

// Add middleware: parse request body
app.use(express.json()); // Parse JSON request body

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

// Define an endpoint to check for FoundationCap or DeveloperCap, using a wallet address as a path parameter
app.get('/validation/:walletAddress', asyncHandler(async (req: Request, res: Response) => {
    // Retrieve the wallet address from the path parameter
    const walletAddress = req.params.walletAddress;

    // Return an error if no wallet address is provided
    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }

    try {
        // Send a request to the SUI RPC endpoint to get all owned objects for the specified wallet address
        const response = await axios.post(SUI_RPC_ENDPOINT, {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getOwnedObjects',
            params: [
                walletAddress,
                {
                    options: { showType: true }  // Request to include the object type in the response
                }
            ]
        });

        // Retrieve owned objects data or set an empty array if no data is found
        const ownedObjects = response.data.result?.data || [];
        console.log("Owned objects response:", ownedObjects);

        // Dynamically construct type strings for FoundationCap and DeveloperCap based on the package ID
        const foundationCapType = `${packageId}::foundation_cap::FoundationCap`;
        const developerCapType = `${packageId}::developer_cap::DeveloperCap`;

        // Check if any owned object matches the FoundationCap type
        const foundationCap = ownedObjects.find((obj: any) =>
            obj.data?.type === foundationCapType
        );

        // Check if any owned object matches the DeveloperCap type
        const developerCap = ownedObjects.find((obj: any) =>
            obj.data?.type === developerCapType
        );

        let result: any = null;

        // If a FoundationCap object is found, retrieve its detailed data using /get-object
        if (foundationCap) {
            const foundationCapObjectId = foundationCap.data.objectId;
            const foundationCapDetails = await getObject(foundationCapObjectId);
            result = { type: "FoundationCap", details: foundationCapDetails };
        }
        // If a DeveloperCap object is found, retrieve its detailed data using /get-object
        else if (developerCap) {
            const developerCapObjectId = developerCap.data.objectId;
            const developerCapDetails = await getObject(developerCapObjectId);
            result = { type: "DeveloperCap", details: developerCapDetails };
        }

        // If neither FoundationCap nor DeveloperCap is found, return a 404 error
        if (!result) {
            res.status(404).json({ error: "No DeveloperCap or FoundationCap found" });
        } else {
            // Return the result with the retrieved details
            res.json(result);
        }

    } catch (error: any) {
        // Log any errors and return a 500 error response if the request fails
        console.error("Error fetching owned objects:", error);
        res.status(500).json({ error: "Failed to retrieve owned objects" });
    }
}));


// Set up the `/getownedobject/:walletAddress` route
app.get('/getownedobject/:walletAddress', async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    try {
        // Configure Sui JSON-RPC request
        const response = await axios.post(SUI_RPC_ENDPOINT, {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getAllCoins',
            params: [walletAddress],
        });

        // Extract object data from RPC call result
        const objects = response.data.result.data;

        // Return response in JSON format
        res.json({ ownedObjects: objects });
    } catch (error) {
        console.error('Error fetching owned objects:', error);
        res.status(500).json({ error: 'Failed to retrieve owned objects' });
    }
});

// Existing /get-object/:objectId endpoint
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
// platformObjId 입력 시 모든 foundation 출력 / bounty_table, bounty_table_keys, foundation_name, foundation_cap, owner 확인 가능
app.get('/get-all-foundation-details/:platformId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    if (!objectId) {
        return res.status(400).send("Platform Object ID is required");
    }

    const result = await getObject(objectId);

    if (!result) {
        return res.status(404).send("Object not found");
    }

    const foundationIds = result.content?.fields?.foundation_ids;

    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }

    const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
        const foundationData = await getObject(foundationId);
        return foundationData;
    });

    const foundationDetails = await Promise.all(foundationDetailsPromises);

    res.json({
        foundationDetails
    });
}));

// Retrieve detailed bounty information
// platformObjId 입력 시 모든 bounty 출력 / bounty_type, foundation(bounty_owner), fund_balance, max_amount, min_amount, foundation_name, proposals(completed, processing, unconfirmed) 확인 가능
app.get('/get-bounty-details/:platformId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    if (!objectId) {
        return res.status(400).send("Platform Object ID is required");
    }

    const result = await getObject(objectId);

    if (!result) {
        return res.status(404).send("Object not found");
    }

    const foundationIds = result.content?.fields?.foundation_ids;

    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }

    const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
        const foundationData = await getObject(foundationId);
        return foundationData;
    });

    const foundationDetails = await Promise.all(foundationDetailsPromises);

    const bountyDetailsPromises = foundationDetails.map(async (foundationDetail: any) => {
        const bountyTableKeys = foundationDetail.content?.fields?.bounty_table_keys;

        if (!bountyTableKeys || !Array.isArray(bountyTableKeys) || bountyTableKeys.length === 0) {
            return null;
        }

        const bountyDetails = await Promise.all(bountyTableKeys.map(async (bountyKey: string) => {
            const bountyData = await getObject(bountyKey);
            return bountyData;
        }));

        return bountyDetails;
    });

    const bountyDetails = await Promise.all(bountyDetailsPromises);

    res.json({
        bountyDetails
    });
}));

const filterFields = (obj: any, fieldsToRemove: string[]): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const filteredObj: Record<string, any> = Array.isArray(obj) ? [] : {}; // Explicitly define object type
    for (const key in obj) {
        if (fieldsToRemove.includes(key)) continue;
        filteredObj[key] = filterFields(obj[key], fieldsToRemove);
    }
    return filteredObj;
};

// Version without digest, version, dataType, hasPublicTransfer
// Endpoint to get foundation and bounty details when foundationID is provided
app.get('/get-foundation-bounty-details/:foundationId', asyncHandler(async (req: Request, res: Response) => {
    const { foundationId } = req.params;

    if (!foundationId) {
        return res.status(400).send("Foundation ID is required");
    }

    // Get data from Foundation object
    const foundationResult = await getObject(foundationId);

    if (!foundationResult) {
        return res.status(404).send("Foundation not found");
    }

    // Remove bounty_table and bounty_table_keys from foundationDetails
    const { bounty_table, bounty_table_keys, ...otherFields } = foundationResult.content.fields;
    const filteredFoundationDetails = {
        ...foundationResult,
        content: {
            ...foundationResult.content,
            fields: otherFields
        }
    };

    // Retrieve bountyDetails using each key in bounty_table_keys
    const bountyDetailsPromises = (bounty_table_keys || []).map(async (bountyKey: string) => {
        return await getObject(bountyKey);
    });

    const bountyDetails = await Promise.all(bountyDetailsPromises);

    const filteredBountyDetails = bountyDetails.map(bountyDetail =>
        filterFields(bountyDetail, ["digest", "version", "dataType", "hasPublicTransfer"])
    );

    res.json({
        foundationDetails: filteredFoundationDetails,
        bountyDetails: filteredBountyDetails
    });
}));

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
