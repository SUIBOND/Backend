// apis.ts
import express, { Request, Response, NextFunction } from 'express';
import { getObject, getOwnedObjects } from './object'; // getOwnedObjects import
import cors from 'cors';


import config from './config';
import { parseBounty, parseDeveloperCap, parseFoundationCap, parseFoundationData } from './parse';

const app = express();
const port = 3000;
const packageId = config.package_id;

app.use(cors({
    origin: ['https://suibond.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));



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
        // Retrieve FoundationCap and DeveloperCap objects respectively
        const foundationCapObjects = await getOwnedObjects(walletAddress, "foundation_cap", "FoundationCap");
        const developerCapObjects = await getOwnedObjects(walletAddress, "developer_cap", "DeveloperCap");

        let result: any = null;

        if (foundationCapObjects.length > 0) {
            const foundationCapData = await getObject(foundationCapObjects[0].data.objectId);
            const foundationCap = parseFoundationCap(foundationCapData);
            console.log(foundationCap);
            result = { foundationCap };
        }

        if (developerCapObjects.length > 0) {
            const developerCapData = await getObject(developerCapObjects[0].data.objectId);
            const developerCap = parseDeveloperCap(developerCapData);
            console.log(developerCap);
            result = { ...result, developerCap };
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
// Endpoint to retrieve the list of all foundations owned by the platformId
app.get('/foundations', asyncHandler(async (req: Request, res: Response) => {
    const platformId = config.platform_obj_id;

    if (!platformId) {
        return res.status(400).send("Platform Object ID is required");
    }

    // 1. Retrieve object using platformId
    const result = await getObject(platformId);
    if (!result) {
        return res.status(404).send("Object not found");
    }

    // 2. Extract foundation_ids from the object
    const foundationIds = result.content?.fields?.foundation_ids;
    if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the object");
    }

    // 3. Retrieve and parse objects for each foundationId
    const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
        const foundationData = await getObject(foundationId); // Retrieve foundation data
        return parseFoundationData(foundationData); // Parse the retrieved data
    });

    // 4. Return the result after parsing all foundation data
    const foundation = await Promise.all(foundationDetailsPromises);

    res.json({ foundation }); // Return parsed data in the response
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
// Endpoint to retrieve detailed bounty information owned by a foundationId
app.get('/bounties/:foundationId', asyncHandler(async (req: Request, res: Response) => {
    const { foundationId } = req.params;

    if (!foundationId) {
        return res.status(400).send("Foundation ID is required");
    }

    const foundationResult = await getObject(foundationId);
    if (!foundationResult) {
        return res.status(404).send("Foundation not found");
    }

    const foundation = parseFoundationData(foundationResult);
    const bountyDetailsPromises = foundation.bounty_table_keys.map(async (bountyKey: string) => await getObject(bountyKey));
    const bountyDetails = await Promise.all(bountyDetailsPromises);

    const parsedBountyDetails = bountyDetails.map(bountyDetail =>
        parseBounty(bountyDetail.content.fields, bountyDetail.content.fields.id)
    );

    res.json({
        foundationDetails: foundation,
        bountyDetails: parsedBountyDetails
    });
}));

app.get('/bountiesss', asyncHandler(async (req: Request, res: Response) => {
    // config에서 platform_obj_id를 가져옵니다.
    const platformId = config.platform_obj_id;  // 이제 platformId는 config에서 가져옵니다.

    try {
        // 1. platformId로 object를 가져옵니다.
        const result = await getObject(platformId);  // config에서 가져온 platformId 사용
        if (!result) {
            return res.status(404).send("Object not found");
        }

        // 2. object에서 foundation_ids를 추출합니다.
        const foundationIds = result.content?.fields?.foundation_ids;
        if (!foundationIds || !Array.isArray(foundationIds) || foundationIds.length === 0) {
            return res.status(404).send("No foundation IDs found in the object");
        }

        // 3. 각 foundationId에 대해 object를 가져오고, 해당 foundation의 bounty 데이터를 추출합니다.
        const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
            const foundationData = await getObject(foundationId);  // foundationId로 foundation data를 가져옵니다.
            if (!foundationData) {
                return null;
            }
            const foundation = parseFoundationData(foundationData);  // foundation data를 파싱합니다.
            return foundation;  // 파싱된 foundation 데이터를 반환합니다.
        });

        // 4. 모든 foundation 데이터를 가져와서, 해당 foundation의 bounty 데이터도 함께 가져옵니다.
        const foundationDetails = await Promise.all(foundationDetailsPromises);

        // 각 foundation에 대한 bounty 정보도 함께 가져옵니다.
        const bountyDetailsPromises = foundationDetails.flatMap(foundation => {
            if (!foundation || !foundation.bounty_table_keys) return [];
            return foundation.bounty_table_keys.map(async (bountyKey: string) => {
                const bountyData = await getObject(bountyKey);  // bountyKey로 bounty data를 가져옵니다.
                return bountyData ? parseBounty(bountyData.content.fields, bountyData.content.fields.id) : null;
            });
        });

        // 5. 모든 bounty 데이터를 가져옵니다.
        const bountyDetails = await Promise.all(bountyDetailsPromises);

        // 6. 결과를 반환합니다.
        res.json({
            foundationDetails: foundationDetails.filter(f => f !== null),
            bountyDetails: bountyDetails.filter(b => b !== null)
        });
    } catch (error: any) {
        console.error("Error fetching bounty details:", error);
        res.status(500).json({ error: "Failed to retrieve bounty details" });
    }
}));



app.get('/dev/proposals/:walletAddress', asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress } = req.params;

    if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
    }

    try {
        // Retrieve DeveloperCap object from walletAddress
        const developerCapObjects = await getOwnedObjects(walletAddress, "developer_cap", "DeveloperCap");

        // Return 404 error if no DeveloperCap objects are found
        if (developerCapObjects.length === 0) {
            return res.status(404).json({ error: "No DeveloperCap found" });
        }

        // Retrieve detailed data using the ObjectId of the first DeveloperCap object
        const developerCapData = await getObject(developerCapObjects[0].data.objectId);

        // Parse and return DeveloperCap data
        const developerCap = parseDeveloperCap(developerCapData);

        // Return DeveloperCap information
        res.json({ developerCap });
    } catch (error) {
        console.error("Error fetching DeveloperCap details:", error);
        res.status(500).json({ error: "Failed to retrieve DeveloperCap details" });
    }
}));


