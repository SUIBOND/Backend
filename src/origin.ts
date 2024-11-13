import express, { Request, Response, NextFunction } from 'express';
import { getObject } from './object';

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
// foundationID 파라미터 전달 시 foundation과 bounty 상세 정보를 가져오는 새로운 엔드포인트
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
