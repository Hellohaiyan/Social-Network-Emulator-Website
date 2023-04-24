import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "snePosts";

export const handler = async (event, context) => {
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json",
    };

    try {
        switch (event.routeKey) {
            case "GET /posts":
                body = await dynamo.send(
                    new ScanCommand({ TableName: tableName })
                );
                body = body.Items;
                break;
            case "PUT /posts":
                // Get current Post ID and calculate next one
                let newPostId = 1;
                const posts = await dynamo.send(
                    new ScanCommand({ TableName: tableName })
                );
                if (posts) {
                    newPostId = posts.Items.length + 1;
                }
                
                let requestJSON = JSON.parse(event.body);
                body = await dynamo.send(
                    new PutCommand({
                        TableName: tableName,
                        Item: {
                            postId: newPostId,
                            email: requestJSON.email
                        },
                    })
                );
                body = `Successfully registered post ${newPostId} to SNE`;
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
        headers,
    };
};