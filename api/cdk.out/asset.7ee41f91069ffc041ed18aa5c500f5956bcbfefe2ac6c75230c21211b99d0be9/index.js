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
  postHit: () => postHit
});
module.exports = __toCommonJS(hits_exports);
var import_aws_sdk = require("aws-sdk");
var TableName = process.env.HITS_TABLE_NAME;
var dynamo = new import_aws_sdk.DynamoDB();
var postHit = async (event) => {
  try {
    await dynamo.updateItem({
      TableName,
      Key: { path: { S: event.path } },
      UpdateExpression: "ADD hits :incr",
      ExpressionAttributeValues: { ":incr": { N: "1" } }
    }).promise();
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
    const data = await dynamo.scan({
      TableName
    }).promise();
    const totalHits = data.Items?.reduce(
      (acc, item) => item.hits?.N ? Number(item.hits?.N) + acc : acc,
      0
    );
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
  postHit
});
