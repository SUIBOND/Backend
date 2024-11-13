import express, { Request, Response, NextFunction } from 'express';
import { getObject } from './object';
import axios from 'axios';


const app = express();
const port = 4000;

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };


// Store the connected wallet address (this can be changed to store in DB or session)
let connectedWalletAddress: string | null = null;

// Endpoint to set the connected wallet address
app.post('/set-connected-wallet-address', asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).send("Wallet address is required");
    }

    // Store the wallet address
    connectedWalletAddress = walletAddress;

    console.log(`Connected wallet address: ${connectedWalletAddress}`);
    res.status(200).send({ message: "Wallet address set successfully" });
}));

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

// Existing /get-object/:objectId endpoint
app.get('/get-object/:objectId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    if (!objectId) {
        return res.status(400).send("Object ID is required");
    }

    // Use the connected wallet address here if needed
    if (connectedWalletAddress) {
        console.log(`Using connected wallet address: ${connectedWalletAddress}`);
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
app.get('/get-bounty-details/:objectId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    if (!objectId) {
        return res.status(400).send("Object ID is required");
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
    const filteredObj: Record<string, any> = Array.isArray(obj) ? [] : {}; // 객체 타입을 명시적으로 지정
    for (const key in obj) {
        if (fieldsToRemove.includes(key)) continue;
        filteredObj[key] = filterFields(obj[key], fieldsToRemove);
    }
    return filteredObj;
};

// digest, version, dataType, hasPublicTransfer 있는 버전
// foundationID 파라미터 전달 시 foundation과 bounty 상세 정보를 가져오는 엔드포인트
app.get('/get-foundation-bounty-details/:foundationId', asyncHandler(async (req: Request, res: Response) => {
    const { foundationId } = req.params;

    if (!foundationId) {
        return res.status(400).send("Foundation ID is required");
    }

    // Foundation 객체에서 데이터 가져오기
    const foundationResult = await getObject(foundationId);

    if (!foundationResult) {
        return res.status(404).send("Foundation not found");
    }

    // foundationDetails에서 bounty_table과 bounty_table_keys 제거
    const { bounty_table, bounty_table_keys, ...otherFields } = foundationResult.content.fields;
    const filteredFoundationDetails = {
        ...foundationResult,
        content: {
            ...foundationResult.content,
            fields: otherFields
        }
    };

    // bounty_table_keys의 각 키를 사용하여 bountyDetails 가져오기
    const bountyDetailsPromises = (bounty_table_keys || []).map(async (bountyKey: string) => {
        return await getObject(bountyKey);
    });

    const bountyDetails = await Promise.all(bountyDetailsPromises);

    // bountyDetails를 foundationDetails 내부에 포함
    const finalResult = {
        foundationDetails: {
            ...filteredFoundationDetails,
            content: {
                ...filteredFoundationDetails.content,
                fields: {
                    ...filteredFoundationDetails.content.fields,
                    bountyDetails: bountyDetails.filter(Boolean) // null 값을 제외하고 반환
                }
            }
        }
    };

    // digest, version, dataType, hasPublicTransfer 필드를 제거
    const fieldsToRemove = ['digest', 'version', 'dataType', 'hasPublicTransfer'];
    const filteredResult = filterFields(finalResult, fieldsToRemove);

    res.json(filteredResult);
}));

// digest, version, dataType, hasPublicTransfer 있는 버전
// // foundationId로 foundation과 bounty 상세 정보를 얻는 새로운 엔드포인트
// app.get('/get-foundation-bounty-details/:foundationId', asyncHandler(async (req: Request, res: Response) => {
//     const { foundationId } = req.params;

//     if (!foundationId) {
//         return res.status(400).send("Foundation ID is required");
//     }

//     // Foundation 객체에서 데이터 가져오기
//     const foundationResult = await getObject(foundationId);

//     if (!foundationResult) {
//         return res.status(404).send("Foundation not found");
//     }

//     // foundationDetails에서 bounty_table과 bounty_table_keys를 제거
//     const { bounty_table, bounty_table_keys, ...otherFields } = foundationResult.content.fields;
//     const filteredFoundationDetails = {
//         ...foundationResult,
//         content: {
//             ...foundationResult.content,
//             fields: otherFields
//         }
//     };

//     // bounty_table_keys의 각 키를 사용하여 bountyDetails 가져오기
//     const bountyDetailsPromises = (bounty_table_keys || []).map(async (bountyKey: string) => {
//         return await getObject(bountyKey);
//     });

//     const bountyDetails = await Promise.all(bountyDetailsPromises);

//     // bountyDetails를 foundationDetails 내부에 포함
//     const finalResult = {
//         foundationDetails: {
//             ...filteredFoundationDetails,
//             content: {
//                 ...filteredFoundationDetails.content,
//                 fields: {
//                     ...filteredFoundationDetails.content.fields,
//                     bountyDetails: bountyDetails.filter(Boolean) // null 값을 제외하고 반환
//                 }
//             }
//         }
//     };

//     res.json(finalResult);
// }));

// New endpoint to get all bounty details based on platform ID
app.get('/get-all-bounties/:platformId', asyncHandler(async (req: Request, res: Response) => {
    const { platformId } = req.params;

    if (!platformId) {
        return res.status(400).send("Platform ID is required");
    }

    // Step 1: Get platform details to retrieve foundation_ids
    const platformResult = await getObject(platformId);

    if (!platformResult) {
        return res.status(404).send("Platform not found");
    }

    const foundationIds = platformResult.content?.fields?.foundation_ids;

    if (!foundationIds || foundationIds.length === 0) {
        return res.status(404).send("No foundation IDs found in the platform object");
    }

    // Step 2: For each foundation ID, fetch the bounty table keys
    const foundationDetailsPromises = foundationIds.map(async (foundationId: string) => {
        const foundationResult = await getObject(foundationId);
        if (foundationResult) {
            return foundationResult.content?.fields?.bounty_table_keys || [];
        }
        return [];
    });

    const allBountyTableKeys = await Promise.all(foundationDetailsPromises);

    // Flatten all bounty table keys into a single array
    const bountyTableKeys = allBountyTableKeys.flat();

    if (bountyTableKeys.length === 0) {
        return res.status(404).send("No bounty table keys found in the foundation objects");
    }

    // Step 3: For each bounty table key, fetch the bounty details
    const bountyDetailsPromises = bountyTableKeys.map(async (bountyKey: string) => {
        const bountyResult = await getObject(bountyKey);
        return bountyResult || null;
    });

    const bountyDetails = await Promise.all(bountyDetailsPromises);

    // Filter out any null values (if any)
    const validBountyDetails = bountyDetails.filter(Boolean);

    if (validBountyDetails.length === 0) {
        return res.status(404).send("No valid bounty details found");
    }

    // Return all the valid bounty details
    res.json({ bountyDetails: validBountyDetails });
}));

// New endpoint to retrieve completed bounty details
app.get('/get-completed-bounty-details/:objectId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    const result = await getObject(objectId);
    const completedIds = result.content?.fields?.completed || [];

    const completedDetails = await Promise.all(
        completedIds.map(async (completedId: string) => {
            const data = await getObject(completedId);
            return data;
        })
    );

    res.json({ completedDetails });
}));

// New endpoint to retrieve processing bounty details
app.get('/get-processing-bounty-details/:objectId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    const result = await getObject(objectId);
    const processingIds = result.content?.fields?.processing || [];

    const processingDetails = await Promise.all(
        processingIds.map(async (processingId: string) => {
            const data = await getObject(processingId);
            return data;
        })
    );

    res.json({ processingDetails });
}));

// New endpoint to retrieve unconfirmed proposal bounty details
app.get('/get-unconfirmed-bounty-details/:objectId', asyncHandler(async (req: Request, res: Response) => {
    const { objectId } = req.params;

    const result = await getObject(objectId);
    const unconfirmedProposalIds = result.content?.fields?.unconfirmedProposal || [];

    const unconfirmedProposalDetails = await Promise.all(
        unconfirmedProposalIds.map(async (proposalId: string) => {
            const data = await getObject(proposalId);
            return data;
        })
    );

    res.json({ unconfirmedProposalDetails });
}));

app.listen(port, () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