app.get('/bounties', asyncHandler(async (req: Request, res: Response) => {
    try {
        const platformId = config.platform_obj_id;
        const platformObject = await getObject(platformId);

        if (!platformObject) {
            return res.status(404).json({ message: 'Platform object not found' });
        }

        const foundationIds = platformObject.content?.fields?.foundation_ids || [];
        const foundationDetailsPromises = foundationIds.map((foundationId: string) => getObject(foundationId));
        const foundationDetails = await Promise.all(foundationDetailsPromises);

        const bountyTableDetailsPromises = foundationDetails.flatMap((foundation: any) => {
            return foundation?.content?.fields?.bounty_table_keys?.map((bountyKey: string) => getObject(bountyKey)) || [];
        });

        const bountyTableDetails = await Promise.all(bountyTableDetailsPromises);

        // 파싱된 결과 필드만 반환
        const parsedBountyDetails = bountyTableDetails.map((bounty: any) => {
            const fields = bounty.content.fields;
            return {
                objectId: bounty.objectId,
                name: fields.name,
                bounty_type: fields.bounty_type,
                foundation: fields.foundation,
                min_amount: fields.min_amount,
                max_amount: fields.max_amount,
                risk_percent: fields.risk_percent,
                proposals: {
                    completed: fields.proposals.fields.completed_proposal_ids,
                    processing: fields.proposals.fields.processing_proposal_ids,
                    unconfirmed: fields.proposals.fields.unconfirmed_proposal_ids
                }
            };
        });

        res.json({
            bounties: parsedBountyDetails.filter(b => b !== null)
        });

    } catch (error) {
        console.error("Error fetching bounty details: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));


app.get('/bounties-full', asyncHandler(async (req: Request, res: Response) => {
    try {
        const platformId = config.platform_obj_id;
        const platformObject = await getObject(platformId);

        if (!platformObject) {
            return res.status(404).json({ message: 'Platform object not found' });
        }

        const foundationIds = platformObject.content?.fields?.foundation_ids || [];
        const foundationDetailsPromises = foundationIds.map((foundationId: string) => getObject(foundationId));
        const foundationDetails = await Promise.all(foundationDetailsPromises);

        // 각 foundation의 bounty_table_keys를 가져와 모든 bounty 객체를 포함하도록 설정
        const bountyTableDetailsPromises = foundationDetails.flatMap((foundation: any) => {
            return foundation?.content?.fields?.bounty_table_keys?.map((bountyKey: string) => getObject(bountyKey)) || [];
        });

        const bountyTableDetails = await Promise.all(bountyTableDetailsPromises);

        // 모든 필드를 반환
        const fullBountyDetails = bountyTableDetails.map((bounty: any) => ({
            objectId: bounty.objectId,
            ...bounty.content.fields // 모든 필드 포함
        }));

        res.status(200).json({
            foundations: foundationDetails.map((foundation: any) => ({
                objectId: foundation.objectId,
                ...foundation.content.fields, // 모든 필드 포함
                bounties: fullBountyDetails
            }))
        });

    } catch (error) {
        console.error("Error fetching full bounty details: ", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));




// submit milestone

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
