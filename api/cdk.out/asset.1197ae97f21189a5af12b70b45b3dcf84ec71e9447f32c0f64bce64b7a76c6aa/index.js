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

// asset-input/lambda/messages/index.ts
var messages_exports = {};
__export(messages_exports, {
  getMessages: () => getMessages,
  postMessage: () => postMessage
});
module.exports = __toCommonJS(messages_exports);
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_crypto = require("crypto");
var TableName = process.env.MESSAGES_TABLE_NAME;
var db = import_lib_dynamodb.DynamoDBDocument.from(new import_client_dynamodb.DynamoDB());
var postMessage = async (event) => {
  try {
    if (!event.body) {
      throw new Error(`Can't post an empty message or without a name`);
    }
    const body = JSON.parse(event.body);
    const { name, message } = body;
    const newItem = {
      id: (0, import_crypto.randomUUID)(),
      name,
      message,
      date: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db.put({ TableName, Item: newItem });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: JSON.stringify(newItem)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};
var getMessages = async () => {
  try {
    const data = await db.scan({ TableName });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: JSON.stringify({ data: data.Items })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error }) };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getMessages,
  postMessage
});
