import type { AWS } from "@serverless/typescript";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
import { env } from "process";

import { 
  listDealsHandler, 
  listLeadsHandler, 
  getLeadByIdHandler, 
  getDealByIdHandler, 
  addInterestToDealHandler, 
  addInterestToLeadHandler, 
  removeInterestFromDealHandler, 
  removeInterestFromLeadHandler,  
  listAllocationsHandler,
  listProjectsHandler,
  listTasksHandler,
  listTimeEntriesHandler,
  listProjectSprintsHandler,
  getAllocationHandler,
  getProjectHandler,
  getTaskHandler,
  sendDailyMessage,
  sendWeeklyMessage,
  updatePaidHandler,
  listOnCallDataHandler,
  weeklyCheckHandler,
  getSlackUserAvatar
} from "src/functions";

const serverlessConfiguration: AWS = {
  service: 'home-lambdas',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-deployment-bucket'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    region: env.AWS_DEFAULT_REGION as any,
    deploymentBucket: {
      name: "${self:service}-${opt:stage}-deploy"
    },
    memorySize: 128,
    timeout: 60,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    httpApi: {
      cors: true,
      authorizers: {
        "timebankKeycloakAuthorizer": {
          identitySource: "$request.header.Authorization",
          issuerUrl: env.AUTH_ISSUER,
          audience: ["account"]
        }
      },
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      FORECAST_API_KEY: env.FORECAST_API_KEY,
      AUTH_ISSUER: env.AUTH_ISSUER,
      PIPEDRIVE_API_KEY: env.PIPEDRIVE_API_KEY,
      PIPEDRIVE_API_URL: env.PIPEDRIVE_API_URL,
      METATAVU_BOT_TOKEN: env.METATAVU_BOT_TOKEN,
      TIMEBANK_BASE_URL: env.TIMEBANK_BASE_URL,
      FORECAST_BASE_URL: env.FORECAST_BASE_URL,
      KEYCLOAK_CLIENT_SECRET: env.KEYCLOAK_CLIENT_SECRET,
      KEYCLOAK_BASE_URL: env.KEYCLOAK_BASE_URL,
      KEYCLOAK_REALM: env.KEYCLOAK_REALM,
      KEYCLOAK_USERNAME: env.KEYCLOAK_USERNAME,
      KEYCLOAK_PASSWORD: env.KEYCLOAK_PASSWORD,
      KEYCLOAK_CLIENT: env.KEYCLOAK_CLIENT,
      SLACK_USER_OVERRIDE: env.SLACK_USER_OVERRIDE,
      DAILY_SCHEDULE_TIMER: env.DAILY_SCHEDULE_TIMER,
      WEEKLY_SCHEDULE_TIMER: env.WEEKLY_SCHEDULE_TIMER,
      ON_CALL_BUCKET_NAME: env.ON_CALL_BUCKET_NAME,
      SPLUNK_API_ID: env.SPLUNK_API_ID,
      SPLUNK_API_KEY: env.SPLUNK_API_KEY,
      SPLUNK_SCHEDULE_POLICY_NAME: env.SPLUNK_SCHEDULE_POLICY_NAME,
      SPLUNK_TEAM_ONCALL_URL: env.SPLUNK_TEAM_ONCALL_URL,
      ONCALL_WEEKLY_SCHEDULE_TIMER: env.ONCALL_WEEKLY_SCHEDULE_TIMER,
    },
    s3: {
      "on-call": {
        bucketName: "${opt:stage}-on-call-data"
      }
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject"],
            Resource: "arn:aws:s3:::${opt:stage}-on-call-data/*"
          },
          {
            Effect: "Allow",
            Action: ["s3:PutObject"],
            Resource: "arn:aws:s3:::${opt:stage}-on-call-data/*"
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
    listAllocationsHandler,
    listProjectsHandler,
    listTasksHandler,
    listTimeEntriesHandler,
    listProjectSprintsHandler,
    listOnCallDataHandler,
    getAllocationHandler,
    getProjectHandler,
    getTaskHandler,
    weeklyCheckHandler,
    sendDailyMessage,
    sendWeeklyMessage,
    updatePaidHandler,
    getSlackUserAvatar
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
