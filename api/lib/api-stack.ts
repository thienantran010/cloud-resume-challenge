import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Runtime, Function, Code } from "aws-cdk-lib/aws-lambda";
import {
  IResource,
  RestApi,
  MockIntegration,
  PassthroughBehavior,
  Cors,
  CorsOptions,
} from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { join } from "path";
import { initializeHitsTable } from "../lambda/hits";

export class ApiStack extends Stack {
  private HitsTable: dynamodb.Table;
  private MessagesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.HitsTable = new dynamodb.Table(this, "Hits", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.MessagesTable = new dynamodb.Table(this, "Messages", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: "Messages1",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    initializeHitsTable();

    const {
      healthCheckIntegration,
      helloWorldIntegration,
      postHitIntegration,
      getTotalHitsIntegration,
      postMessageIntegration,
      getMessagesIntegration,
    } = this.getIntegrations();

    const api = new RestApi(this, "API", {
      restApiName: "API ",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
      },
    });

    const root = api.root;
    root.addMethod("GET", helloWorldIntegration);

    const hits = api.root.addResource("hits");
    hits.addMethod("GET", getTotalHitsIntegration);
    hits.addMethod("POST", postHitIntegration);

    const messages = api.root.addResource("messages");
    messages.addMethod("GET", getMessagesIntegration);
    messages.addMethod("POST", postMessageIntegration);

    const healthCheck = api.root.addResource("healthcheck");
    healthCheck.addMethod("GET", healthCheckIntegration);

    /*
    this.addCorsOptions(root);
    this.addCorsOptions(hits);
    this.addCorsOptions(messages);
    */
  }

  private getIntegrations = () => {
    const HITS_TABLE_NAME = this.HitsTable.tableName;
    const MESSAGES_TABLE_NAME = this.MessagesTable.tableName;

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      depsLockFilePath: join(__dirname, "..", "package-lock.json"),
      runtime: Runtime.NODEJS_20_X,
    };

    // Hello World Lambda
    const helloWorldLambda = new NodejsFunction(this, "helloWorldFunction", {
      entry: join(__dirname, "..", "lambda", "hello", "index.ts"),
      handler: "handler",
      ...nodeJsFunctionProps,
    });

    // Hits lambdas
    const postHitLambda = new NodejsFunction(this, "postHitFunction", {
      entry: join(__dirname, "..", "lambda", "hits", "index.ts"),
      handler: "postHit",
      environment: {
        HITS_TABLE_NAME,
      },
      ...nodeJsFunctionProps,
    });

    const getTotalHitsLambda = new NodejsFunction(
      this,
      "getTotalHitsFunction",
      {
        entry: join(__dirname, "..", "lambda", "hits", "index.ts"),
        handler: "getTotalHits",
        environment: {
          HITS_TABLE_NAME,
        },
        ...nodeJsFunctionProps,
      }
    );

    this.HitsTable.grantReadData(getTotalHitsLambda);
    this.HitsTable.grantWriteData(postHitLambda);

    // Messages lambdas
    const postMessageLambda = new NodejsFunction(this, "postMessageFunction", {
      entry: join(__dirname, "..", "lambda", "messages", "index.ts"),
      handler: "postMessage",
      environment: {
        MESSAGES_TABLE_NAME,
      },
      ...nodeJsFunctionProps,
    });

    const getMessagesLambda = new NodejsFunction(this, "getMessagesFunction", {
      entry: join(__dirname, "..", "lambda", "messages", "index.ts"),
      handler: "getMessages",
      environment: {
        MESSAGES_TABLE_NAME,
      },
      ...nodeJsFunctionProps,
    });

    // Health Check Lambda
    const healthCheckLambda = new NodejsFunction(this, "healthCheckFunction", {
      entry: join(__dirname, "..", "lambda", "healthcheck", "index.ts"),
      handler: "handler",
      ...nodeJsFunctionProps,
    });

    this.MessagesTable.grantReadData(getMessagesLambda);
    this.MessagesTable.grantWriteData(postMessageLambda);

    const helloWorldIntegration = new LambdaIntegration(helloWorldLambda);
    const postHitIntegration = new LambdaIntegration(postHitLambda);
    const getTotalHitsIntegration = new LambdaIntegration(getTotalHitsLambda);
    const postMessageIntegration = new LambdaIntegration(postMessageLambda);
    const getMessagesIntegration = new LambdaIntegration(getMessagesLambda);
    const healthCheckIntegration = new LambdaIntegration(healthCheckLambda);

    return {
      helloWorldIntegration,
      postHitIntegration,
      getTotalHitsIntegration,
      postMessageIntegration,
      getMessagesIntegration,
      healthCheckIntegration,
    };
  };

  private addCorsOptions = (apiResource: IResource) => {
    apiResource.addMethod(
      "OPTIONS",
      new MockIntegration({
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers":
                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Credentials":
                "'false'",
              "method.response.header.Access-Control-Allow-Methods":
                "'OPTIONS,GET,PUT,POST,DELETE'",
            },
          },
        ],
        // In case you want to use binary media types, comment out the following line
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestTemplates: {
          "application/json": '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Credentials": true,
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],
      }
    );
  };
}
