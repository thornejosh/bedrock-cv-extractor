import { Construct } from "constructs";
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { join } from "path";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class CVExtractorStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table to store document analysis results
    const cvExtractorTable = new Table(this, "CVExtractorTable", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create an S3 bucket for document uploads
    const cvExtractorBucket = new Bucket(this, "CVExtractorBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create Lambda function
    const processCvFunction = new NodejsFunction(this, "ProcessCVFunction", {
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: join(__dirname, "lambda/processCv.ts"),
      environment: {
        BUCKET_NAME: cvExtractorBucket.bucketName,
        TABLE_NAME: cvExtractorTable.tableName,
      },
      timeout: Duration.minutes(5),
    });

    // Grant Lambda permissions to read from S3
    cvExtractorBucket.grantRead(processCvFunction);

    // Grant Lambda permissions to write to DynamoDB
    cvExtractorTable.grantWriteData(processCvFunction);

    // Add Bedrock permissions to Lambda role
    processCvFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["bedrock:InvokeModel"],
        resources: [
          `arn:aws:bedrock:${
            Stack.of(this).region
          }::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
        ],
      })
    );

    // Add S3 event notification to trigger Lambda
    cvExtractorBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(processCvFunction)
    );

    // Output the bucket name
    new CfnOutput(this, "CVExtractorBucket Name", {
      value: cvExtractorBucket.bucketName,
      description: "Name of the S3 bucket for CV uploads",
    });
  }
}
