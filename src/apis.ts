// apis.ts
import express, { Request, Response, NextFunction } from 'express';
import { getObject, getOwnedObjects } from './object'; // getOwnedObjects import
import axios from 'axios';

const app = express();
const port = 3000;
const packageId = '0x7e86551436c07a7c548ab2ebc4007284d8bfca9b2f4e9445a9738f0d664d1f4a'; // Platform ID variable

app.use(express.json()); // Parse JSON request body

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

// Refactored endpoint to check for FoundationCap or DeveloperCap, using a wallet address as a path parameter
app.get('/validation/:walletAddress', asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.params.walletAddress;

    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }

    try {
        // Use getOwnedObjects function from object.ts
        const ownedObjects = await getOwnedObjects(walletAddress);
        console.log("Owned objects response:", ownedObjects);

        // Construct the type strings dynamically using packageId
        const foundationCapType = `${packageId}::foundation_cap::FoundationCap`;
        const developerCapType = `${packageId}::developer_cap::DeveloperCap`;

        console.log(`Looking for FoundationCap type: ${foundationCapType}`);
        console.log(`Looking for DeveloperCap type: ${developerCapType}`);

        // Find FoundationCap and DeveloperCap objects
        const foundationCap = ownedObjects.find((obj: any) =>
            obj.data?.type === foundationCapType
        );

        const developerCap = ownedObjects.find((obj: any) =>
            obj.data?.type === developerCapType
        );

        let result: any = null;

        if (foundationCap) {
            // Retrieve detailed FoundationCap object data using getObject function
            const foundationCapObjectId = foundationCap.data.objectId;
            const foundationCapDetails = await getObject(foundationCapObjectId);
            console.log("FoundationCap details:", foundationCapDetails); // 로그 추가
            result = { type: "FoundationCap", details: foundationCapDetails };
        }
        if (developerCap) { // Separate if to allow both caps to be processed
            // Retrieve detailed DeveloperCap object data using getObject function
            const developerCapObjectId = developerCap.data.objectId;
            const developerCapDetails = await getObject(developerCapObjectId);
            console.log("DeveloperCap details:", developerCapDetails); // 로그 추가
            if (result) {
                // If both caps are present, add DeveloperCap details
                result.message = "Both FoundationCap and DeveloperCap are owned.";
                result.developerCapDetails = developerCapDetails;
            } else {
                // If only DeveloperCap is present
                result = { type: "DeveloperCap", details: developerCapDetails };
            }
        }

        if (!result) {
            res.status(404).json({ error: "No DeveloperCap or FoundationCap found" });
        } else {
            res.json(result);
        }
    } catch (error: any) {
        console.error("Error fetching owned objects:", error);
        res.status(500).json({ error: "Failed to retrieve owned objects" });
    }
}));

// Refactored endpoint to retrieve detailed foundation information
// platformId가 소유하고 있는 전체 foundation의 목록을 가져오는 endpoint
app.get('/foundations/:platformId', asyncHandler(async (req: Request, res: Response) => {
    const { platformId } = req.params;

    if (!platformId) {
        return res.status(400).send("Platform Object ID is required");
    }

    const result = await getObject(platformId);
    if (!result) {
        return res.status(404).send("Object not found");
    }

    const foundationIds = result.content?.fields?.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }

    const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => await getObject(foundationId));
    const foundationDetails = await Promise.all(foundationDetailsPromises);

    res.json({ foundationDetails });
}));

// Utility to filter specified fields from an object
const filterFields = (obj: any, fieldsToRemove: string[]): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const filteredObj: Record<string, any> = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (fieldsToRemove.includes(key)) continue;
        filteredObj[key] = filterFields(obj[key], fieldsToRemove);
    }
    return filteredObj;
};

