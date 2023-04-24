import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    GetCommand,
    PutCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "sneUsers";

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
                body=await dynamo.send(
                    new PutCommand({
                        TableName: tableName,
                        Item: {
                            email: requestJSON.email,
                            password: requestJSON.password,
                        },
                    })
                );
                body = `Successfully registered user ${requestJSON.email} to SNE`;
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
