import type { AWS } from "@serverless/typescript";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/.env" });

import sendDailyMessage from "@functions/meta-assistant/send-daily-message";
import sendWeeklyMessage from "@functions/meta-assistant/send-weekly-message";
import { env } from "process";
import { getSlackUserAvatarHandler, listMemoPdfHandler } from "src/functions";
import removeUserAttributeHanndler from "src/functions/keycloak/remove-user-attribute";
import updateVacationHandler from "src/functions/keycloak/update-user-vacation";
import getContentPdfHandler from "src/functions/memo-management/drive-memos/get-content-pdf";
import onCallImportFromJsonHandler from "src/functions/on-call/create-on-call-data-from-json";
import onCallListDataHandler from "src/functions/on-call/list-on-call-data";
import deleteQuestionnaireHandler from "src/functions/questionnaire/delete-questionnaire";
import listQuestionnaireHandler from "src/functions/questionnaire/list-questionnaire";
import updateQuestionnaireHandler from "src/functions/questionnaire/update-questionnaire";
import addOptInHandler from "src/functions/severa/add-opt-in";
import getContractedWorkWeekHandler from "src/functions/severa/get-filtered-workdays";
import getWorkHoursHandler from "src/functions/severa/get-filtered-workhours";
import getFlextimeHandler from "src/functions/severa/get-flextime-by-user";
import getPhasesHandler from "src/functions/severa/get-phases-by-project";
import getResourceAllocationHandler from "src/functions/severa/get-resource-allocations-by-user";
import listWorkdaysForUserHandler from "src/functions/severa/list-workdays-for-user";
import removeOptInHandler from "src/functions/severa/remove-opt-in";
import listUsersFlextimeHandler from "src/functions/users/flextime";
import updateUserStatus from "src/functions/users/update-status";
import createVacationRequestHandler from "src/functions/vacation-request/create-vacation-request";
import deleteVacationRequestHandler from "src/functions/vacation-request/delete-vacation-request";
import findVacationRequestHandler from "src/functions/vacation-request/find-vacation-request";
import listVacationRequestHandler from "src/functions/vacation-request/list-vacation-request";
import updateVacationRequestHandler from "src/functions/vacation-request/update-vacation-request";
import createArticleHandler from "src/functions/wiki-documentation/create-article";
import deleteArticleHandler from "src/functions/wiki-documentation/delete-article";
import findArticleHandler from "src/functions/wiki-documentation/find-article";
import findArticleByPathHandler from "src/functions/wiki-documentation/find-article-by-path";
import listArticlesHandler from "src/functions/wiki-documentation/list-articles";
import listMediaHandler from "src/functions/wiki-documentation/list-media";
import readArticleHandler from "src/functions/wiki-documentation/read-article";
import updateArticleHandler from "src/functions/wiki-documentation/update-article";
import uploadFileHandler from "src/functions/wiki-documentation/upload-file";
import findUserHandler from "@/functions/keycloak/find-user";
import listUsersHandler from "@/functions/keycloak/list-users";
import createTranslatedMemoPdfHandler from "@/functions/memo-management/drive-memos/translated-memos/create-translated-memo-pdf";
import getTranslatedMemoPdfHandler from "@/functions/memo-management/drive-memos/translated-memos/get-translated-memo-pdf";
import onCallUpdatePaidHandler from "@/functions/on-call/update-paid";
import onCallWeeklyCheckHandler from "@/functions/on-call/weekly-check";
import createQuestionnaireHandler from "@/functions/questionnaire/create-questionnaire";
import findQuestionnaireHandler from "@/functions/questionnaire/find-questionnaire";
import createSoftwareHandler from "@/functions/software-registry/create-software";
import deleteSoftwareHandler from "@/functions/software-registry/delete-software";
import findSoftwareHandler from "@/functions/software-registry/find-software";
import listSoftwareHandler from "@/functions/software-registry/list-software";
import updateSoftwareHandler from "@/functions/software-registry/update-software";

const isLocal = process.env.STAGE === "local";
const region = (env.AWS_DEFAULT_REGION as any) || "eu-north-1";