// Function to retrieve and filter foundation and bounty details
// foundationId가 소유하고 있는 bounty의 상세 정보를 가져오는 endpoint
app.get('/foundations/bounties/:foundationId', asyncHandler(async (req: Request, res: Response) => {
    const { foundationId } = req.params;

    if (!foundationId) {
        return res.status(400).send("Foundation ID is required");
    }

    const foundationResult = await getObject(foundationId);
    if (!foundationResult) {
        return res.status(404).send("Foundation not found");
    }

    const { bounty_table, bounty_table_keys, ...otherFields } = foundationResult.content.fields;
    const filteredFoundationDetails = {
        ...foundationResult,
        content: {
            ...foundationResult.content,
            fields: otherFields
        }
    };

    const bountyDetailsPromises = (bounty_table_keys || []).map(async (bountyKey: string) => await getObject(bountyKey));
    const bountyDetails = await Promise.all(bountyDetailsPromises);

    const filteredBountyDetails = bountyDetails.map(bountyDetail =>
        filterFields(bountyDetail, ["digest", "version", "dataType", "hasPublicTransfer"])
    );

    res.json({
        foundationDetails: filteredFoundationDetails,
        bountyDetails: filteredBountyDetails
    });
}));

// New endpoint to retrieve DeveloperCap details by developerCapId
// 해당 developerCapId가 소유한 proposals 데이터를 얻을 수 있음
app.get('/developer/proposals/:developerCapId', asyncHandler(async (req: Request, res: Response) => {
    const { developerCapId } = req.params;

    if (!developerCapId) {
        return res.status(400).json({ error: "DeveloperCap ID is required" });
    }

    try {
        const developerCapDetails = await getObject(developerCapId);
        if (!developerCapDetails) {
            return res.status(404).json({ error: "DeveloperCap not found" });
        }

        res.json({ developerCapDetails });
    } catch (error) {
        console.error("Error fetching DeveloperCap details:", error);
        res.status(500).json({ error: "Failed to retrieve DeveloperCap details" });
    }
}));

// app.get('/object/:platformId', asyncHandler(async (req: Request, res: Response) => {
//     const { platformId } = req.params;

//     if (!platformId) {
//         return res.status(400).json({ error: "Platform ID is required" });
//     }

//     try {
//         // Retrieve the main object details using platformId
//         const objectDetails = await getObject(platformId);

//         if (!objectDetails) {
//             return res.status(404).json({ error: "Object not found" });
//         }

//         // Extract foundation_ids and bounty_table_keys from the object details
//         const foundationIds = objectDetails.content?.fields?.foundation_ids;
//         const foundationDetails: any[] = [];

//         if (foundationIds && Array.isArray(foundationIds) && foundationIds.length > 0) {
//             // Fetch details of each foundation_id using getObject
//             const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
//                 const foundationDetail = await getObject(foundationId);
//                 if (foundationDetail && foundationDetail.content?.fields?.bounty_table_keys) {
//                     // Fetch details of each bounty_table_key within the foundation
//                     const bountyTableKeys = foundationDetail.content.fields.bounty_table_keys;
//                     const bountyDetailsPromises = bountyTableKeys.map(async (bountyKey: string) => {
//                         // Fetch the object details for each bounty_key
//                         return await getObject(bountyKey);
//                     });
//                     const bountyDetails = await Promise.all(bountyDetailsPromises);
//                     foundationDetail.content.fields.bounty_details = bountyDetails;
//                 }
//                 return foundationDetail;
//             });
//             foundationDetails.push(...await Promise.all(foundationDetailsPromises));
//         }

//         // Add foundation details to the response
//         objectDetails.content.fields.foundation_details = foundationDetails;

//         // Fetch and add all bounty table keys object details into response
//         if (foundationDetails.length > 0) {
//             const allBountyDetails = foundationDetails.flatMap((foundationDetail: any) =>
//                 foundationDetail.content?.fields?.bounty_details || []
//             );

//             // Fetch object details for all bounty keys
//             const allBountyDetailsPromises = allBountyDetails.map(async (bountyDetail: any) => {
//                 return await getObject(bountyDetail.objectId);
//             });
//             const allBountyDetailsFetched = await Promise.all(allBountyDetailsPromises);

//             // Append these objects to the response
//             objectDetails.content.fields.all_bounty_details = allBountyDetailsFetched;
//         }

//         // Return the object details including all bounty table objects
//         res.json({ objectDetails });
//     } catch (error) {
//         console.error("Error fetching object details:", error);
//         res.status(500).json({ error: "Failed to retrieve object details" });
//     }
// }));



app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
