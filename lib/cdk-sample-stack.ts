import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class CdkSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for hosting Nuxt.js application
    const bucket = new s3.Bucket(this, "MyBucket", {
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });

    // CloudFront distribution for the S3 bucket
    const distribution = new cloudfront.Distribution(this, "MyDistribution", {
      defaultBehavior: { origin: new origins.S3Origin(bucket) },
    });

    // Deploy Nuxt.js application to the S3 bucket
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset("../<nuxt-project-dir>/dist")],
      destinationBucket: bucket,
      distribution,
    });

    // DynamoDB table
    const table = new dynamodb.Table(this, "MyTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Lambda function
    const myFunction = new lambda.Function(this, "MyFunction", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "index.handler",
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant the lambda function read/write permissions on the table
    table.grantReadWriteData(myFunction);

    // API Gateway
    new apigateway.LambdaRestApi(this, "Endpoint", {
      handler: myFunction,
    });
  }
}
