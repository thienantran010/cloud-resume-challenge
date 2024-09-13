import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";

const TableName = process.env.HITS_TABLE_NAME as string;
const db = DynamoDBDocument.from(new DynamoDB());

export const initializeHitsTable = async () => {
  try {
    const item = {
      TableName,
      Item: {
        id: "hits",
        num: 0,
      },
    };
    await db.put(item);
    console.log(
      "Hits table initialized successfully with an initial document."
    );
  } catch (error) {
    console.log(`Failed to initialize hits table: ${error}`);
  }
};

export const postHit: APIGatewayProxyHandler = async (event) => {
  try {
    await db.update({
      TableName,
      Key: { id: "hits" },

      // for some reason num can't be found so we have to use if_not_exists
      UpdateExpression: "SET #num = if_not_exists(#num, :zero) + :incr",
      ExpressionAttributeNames: {
        "#num": "num",
      },
      ExpressionAttributeValues: {
        ":incr": 1,
        ":zero": 0,
      },
    });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({ data: "Your visit has been recorded" }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error }) };
  }
};

export const getTotalHits: APIGatewayProxyHandler = async (event) => {
  try {
    const data = await db.get({
      TableName,
      Key: { id: "hits" },
    });

    const totalHits = data?.Item?.num;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
      },
      body: JSON.stringify({ data: { hits: totalHits || 0 } }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error }) };
  }
};
