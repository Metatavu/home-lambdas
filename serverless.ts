import type { AWS } from "@serverless/typescript";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
import { env } from "process";
import listDealsHandler from "@functions/pipedrive/list-deals";
import listLeadsHandler from "@functions/pipedrive/list-leads";
import getLeadByIdHandler from "@functions/pipedrive/find-lead-by-id";
import getDealByIdHandler from "@functions/pipedrive/find-deal-by-id";
import addInterestToDealHandler from "@functions/pipedrive/add-interest-to-deal";
import addInterestToLeadHandler from "@functions/pipedrive/add-interest-to-lead";
import removeInterestFromDealHandler from "@functions/pipedrive/remove-interest-from-deal";
import removeInterestFromLeadHandler from "@functions/pipedrive/remove-interest-from-lead";
import sendDailyMessage from "@functions/meta-assistant/send-daily-message";
import sendWeeklyMessage from "@functions/meta-assistant/send-weekly-message";
import updatePaidHandler from "@/functions/on-call/update-paid";
import listOnCallDataHandler from "src/functions/on-call/list-on-call-data";
import weeklyCheckHandler from "@/functions/on-call/weekly-check";
import getSlackUserAvatar from "src/functions/slack-user-avatar";
import createSoftwareHandler from "@/functions/software-registry/create-software";
import findSoftwareHandler from "@/functions/software-registry/find-software";
import listSoftwareHandler from "@/functions/software-registry/list-software";
import updateSoftwareHandler from "@/functions/software-registry/update-software";
import deleteSoftwareHandler from "@/functions/software-registry/delete-software";
import listUsersHandler from "@/functions/keycloak/list-users";
import findUserHandler from "@/functions/keycloak/find-user";
import updateUserAttributeHandler from "@/functions/keycloak/update-user-attributes";
import removeUserAttributeHanndler from "src/functions/keycloak/remove-user-attribute";
import createQuestionnaireHandler from "@/functions/questionnaire/create-questionnaire";
import findQuestionnaireHandler from "@/functions/questionnaire/find-questionnaire";
import deleteQuestionnaireHandler from "src/functions/questionnaire/delete-questionnaire";
import listQuestionnaireHandler from "src/functions/questionnaire/list-questionnaire";
import updateQuestionnaireHandler from "src/functions/questionnaire/update-questionnaire";
import listMemoPdfHandler from "@/functions/memo-management/drive-memos/get-memos-pdf";
import getTranslatedMemoPdfHandler from "@/functions/memo-management/drive-memos/get-translated-memo-pdf";
import getSummaryMemoPdfHandler from "@/functions/memo-management/drive-memos/get-summary-memo-pdf";
import getContentPdfHandler from "@/functions/memo-management/drive-memos/get-content-pdf";
import getTrelloCardsOnListHandler from "@/functions/memo-management/trello-cards/get-trello-cards";
import getBoardMembersHandler from "@/functions/memo-management/trello-cards/get-board-members";
import deleteTrelloCardHandler from "@/functions/memo-management/trello-cards/delete-trello-card";
import createTrelloCardHandler from "@/functions/memo-management/trello-cards/create-trello-card";
import createCommentHandler from "@/functions/memo-management/trello-cards/comment-trello-card";
import getFlextimeHandler from "src/functions/severa/get-flextime-by-user";
import createVacationRequestHandler from "src/functions/vacation-request/create-vacation-request";
import deleteVacationRequestHandler from "src/functions/vacation-request/delete-vacation-request";
import findVacationRequestHandler from "src/functions/vacation-request/find-vacation-request";
import listVacationRequestHandler from "src/functions/vacation-request/list-vacation-request";
import updateVacationRequestHandler from "src/functions/vacation-request/update-vacation-request";
import getResourceAllocationHandler  from "src/functions/severa/get-resource-allocations-by-user";
import getPhasesHandler  from "src/functions/severa/get-phases-by-project";
import getWorkHoursHandler from "src/functions/severa/get-filtered-workhours";

const isLocal = process.env.STAGE === "local";
const region = (env.AWS_DEFAULT_REGION as any) || "eu-north-1";

