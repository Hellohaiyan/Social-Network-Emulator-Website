import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    GetCommand,
    PutCommand
} from "@aws-sdk/lib-dynamodb";

import crypto from "crypto";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "pdsUsers";


// Helper function to convert ArrayBuffer to base64 ASCII string
function arrayBufferToBase64(buffer) 
{
    const binaryStr = String.fromCharCode.apply(null, new Uint8Array(buffer));
    var base64Str = Buffer.from(binaryStr, 'binary').toString('base64');
    return base64Str;
}

// Helper function to convert a base64 ASCII string to an ArrayBuffer
function base64ToArrayBuffer(str) {
    const binaryStr = Buffer.from(str, 'base64').toString('binary');
    const buf = new ArrayBuffer(binaryStr.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, binaryStrLen = binaryStr.length; i < binaryStrLen; i++) {
        bufView[i] = binaryStr.charCodeAt(i);
    }
    return buf;
}

export const handler = async (event, context) => {
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json",
    };

    try {
        switch (event.routeKey) {
            case "GET /users/{email}":
                body = await dynamo.send(
                    new GetCommand({
                        TableName: tableName,
                        Key: {
                            email: event.pathParameters.email,
                        },
                    })
                );
                body = body.Item;
                break;
            case "GET /users":
                body = await dynamo.send(
                    new ScanCommand({ TableName: tableName })
                );
                body = body.Items;
                break;
            case "PUT /users":
                let requestJSON = JSON.parse(event.body);
                
                // Get PDS keys from pdsKeys table
                const keyData = await dynamo.send(
                    new ScanCommand({ TableName: "pdsKeys" })
                );
                
                // Convert PDS RSA Encrypting public and ECDH private keys to CryptoKey
                const base64EncryptPublicKey = keyData.Items[0].encryptPublicKey;
                const arrayBufferEncryptPublicKey = base64ToArrayBuffer(base64EncryptPublicKey);
                const encryptPublicKey = await crypto.subtle.importKey(
                    'spki', arrayBufferEncryptPublicKey, 
                    {
                        name: "RSA-OAEP",
                        hash: "SHA-256",
                        modulusLength: 4096,
                        publicExponent: new Uint8Array([1, 0, 1])
                    },
                    false, ['wrapKey']);
                
                const base64PrivateKey = keyData.Items[0].privateKey;
                const arrayBufferPrivateKey = base64ToArrayBuffer(base64PrivateKey);
                const privateKey = await crypto.subtle.importKey('pkcs8', arrayBufferPrivateKey, {name: "ECDH", namedCurve: "P-384"}, false, ["deriveKey"]);
                
                // Convert Client ECDH public key to CryptoKey and IV to ArrayBuffer
                const base64ClientPublicKey = requestJSON.clientPublicKey;
                const arrayBufferClientPublicKey = base64ToArrayBuffer(base64ClientPublicKey);
                const clientPublicKey = await crypto.subtle.importKey('spki', arrayBufferClientPublicKey, {name: "ECDH", namedCurve: "P-384"}, false, []);

                // Create shared key, encrypt it, and convert it to base64 ASCII string
                const sharedKey = await crypto.subtle.deriveKey(
                    {
                        name: 'ECDH',
                        namedCurve: "P-384",
                        public: clientPublicKey
                    },
                    privateKey,
                    {
                        name: "AES-GCM",
                        length: 256
                    },
                    true, ['encrypt', 'decrypt']
                );
                const arrayBufferSharedKey = await crypto.subtle.wrapKey("raw", sharedKey, encryptPublicKey, 
                    {
                        name: "RSA-OAEP",
                        hash: "SHA-256",
                        modulusLength: 4096,
                        publicExponent: new Uint8Array([1, 0, 1])
                    }
                );
                const base64EncryptedSharedKey = arrayBufferToBase64(arrayBufferSharedKey);
                
                body = await dynamo.send(
                    new PutCommand({
                        TableName: tableName,
                        Item: { 
                            email: requestJSON.email,
                            password: requestJSON.password,
                            clientPublicKey: requestJSON.clientPublicKey,
                            clientRsaPublicKey: requestJSON.clientRsaPublicKey,
                            sharedKey: base64EncryptedSharedKey,
                            IV: requestJSON.IV
                      },
                    })
                );
                body = `Successfully registered user ${requestJSON.email} to PDS`;
                break;
            default:
                throw new Error(`Unsupported route: "${event.routeKey}"`);
        }
    }
    catch (err) {
        statusCode = 400;
        body = err.message;
    }
    finally {
        body = JSON.stringify(body);
    }
    return {
        statusCode,
        body,
        headers
    };
};

