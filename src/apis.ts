// apis.ts
import express, { Request, Response, NextFunction } from 'express';
import { getObject, getOwnedObjects } from './object'; // getOwnedObjects import

import config from './config';

const app = express();
const port = 3000;
const packageId = config.package_id;


app.use(express.json()); // Parse JSON request body

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

app.get('/identification/:walletAddress', asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.params.walletAddress;

    if (!walletAddress) {
        res.status(400).json({ error: "Wallet address is required" });
        return;
    }

    try {
        const foundationCapObjects = await getOwnedObjects(walletAddress, "foundation_cap", "FoundationCap");
        const developerCapObjects = await getOwnedObjects(walletAddress, "developer_cap", "DeveloperCap");


        let result: any = null;

        if (foundationCapObjects.length > 0) {
            const foundationCap = await getObject(foundationCapObjects[0].data.objectId);
            console.log(foundationCap)
            result = {foundationCap}
        } else if (developerCapObjects.length > 0) { // Separate if to allow both caps to be processed
            const developerCap = await getObject(developerCapObjects[0].data.objectId);
            console.log(developerCap)
            result = {developerCap}
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

    // 1. platformId로 객체 가져오기
    const result = await getObject(platformId);
    if (!result) {
        return res.status(404).send("Object not found");
    }

    // 2. 해당 객체에서 foundation_ids 추출
    const foundationIds = result.content?.fields?.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }

    // 3. foundationIds 각각에 대해 객체를 가져오고 파싱
    const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
        const foundationData = await getObject(foundationId); // foundation 데이터 가져오기
        return parseFoundationData(foundationData); // 가져온 데이터를 파싱
    });

    // 4. 모든 foundation 데이터를 파싱한 후 결과 반환
    const foundation = await Promise.all(foundationDetailsPromises);

    res.json({ foundation }); // 파싱된 데이터를 응답으로 반환
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
