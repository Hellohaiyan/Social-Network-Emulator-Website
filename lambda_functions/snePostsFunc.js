import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    PutCommand,
    DeleteCommand
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
                // Get current Post IDs and calculate next one
                let highestPostId = 1;
                const posts = await dynamo.send(
                    new ScanCommand({ TableName: tableName })
                );
                for (let i = 0; i < posts.Items.length; i++) {
                    if (posts.Items[i].postId > highestPostId) {
                        highestPostId = posts.Items[i].postId;
                    }
                }
                
                let requestJSON = JSON.parse(event.body);
                body = await dynamo.send(
                    new PutCommand({
                        TableName: tableName,
                        Item: {
                            postId: highestPostId + 1,
                            email: requestJSON.email
                        },
                    })
                );
                body = `Successfully registered post ${highestPostId + 1} to SNE`;
                break;
            case "DELETE /posts/{postId}":
                const postId = event.pathParameters.postId;
                await dynamo.send(
                    new DeleteCommand({
                        TableName: tableName,
                        Key: {
                            postId: parseInt(postId, 10)
                        }
                    
                    })
                );
                body = `Successfully deleted post ${postId} from SNE`;
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