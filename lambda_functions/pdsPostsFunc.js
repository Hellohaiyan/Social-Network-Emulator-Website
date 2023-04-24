import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    GetCommand,
    ScanCommand,
    PutCommand
} from "@aws-sdk/lib-dynamodb";

import crypto from "crypto";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "pdsPosts";
const keysTableName = "pdsKeys";
const usersTableName = "pdsUsers";

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
            case "PUT /posts/view":
                let requestJSON = JSON.parse(event.body);
                
                // Grab RSA-OAEP private key of PDS and turn into CryptoKey Object
                let base64DecryptPrivateKey = await dynamo.send(
                    new ScanCommand({ TableName: keysTableName })
                );
                base64DecryptPrivateKey = base64DecryptPrivateKey.Items[0].decryptPrivateKey;
                const arrayBufferDecryptPrivateKey = base64ToArrayBuffer(base64DecryptPrivateKey);
                const decryptPrivateKey = await crypto.subtle.importKey('pkcs8', arrayBufferDecryptPrivateKey,
                    {
                        name: "RSA-OAEP",
                        modulusLength: 4096,
                        publicExponent: new Uint8Array([1, 0, 1]),
                        hash: "SHA-256"
                    }, false, ["unwrapKey"]);
                    
                // Get shared key of viewer, decrypt key, and turn it into CryptoKey Object
                let viewer = await dynamo.send(
                    new GetCommand({
                        TableName: usersTableName,
                        Key: {
                            email: requestJSON.viewer
                        }
                    })
                );
                viewer = viewer.Item;
                const base64EncryptedViewerSharedKey = viewer.sharedKey;
                const arrayBufferEncryptedViewerSharedKey = base64ToArrayBuffer(base64EncryptedViewerSharedKey);
                const viewerSharedKey = await crypto.subtle.unwrapKey("raw", arrayBufferEncryptedViewerSharedKey, decryptPrivateKey, 
                    {
                        name: "RSA-OAEP",
                        hash: "SHA-256",
                        modulusLength: 4096,
                        publicExponent: new Uint8Array([1, 0, 1])
                    },
                    {
                        name: "AES-GCM",
                        length: 256
                    }, false, ['encrypt']
                );

                // Get shared key of poster, decrypt key, and turn it into CryptoKey Object
                let postData = await dynamo.send(
                    new GetCommand({
                        TableName: tableName,
                        Key: {
                            postId: parseInt(requestJSON.postId, 10)
                        }
                    })
                );
                postData = postData.Item;
                const posterEmail = postData.email;
                let poster = await dynamo.send(
                    new GetCommand({
                        TableName: usersTableName,
                        Key: {
                            email: posterEmail,
                        },
                    })
                );
                poster = poster.Item;
                const base64EncryptedPosterSharedKey = poster.sharedKey;
                const arrayBufferEncryptedPosterSharedKey = base64ToArrayBuffer(base64EncryptedPosterSharedKey);
                const posterSharedKey = await crypto.subtle.unwrapKey("raw", arrayBufferEncryptedPosterSharedKey, decryptPrivateKey, 
                    {
                        name: "RSA-OAEP",
                        hash: "SHA-256",
                        modulusLength: 4096,
                        publicExponent: new Uint8Array([1, 0, 1])
                    },
                    {
                        name: "AES-GCM",
                        length: 256
                    }, false, ['decrypt']
                );
    
                // Get post and decrypt it using poster shared key and then encrypt it using viewer shared key 
                let base64EncryptedPost = postData.post;
                let base64IV = poster.IV;
                let arrayBufferEncryptedPost = base64ToArrayBuffer(base64EncryptedPost);
                let arrayBufferIV = base64ToArrayBuffer(base64IV);
                const arrayBufferPost = await crypto.subtle.decrypt(
                    {
                        name: "AES-GCM",
                        length: 256,
                        iv: arrayBufferIV
                    }, posterSharedKey, arrayBufferEncryptedPost
                );
                base64IV = viewer.IV;
                arrayBufferIV = base64ToArrayBuffer(base64IV);
                arrayBufferEncryptedPost = await crypto.subtle.encrypt(
                    {
                        name: "AES-GCM",
                        length: 256,
                        iv: arrayBufferIV
                    }, viewerSharedKey, arrayBufferPost
                );
                base64EncryptedPost = arrayBufferToBase64(arrayBufferEncryptedPost);
                
                body = {
                    postDS: postData.postDS,
                    posterRsaPublicKey: poster.clientRsaPublicKey,
                    base64EncryptedPost: base64EncryptedPost
                };
                break;
            case "PUT /posts": {
                let requestJSON = JSON.parse(event.body);

                // Get current Post ID and calculate next one
                let newPostId = 1;
                const posts = await dynamo.send(
                    new ScanCommand({ TableName: tableName })
                );
                if (posts) {
                    newPostId = posts.Items.length + 1;
                }
                
                // Grab RSA-OAEP private key of PDS and turn into CryptoKey Object
                let base64DecryptPrivateKey = await dynamo.send(
                    new ScanCommand({ TableName: keysTableName })
                );
                base64DecryptPrivateKey = base64DecryptPrivateKey.Items[0].decryptPrivateKey;
                const arrayBufferDecryptPrivateKey = base64ToArrayBuffer(base64DecryptPrivateKey);
                const decryptPrivateKey = await crypto.subtle.importKey('pkcs8', arrayBufferDecryptPrivateKey,
                    {
                        name: "RSA-OAEP",
                        modulusLength: 4096,
                        publicExponent: new Uint8Array([1, 0, 1]),
                        hash: "SHA-256"
                    }, false, ["unwrapKey"]);
                
                // Get poster's shared key and decrypt post
                let poster = await dynamo.send(
                    new GetCommand({
                        TableName: usersTableName,
                        Key: {
                            email: requestJSON.email,
                        },
                    })
                );
                poster = poster.Item;
                const base64EncryptedPosterSharedKey = poster.sharedKey;
                const arrayBufferEncryptedPosterSharedKey = base64ToArrayBuffer(base64EncryptedPosterSharedKey);
                const posterSharedKey = await crypto.subtle.unwrapKey("raw", arrayBufferEncryptedPosterSharedKey, decryptPrivateKey, 
                    {
                        name: "RSA-OAEP",
                        hash: "SHA-256",
                        modulusLength: 4096,
                        publicExponent: new Uint8Array([1, 0, 1])
                    },
                    {
                        name: "AES-GCM",
                        length: 256
                    }, false, ['decrypt']
                );
                
                const base64EncryptedPost = requestJSON.post;
                const base64IV = poster.IV;
                const arrayBufferEncryptedPost = base64ToArrayBuffer(base64EncryptedPost);
                const arrayBufferIV = base64ToArrayBuffer(base64IV);
                const arrayBufferPost = await crypto.subtle.decrypt(
                    {
                        name: "AES-GCM",
                        length: 256,
                        iv: arrayBufferIV
                    }, posterSharedKey, arrayBufferEncryptedPost
                );
                
                // Get poster's RSA-PSS public key
                const base64PosterRsaPublicKey = poster.clientRsaPublicKey;
                const arrayBufferPosterRsaPublicKey = base64ToArrayBuffer(base64PosterRsaPublicKey);
                const posterRsaPublicKey = await crypto.subtle.importKey('spki', arrayBufferPosterRsaPublicKey,
                    {
                        name: "RSA-PSS",
                        modulesLength: 4096,
                        publicExponent: new Uint8Array([1, 0, 1]),
                        hash: "SHA-256"
                    }, false, ['verify']);
                
                
                // Verify post using DS
                const base64PostDS = requestJSON.postDS;
                const arrayBufferPostDS = base64ToArrayBuffer(base64PostDS);
                const valid = await crypto.subtle.verify(
                    {
                      name: "RSA-PSS",
                      saltLength: 32
                    },
                    posterRsaPublicKey, arrayBufferPostDS, arrayBufferPost
                );
                
                if (valid) {
                    body = await dynamo.send(
                        new PutCommand({
                            TableName: tableName,
                            Item: {
                                postId: newPostId,
                                email: requestJSON.email,
                                post: requestJSON.post,
                                postDS: requestJSON.postDS
                            },
                        })
                    );
                    body = `Successfully registered post ${newPostId} to PDS`;
                }
                else {
                    body = `Post failed Digital Signature verification`;
                }
                break;
            }
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
        headers,
    };
};