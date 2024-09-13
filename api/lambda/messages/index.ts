import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { randomUUID } from "crypto";

const TableName = process.env.MESSAGES_TABLE_NAME as string;
const db = DynamoDBDocument.from(new DynamoDB());

export const postMessage: APIGatewayProxyHandler = async (event) => {
  try {
    // check for valid message
    if (!event.body) {
      throw new Error(`Can't post an empty message or without a name`);
    }
    const body = JSON.parse(event.body);
    const { name, message } = body;

    // post message
    const newItem = {
      id: randomUUID(),
      name,
      message,
      date: new Date().toISOString(),
    };

    await db.put({ TableName, Item: newItem });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify(newItem),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
  }
};

export const getMessages: APIGatewayProxyHandler = async () => {
  try {
    const data = await db.scan({ TableName });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({ data: data.Items }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error }) };
  }
};
