"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// asset-input/lambda/hits/index.ts
var hits_exports = {};
__export(hits_exports, {
  getTotalHits: () => getTotalHits,
  initializeHitsTable: () => initializeHitsTable,
  postHit: () => postHit
});
module.exports = __toCommonJS(hits_exports);
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var TableName = process.env.HITS_TABLE_NAME;
var db = import_lib_dynamodb.DynamoDBDocument.from(new import_client_dynamodb.DynamoDB());
var initializeHitsTable = async () => {
  try {
    const item = {
      TableName,
      Item: {
        id: "hits",
        num: 0
      }
    };
    await db.put(item);
    console.log(
      "Hits table initialized successfully with an initial document."
    );
  } catch (error) {
    console.log(`Failed to initialize hits table: ${error}`);
  }
};
var postHit = async (event) => {
  try {
    await db.update({
      TableName,
      Key: { id: "hits" },
      UpdateExpression: "SET #num = if_not_exists(#num, :zero) + :incr",
      ExpressionAttributeNames: {
        "#num": "num"
      },
      ExpressionAttributeValues: {
        ":incr": 1,
        ":zero": 0
      }
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ data: "Your visit has been recorded" })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error }) };
  }
};
var getTotalHits = async (event) => {
  try {
    const data = await db.get({
      TableName,
      Key: { id: "hits" }
    });
    const totalHits = data?.Item?.num;
    return {
      statusCode: 200,
      body: JSON.stringify({ data: { hits: totalHits || 0 } })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getTotalHits,
  initializeHitsTable,
  postHit
});
