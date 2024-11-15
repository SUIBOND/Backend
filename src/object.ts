import {
    SuiClient,
    GetObjectParams,
    MultiGetObjectsParams,
} from "@mysten/sui/client";
import axios from 'axios';
import config from "./config";
import { parseObjectData } from "./parse";
import { ObjectData } from "./types";

export const client = new SuiClient({ url: config.testnet_endpoint });

export const getObjectData = async (objectId: string): Promise<ObjectData | undefined> => {
    if (!objectId) {
        return;
    }

    try {
        const input: GetObjectParams = {
            id: objectId,
            options: {
                showContent: true,
            }
        };
        const res = await client.getObject(input);

        return parseObjectData(res.data);
    } catch (e) {
        console.log("getObject failed: ", e, "objectId: ", objectId);
    }
};

export const getMultipleObjectsData = async (objectIds: string[]): Promise<ObjectData[] | undefined> => {
    try {
        const input: MultiGetObjectsParams = {
            ids: objectIds,
        };
        const res = await client.multiGetObjects(input);
        return res.map((res) => parseObjectData(res.data));
    } catch (e) {
        console.error("batchGetObjects failed", e);
    }
};

// New getOwnedObjects function
export const getOwnedObjects = async (walletAddress: string, module: string, type: string ): Promise<any> => {
    try {
        const response = await axios.post(config.testnet_endpoint, {
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getOwnedObjects',
            params: [
                walletAddress,
                {
                    "filter": {
                        "MatchAll": [
                        {
                            "StructType": `${config.package_id}::${module}::${type}`
                        },
                        ]
                    },
                    options: { showType: true },
                }
            ]
        });
        return response.data.result?.data || [];
    } catch (error) {
        console.error("getOwnedObjects failed:", error);
    }
};
