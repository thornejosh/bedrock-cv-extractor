import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  BedrockRuntimeClient,
  ConversationRole,
  ConverseCommand,
  DocumentFormat,
  Tool,
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { CVData, CVDataSchema } from "../types/cvDataSchema";
import { cvExtractorPrompt } from "./prompt";

// Initialize clients outside of the handler for reuse between invocations
const s3Client = new S3Client();
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
});
const dynamoClient = new DynamoDBClient();

/**
 * Extracts structured CV data from a PDF document using Bedrock AI
 * @param buffer The PDF document as a byte array
 * @returns Structured CV data
 */
const extractCvData = async (buffer: Uint8Array): Promise<CVData> => {
  const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";

  const jsonTool: Tool = {
    toolSpec: {
      name: "CVDetailsSchema",
      description:
        "Contains a schema for the details to be extracted from the cv",
      inputSchema: {
        json: CVDataSchema,
      },
    },
  };

  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: ConversationRole.USER,
        content: [
          {
            document: {
              name: "cv",
              format: DocumentFormat.PDF,
              source: {
                bytes: buffer,
              },
            },
          },
          {
            text: cvExtractorPrompt,
          },
        ],
      },
    ],
    toolConfig: {
      tools: [jsonTool],
    },
  });

  try {
    const response = await bedrockClient.send(command);

    const contentBlocks = response.output?.message?.content;
    if (!contentBlocks) {
      throw new Error(
        "Bedrock response did not contain expected content blocks"
      );
    }

    const toolUseContentBlock = contentBlocks.find(
      (contentBlock) => contentBlock.toolUse !== undefined
    );

    if (!toolUseContentBlock?.toolUse?.input) {
      throw new Error("Could not find tool use content in Bedrock response");
    }

    // Get the raw response from the tool
    return toolUseContentBlock.toolUse.input as CVData;
  } catch (error) {
    console.error("Error during Bedrock AI extraction:", error);
    throw new Error(
      `Failed to extract CV data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Retrieves a PDF document from S3
 * @param bucket The S3 bucket name
 * @param key The S3 object key
 * @returns The document as a byte array
 */
const getDocumentFromS3 = async (
  bucket: string,
  key: string
): Promise<Uint8Array> => {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(getObjectCommand);
    const content = await response.Body?.transformToByteArray();

    if (!content) {
      throw new Error("No content found in CV file");
    }

    return content;
  } catch (error) {
    console.error("Error retrieving document from S3:", error);
    throw new Error(
      `Failed to retrieve document from S3: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Stores the extracted CV data in DynamoDB
 * @param fileName The original file name
 * @param data The extracted CV data
 */
const storeCvDataInDynamoDB = async (
  fileName: string,
  data: CVData
): Promise<void> => {
  try {
    if (!process.env.TABLE_NAME) {
      throw new Error("TABLE_NAME environment variable is not defined");
    }

    await dynamoClient.send(
      new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          id: { S: randomUUID() },
          fileName: { S: fileName },
          analysisResult: { S: JSON.stringify(data) },
          timestamp: { S: new Date().toISOString() },
        },
      })
    );
  } catch (error) {
    console.error("Error storing CV data in DynamoDB:", error);
    throw new Error(
      `Failed to store CV data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Lambda handler that processes CV files uploaded to S3
 * Extracts structured data using Bedrock AI and stores it in DynamoDB
 */
export const handler = async (event: S3Event) => {
  try {
    // Validate input
    if (!event.Records || event.Records.length === 0) {
      throw new Error("No records found in S3 event");
    }

    // Get the S3 bucket and key from the event
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
    );

    // Get the CV file from S3
    const cvContent = await getDocumentFromS3(bucket, key);

    // Extract the CV information using Bedrock
    const data = await extractCvData(cvContent);

    // Store the analysis results in DynamoDB
    await storeCvDataInDynamoDB(key, data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "CV processed successfully",
        result: data,
      }),
    };
  } catch (error) {
    console.error("Error processing CV:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing CV",
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
