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
var import_aws_sdk = require("aws-sdk");
var import_uuid = require("uuid");
var TableName = process.env.MESSAGES_TABLE_NAME;
var dynamo = new import_aws_sdk.DynamoDB();
var postMessage = async (event) => {
  try {
    if (!event.body) {
      throw new Error(`Can't post an empty message`);
    }
    const body = JSON.parse(event.body);
    const message = body.message;
    if (typeof message !== "string" || message.length > 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Message must be a string and up to 5 characters long."
        })
      };
    }
    const ip = event.requestContext.identity.sourceIp;
    const existingItem = await dynamo.getItem({
      TableName,
      Key: {
        ip: {
          S: ip
        }
      }
    }).promise();
    if (existingItem.Item) {
      throw new Error(`You can't post more than one message.`);
    }
    const newItem = {
      id: {
        S: (0, import_uuid.v4)()
      },
      message: {
        S: message
      },
      ip: {
        S: ip
      }
    };
    await dynamo.putItem({ TableName, Item: newItem }).promise();
    return { statusCode: 200, body: JSON.stringify(newItem) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error })
    };
  }
};
var getMessages = async () => {
  try {
    const data = await dynamo.scan({ TableName }).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ data: { messages: data.Items } })
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