const serverlessConfiguration: AWS = {
  service: "home-lambdas",
  useDotenv: true,
  frameworkVersion: "3",
  plugins: [
    "serverless-esbuild",
    "serverless-deployment-bucket",
    "serverless-offline",
    "serverless-dynamodb"
  ],
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    region: region,
    deploymentBucket: {
      name: isLocal ? "local-bucket" : `\${self:service}-\${opt:stage}-${region}-deploy`
    },
    memorySize: 256,
    timeout: 60,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true
    },
    httpApi: {
      cors: true,
      authorizers: {
        homeKeycloakAuthorizer: {
          identitySource: "$request.header.Authorization",
          issuerUrl: env.AUTH_ISSUER,
          audience: ["account"]
        }
      }
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      STAGE: "${opt:stage, 'local'}",
      SEVERA_TEST_USER_EMAIL: env.SEVERA_TEST_USER_EMAIL,
      AUTH_ISSUER: env.AUTH_ISSUER,
      METATAVU_BOT_TOKEN: env.METATAVU_BOT_TOKEN,
      KEYCLOAK_CLIENT_SECRET: env.KEYCLOAK_CLIENT_SECRET,
      KEYCLOAK_BASE_URL: env.KEYCLOAK_BASE_URL,
      KEYCLOAK_REALM: env.KEYCLOAK_REALM,
      KEYCLOAK_USERNAME: env.KEYCLOAK_USERNAME,
      KEYCLOAK_PASSWORD: env.KEYCLOAK_PASSWORD,
      KEYCLOAK_ADMIN_SECRET: env.KEYCLOAK_ADMIN_SECRET,
      KEYCLOAK_CLIENT: env.KEYCLOAK_CLIENT,
      KEYCLOAK_CLIENT_ID: env.KEYCLOAK_CLIENT_ID,
      SLACK_USER_OVERRIDE: env.SLACK_USER_OVERRIDE,
      DAILY_SCHEDULE_TIMER: env.DAILY_SCHEDULE_TIMER,
      WEEKLY_SCHEDULE_TIMER: env.WEEKLY_SCHEDULE_TIMER,
      SPLUNK_API_ID: env.SPLUNK_API_ID,
      SPLUNK_API_KEY: env.SPLUNK_API_KEY,
      SPLUNK_SCHEDULE_POLICY_NAME: env.SPLUNK_SCHEDULE_POLICY_NAME,
      SPLUNK_TEAM_ONCALL_URL: env.SPLUNK_TEAM_ONCALL_URL,
      ONCALL_WEEKLY_SCHEDULE_TIMER: env.ONCALL_WEEKLY_SCHEDULE_TIMER,
      GOOGLE_MANAGEMENT_MINUTES_FOLDER_ID: env.GOOGLE_MANAGEMENT_MINUTES_FOLDER_ID,
      SEVERA_BASE_URL: env.SEVERA_BASE_URL,
      SEVERA_CLIENT_ID: env.SEVERA_CLIENT_ID,
      SEVERA_CLIENT_SECRET: env.SEVERA_CLIENT_SECRET,
      DYNAMODB_ENDPOINT: isLocal ? "http://localhost:8000" : undefined,
      CHANNEL_ID: env.CHANNEL_ID,
      HOME_BUCKET_NAME: env.HOME_BUCKET_NAME,
      HOME_BUCKET_REGION: region,
      ADMIN_SLACK_USERS: env.ADMIN_SLACK_USERS || undefined,
      ADMIN_EMAILS: env.ADMIN_EMAILS || undefined,
      MAILGUN_PORT: env.MAILGUN_PORT || undefined,
      MAILGUN_SMTP_HOST: env.MAILGUN_SMTP_HOST || undefined,
      MAILGUN_SMTP_HOST_USER: env.MAILGUN_SMTP_HOST_USER || undefined,
      MAILGUN_SMTP_PASSWORD: env.MAILGUN_SMTP_PASSWORD || undefined,
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || undefined,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || undefined,
      GOOGLE_REFRESH_TOKEN: env.GOOGLE_REFRESH_TOKEN || undefined,
      GOOGLE_DRIVE_FOLDER_ID: env.GOOGLE_DRIVE_FOLDER_ID || undefined
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:PutObject"],
            Resource: isLocal ? "*" : `arn:aws:s3:::${env.HOME_BUCKET_NAME}/*`
          },
          {
            Effect: "Allow",
            Action: ["s3:ListBucket"],
            Resource: isLocal ? "*" : `arn:aws:s3:::${env.HOME_BUCKET_NAME}`
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:DescribeTable",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem"
            ],
            Resource: isLocal
              ? "*"
              : [
                  "arn:aws:dynamodb:${self:provider.region}:*:table/SoftwareRegistry",
                  "arn:aws:dynamodb:${self:provider.region}:*:table/Questionnaires",
                  "arn:aws:dynamodb:${self:provider.region}:*:table/VacationRequests",
                  "arn:aws:dynamodb:${self:provider.region}:*:table/Articles",
                  "arn:aws:dynamodb:${self:provider.region}:*:table/Articles/index/GSI_Path",
                  "arn:aws:dynamodb:${self:provider.region}:*:table/OnCallSchedule",
                  "arn:aws:dynamodb:${self:provider.region}:*:table/Memos",
                  "arn:aws:dynamodb:${self:provider.region}:*:table/Memos/index/FileIdIndex"
                ]
          }
        ]
      }
    }
  },
  functions: {
    onCallListDataHandler,
    onCallWeeklyCheckHandler,
    onCallImportFromJsonHandler,
    sendDailyMessage,
    sendWeeklyMessage,
    onCallUpdatePaidHandler,
    createSoftwareHandler,
    findSoftwareHandler,
    listSoftwareHandler,
    updateSoftwareHandler,
    deleteSoftwareHandler,
    listUsersHandler,
    listUsersFlextimeHandler,
    findUserHandler,
    removeUserAttributeHanndler,
    updateVacationHandler,
    createQuestionnaireHandler,
    findQuestionnaireHandler,
    deleteQuestionnaireHandler,
    listQuestionnaireHandler,
    updateQuestionnaireHandler,
    getFlextimeHandler,
    createVacationRequestHandler,
    deleteVacationRequestHandler,
    findVacationRequestHandler,
    listVacationRequestHandler,
    updateVacationRequestHandler,
    getResourceAllocationHandler,
    getPhasesHandler,
    getWorkHoursHandler,
    listArticlesHandler,
    listMediaHandler,
    findArticleHandler,
    findArticleByPathHandler,
    createArticleHandler,
    updateArticleHandler,
    deleteArticleHandler,
    readArticleHandler,
    uploadFileHandler,
    getContractedWorkWeekHandler,
    removeOptInHandler,
    listWorkdaysForUserHandler,
    getSlackUserAvatarHandler,
    listMemoPdfHandler,
    getContentPdfHandler,
    getTranslatedMemoPdfHandler,
    createTranslatedMemoPdfHandler,
    addOptInHandler,
    updateUserStatus
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node20",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
      external: ["nodemailer"]
    }
  },
  resources: {
    Resources: {
      Questionnaires: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
          TableName: "Questionnaires",
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      },
      Software: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
          TableName: "SoftwareRegistry",
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S"
            }
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH"
            }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      },
      VacationRequests: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
          TableName: "VacationRequests",
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      },
      Articles: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
          TableName: "Articles",
          AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "path", AttributeType: "S" }
          ],
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          GlobalSecondaryIndexes: [
            {
              IndexName: "GSI_Path",
              KeySchema: [{ AttributeName: "path", KeyType: "HASH" }],
              Projection: { ProjectionType: "KEYS_ONLY" },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
              }
            }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      },
      OnCallSchedule: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
          TableName: "OnCallSchedule",
          AttributeDefinitions: [
            { AttributeName: "Year", AttributeType: "N" },
            { AttributeName: "Week", AttributeType: "N" }
          ],
          KeySchema: [
            { AttributeName: "Year", KeyType: "HASH" },
            { AttributeName: "Week", KeyType: "RANGE" }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      },
      Memos: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Delete",
        Properties: {
          TableName: "Memos",
          AttributeDefinitions: [
            { AttributeName: "PK", AttributeType: "S" },
            { AttributeName: "SK", AttributeType: "S" },
            { AttributeName: "fileId", AttributeType: "S" },
            { AttributeName: "language", AttributeType: "S" }
          ],
          KeySchema: [
            { AttributeName: "PK", KeyType: "HASH" },
            { AttributeName: "SK", KeyType: "RANGE" }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "FileIdIndex",
              KeySchema: [
                { AttributeName: "fileId", KeyType: "HASH" },
                { AttributeName: "language", KeyType: "RANGE" }
              ],
              Projection: { ProjectionType: "KEYS_ONLY" },
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
              }
            }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
