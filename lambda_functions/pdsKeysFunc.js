import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

import crypto from "crypto";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "pdsKeys";


// Helper function to convert ArrayBuffer to base64 ASCII string
function arrayBufferToBase64(buffer) 
{
    const binaryStr = String.fromCharCode.apply(null, new Uint8Array(buffer));
    var base64Str = Buffer.from(binaryStr, 'binary').toString('base64');
    return base64Str;
}

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    switch (event.routeKey) {
      case "GET /publicKey":
        const keyData = await dynamo.send(
          new ScanCommand({ TableName: tableName })
        );

        if (keyData.Items && keyData.Items.length > 0) {
          // Public key already exists in pdsKeys table
          body = {
            publicKey: keyData.Items[0].publicKey,
            rsaPublicKey: keyData.Items[0].rsaPublicKey,
            encryptPublicKey: keyData.Items[0].encryptPublicKey
          };
        } else {
          // ECDH Keys do not exist in pdsKeys table, create new key pair
          const keyPair = await crypto.subtle.generateKey(
            {
              name: 'ECDH',
              namedCurve: 'P-384'
            },
            true, ['deriveKey']
          );
          let publicKey = keyPair.publicKey;
          let privateKey = keyPair.privateKey;
          
          const arrayBufferPublicKey = await crypto.subtle.exportKey("spki", publicKey);
          const base64PublicKey = arrayBufferToBase64(arrayBufferPublicKey);
          
          const arrayBufferPrivateKey = await crypto.subtle.exportKey("pkcs8", privateKey);
          const base64PrivateKey = arrayBufferToBase64(arrayBufferPrivateKey);
          
          // RSA Signing Keys do not exist in pdsKeys table, create new key pair
          const rsaKeyPair = await crypto.subtle.generateKey(
            {
              name: "RSA-PSS",
              modulusLength: 4096,
              publicExponent: new Uint8Array([1, 0, 1]),
              hash: "SHA-256"
            },
            true, ['sign', 'verify']
          );
          let rsaPublicKey = rsaKeyPair.publicKey;
          let rsaPrivateKey = rsaKeyPair.privateKey;
          
          const arrayBufferRsaPublicKey = await crypto.subtle.exportKey("spki", rsaPublicKey);
          const base64RsaPublicKey = arrayBufferToBase64(arrayBufferRsaPublicKey);
          
          const arrayBufferRsaPrivateKey = await crypto.subtle.exportKey("pkcs8", rsaPrivateKey);
          const base64RsaPrivateKey = arrayBufferToBase64(arrayBufferRsaPrivateKey);
          
          // RSA Encrypt/Decrypt Keys do not exist in pdsKeys table, create new key pair
          const encryptDecryptKeyPair = await crypto.subtle.generateKey(
            {
              name: "RSA-OAEP",
              modulusLength: 4096,
              publicExponent: new Uint8Array([1, 0, 1]),
              hash: "SHA-256"
            },
            true, ['encrypt', 'decrypt', 'wrapKey']
          );
          let encryptPublicKey = encryptDecryptKeyPair.publicKey;
          let decryptPrivateKey = encryptDecryptKeyPair.privateKey;
          
          const arrayBufferEncryptPublicKey = await crypto.subtle.exportKey("spki", encryptPublicKey);
          const base64EncryptPublicKey = arrayBufferToBase64(arrayBufferEncryptPublicKey);
          
          const arrayBufferDecryptPrivateKey = await crypto.subtle.exportKey("pkcs8", decryptPrivateKey);
          const base64DecryptPrivateKey = arrayBufferToBase64(arrayBufferDecryptPrivateKey);
          
          
          await dynamo.send(
            new PutCommand({
              TableName: tableName,
              Item: {
                publicKey: base64PublicKey,
                privateKey: base64PrivateKey,
                rsaPublicKey: base64RsaPublicKey,
                rsaPrivateKey: base64RsaPrivateKey,
                encryptPublicKey: base64EncryptPublicKey,
                decryptPrivateKey: base64DecryptPrivateKey
              },
            })
          );
          body = {
            publicKey: base64PublicKey,
            rsaPublicKey: base64RsaPublicKey,
            encryptPublicKey: base64EncryptPublicKey
          };
        }
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};
