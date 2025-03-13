#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CVExtractorStack } from "../lib/cvExtractorStack";

const app = new cdk.App();
new CVExtractorStack(app, "BedrockDocumentExtractionStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