const serverlessConfiguration: AWS = {
  service: "home-lambdas",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild", "serverless-deployment-bucket", "serverless-offline", "serverless-dynamodb"],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    region: region,
    deploymentBucket: {
      name: isLocal ? "local-bucket" : `\${self:service}-\${opt:stage}-${region}-deploy`
    },
    memorySize: 256,
    timeout: 60,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    httpApi: {
      cors: true,
      authorizers: {
        "homeKeycloakAuthorizer": {
          identitySource: "$request.header.Authorization",
          issuerUrl: env.AUTH_ISSUER,
          audience: ["account"]
        }
      },
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      SEVERA_TEST_USER_EMAIL: env.SEVERA_TEST_USER_EMAIL,
      SEVERA_TEST_USER_ID: env.SEVERA_TEST_USER_ID,
      AUTH_ISSUER: env.AUTH_ISSUER,
      PIPEDRIVE_API_KEY: env.PIPEDRIVE_API_KEY,
      PIPEDRIVE_API_URL: env.PIPEDRIVE_API_URL,
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
      ON_CALL_BUCKET_NAME: env.ON_CALL_BUCKET_NAME,
      SPLUNK_API_ID: env.SPLUNK_API_ID,
      SPLUNK_API_KEY: env.SPLUNK_API_KEY,
      SPLUNK_SCHEDULE_POLICY_NAME: env.SPLUNK_SCHEDULE_POLICY_NAME,
      SPLUNK_TEAM_ONCALL_URL: env.SPLUNK_TEAM_ONCALL_URL,
      ONCALL_WEEKLY_SCHEDULE_TIMER: env.ONCALL_WEEKLY_SCHEDULE_TIMER,
      GOOGLE_MANAGEMENT_MINUTES_FOLDER_ID: env.GOOGLE_MANAGEMENT_MINUTES_FOLDER_ID,
      GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL: env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      GOOGLE_CLOUD_PROJECT_ID: env.GOOGLE_CLOUD_PROJECT_ID,
      SEVERA_DEMO_BASE_URL: env.SEVERA_DEMO_BASE_URL,
      SEVERA_DEMO_CLIENT_ID: env.SEVERA_DEMO_CLIENT_ID,
      SEVERA_DEMO_CLIENT_SECRET: env.SEVERA_DEMO_CLIENT_SECRET,
      DYNAMODB_ENDPOINT: isLocal ? "http://localhost:8000" : undefined,
      TRELLO_API_KEY: env.TRELLO_API_KEY,
      TRELLO_TOKEN: env.TRELLO_TOKEN,
      TRELLO_MANAGEMENT_BOARD_ID: env.TRELLO_MANAGEMENT_BOARD_ID,
      CHANNEL_ID: env.CHANNEL_ID,
      OPENAI_API_KEY: env.OPENAI_API_KEY,
    },
    s3: {
      "on-call": {
        bucketName: isLocal ? "local-on-call-data" : "${opt:stage}-on-call-data"
      } 
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject"],
            Resource: isLocal ? "*" : "arn:aws:s3:::${opt:stage}-on-call-data/*"
          },
          {
            Effect: "Allow",
            Action: ["s3:PutObject"],
            Resource: isLocal ? "*" : "arn:aws:s3:::${opt:stage}-on-call-data/*"
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
              "dynamodb:DeleteItem",
            ],
            Resource: isLocal ? "*" : [
              "arn:aws:dynamodb:${self:provider.region}:*:table/SoftwareRegistry",
              "arn:aws:dynamodb:${self:provider.region}:*:table/Questionnaires",
              "arn:aws:dynamodb:${self:provider.region}:*:table/VacationRequests"
            ]
          }
        ]
      }
    }
  },
  functions: {
    listDealsHandler,
    listLeadsHandler,
    getLeadByIdHandler,
    getDealByIdHandler,
    addInterestToDealHandler,
    addInterestToLeadHandler,
    removeInterestFromDealHandler,
    removeInterestFromLeadHandler,
    listOnCallDataHandler,
    weeklyCheckHandler,
    sendDailyMessage,
    sendWeeklyMessage,
    updatePaidHandler,
    getSlackUserAvatar,
    createSoftwareHandler,
    findSoftwareHandler,
    listSoftwareHandler,
    updateSoftwareHandler,
    deleteSoftwareHandler,
    listUsersHandler,
    findUserHandler,
    updateUserAttributeHandler,
    removeUserAttributeHanndler,
    createQuestionnaireHandler,
    findQuestionnaireHandler,
    deleteQuestionnaireHandler,
    listQuestionnaireHandler,
    updateQuestionnaireHandler,
    listMemoPdfHandler,
    getTranslatedMemoPdfHandler,
    getSummaryMemoPdfHandler,
    getTrelloCardsOnListHandler,
    getBoardMembersHandler,
    deleteTrelloCardHandler,
    createTrelloCardHandler,
    createCommentHandler,
    getContentPdfHandler,
    getFlextimeHandler,
    createVacationRequestHandler,
    deleteVacationRequestHandler,
    findVacationRequestHandler,
    listVacationRequestHandler,
    updateVacationRequestHandler,
    getResourceAllocationHandler,
    getPhasesHandler,
    getWorkHoursHandler,
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node16",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
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
          },
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
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
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
          },
        }
      },
    },
  },
};

module.exports = serverlessConfiguration;