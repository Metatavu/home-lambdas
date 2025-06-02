# Serverless - AWS Node.js Typescript

This project has been generated using the `aws-nodejs-typescript` template from the [Serverless framework](https://www.serverless.com/).

For detailed instructions, please refer to the [documentation](https://www.serverless.com/framework/docs/providers/aws/).

## Installation/deployment instructions

Depending on your preferred package manager, follow the instructions below to deploy your project.

> **Requirements**: NodeJS. If you're using [nvm](https://github.com/nvm-sh/nvm), run `nvm use` to ensure you're using the same Node version in local and in your lambda's runtime.

### Using NPM

- Run `npm i` to install the project dependencies
- Run `npx sls deploy` to deploy this stack to AWS

### Using Yarn

- Run `yarn` to install the project dependencies
- Run `yarn sls deploy` to deploy this stack to AWS

## Test your service

This template contains a single lambda function triggered by an HTTP request made on the provisioned API Gateway REST API `/hello` route with `POST` method. The request body must be provided as `application/json`. The body structure is tested by API Gateway against `src/functions/hello/schema.ts` JSON-Schema definition: it must contain the `name` property.

- requesting any other path than `/hello` with any other method than `POST` will result in API Gateway returning a `403` HTTP error code
- sending a `POST` request to `/hello` with a payload **not** containing a string property named `name` will result in API Gateway returning a `400` HTTP error code
- sending a `POST` request to `/hello` with a payload containing a string property named `name` will result in API Gateway returning a `200` HTTP status code with a message saluting the provided name and the detailed event processed by the lambda

> :warning: As is, this template, once deployed, opens a **public** endpoint within your AWS account resources. Anybody with the URL can actively execute the API Gateway endpoint and the corresponding lambda. You should protect this endpoint with the authentication method of your choice.

### Locally

In order to test the hello function locally, run the following command:

- `npx sls invoke local -f hello --stage dev --path src/functions/hello/mock.json` if you're using NPM
- `yarn sls invoke local -f hello --path src/functions/hello/mock.json` if you're using Yarn

Check the [sls invoke local command documentation](https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local/) for more information.

### Remotely

Copy and replace your `url` - found in Serverless `deploy` command output - and `name` parameter in the following `curl` command in your terminal or in Postman to test your newly deployed application.

```
curl --location --request POST 'https://myApiEndpoint/dev/hello' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Frederic"
}'
```

### Serverless-offline

To run serverless-offline plugin run the following command:
- `npx serverless offline --noAuth --stage dev`
Ensure that you have the correct Lambda functions defined and added in your serverless.ts file for them to show up. You can test the endpoints using Postman.

## Testing lambdas locally with dynamodb local & Serverless-offline

AWS CLI is required to run this.

Linux:
- To install the AWS CLI, run the following commands:
```
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
```

Mac:
- In your browser, download the macOS pkg file: [Here](https://awscli.amazonaws.com/AWSCLIV2.pkg)

- Run your downloaded file and follow the on-screen instructions.

Windows:
- Download and run the AWS CLI MSI installer for Windows (64-bit): [Here](https://awscli.amazonaws.com/AWSCLIV2.msi)

After install is completed you need to configure it as follows:
run command: 

```
aws configure
```

- AWS Access Key ID: example (it can be whatever, you are running this locally)
- AWS Secret Access Key: example (same as above)
- Default region name: localhost
- Default output format: (this can be empty)

DynamoDB Local:
- To set up DynamoDB on your computer Download DynamoDB local [Here](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html#DynamoDBLocal.DownloadingAndRunning.title)

- After you download the archive, extract the contents and copy the extracted directory to a location of your choice.

- There are other options for storing the table [Here](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html)

- You can also use DynamoDB local as Docker Image.

To start DynamoDB on your computer, open a command prompt window, navigate to the directory where you extracted DynamoDBLocal.jar, and enter the following command:

```
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

Set AttributeType accordingly based on the type of the id.
- "AttributeName=id,AttributeType=S \"
- AND IN serverless.yml "AttributeType: S"


Create a new table:
```
aws dynamodb create-table \
    --table-name MyDynamoDbTable \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --endpoint-url http://localhost:8000
```

To check current tables:

```
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

Start serverless offline:

```
npx sls offline --stage local --noAuth start
```

## Template features

### Project structure

The project code base is mainly located within the `src` folder. This folder is divided in:

- `functions` - containing code base and configuration for your lambda functions
- `libs` - containing shared code base between your lambdas

```
.
├── src
│   ├── functions               # Lambda configuration and source code folder
│   │   ├── hello
│   │   │   ├── handler.ts      # `Hello` lambda source code
│   │   │   ├── index.ts        # `Hello` lambda Serverless configuration
│   │   │   ├── mock.json       # `Hello` lambda input parameter, if any, for local invocation
│   │   │   └── schema.ts       # `Hello` lambda input event JSON-Schema
│   │   │
│   │   └── index.ts            # Import/export of all lambda configurations
│   │
│   └── libs                    # Lambda shared code
│       └── apiGateway.ts       # API Gateway specific helpers
│       └── handlerResolver.ts  # Sharable library for resolving lambda handlers
│       └── lambda.ts           # Lambda middleware
│
├── package.json
├── serverless.ts               # Serverless service file
├── tsconfig.json               # Typescript compiler configuration
├── tsconfig.paths.json         # Typescript paths
└── webpack.config.js           # Webpack configuration
```

### 3rd party libraries

- [json-schema-to-ts](https://github.com/ThomasAribart/json-schema-to-ts) - uses JSON-Schema definitions used by API Gateway for HTTP request validation to statically generate TypeScript types in your lambda's handler code base
- [middy](https://github.com/middyjs/middy) - middleware engine for Node.Js lambda. This template uses [http-json-body-parser](https://github.com/middyjs/middy/tree/master/packages/http-json-body-parser) to convert API Gateway `event.body` property, originally passed as a stringified JSON, to its corresponding parsed object
- [@serverless/typescript](https://github.com/serverless/typescript) - provides up-to-date TypeScript definitions for your `serverless.ts` service file

### Advanced usage

Any tsconfig.json can be used, but if you do, set the environment variable `TS_NODE_CONFIG` for building the application, eg `TS_NODE_CONFIG=./tsconfig.app.json npx serverless webpack`


### Deployment bucket name configuration

Deployment bucket name opt.stage should be included with the stage flag when using sls commands e.g. --stage dev.

## MetaAssistant
### Staging usage

Staging implementation for selecting slack user ids (through an environment variable) who will receive all the messages sent by daily or weekly messages.

For use in staging environment/ develop branch use the SLACK_USER_OVERRIDE environment variable. If this variable does not exist or is empty the program runs normally. Copy the variable and add it (`SLACK_USER_OVERRIDE=<slackid>`) to the `.env` file.
Multiple ids must be divided by `,` for example `SLACK_USER_OVERRIDE=xxxxxxx,xxxxxxx,xxxxxxx`

##### Getting your slack id
1. Click on a user profile within Slack.
2. Click on "View full profile" in the menu that appears.
3. Click the ellipses (three dots).
4. Click on `Copy Member ID`.

## Management Memos

This section covers the configuration of various services used for management memos purposes. The project uses the existing `SLACK_USER_OVERRIDE=<slackid>` and `METATAVU_BOT_TOKEN` environment variables.

### Google Cloud usage (Google Translation API, Google Drive API, Google Docs API)

#### GOOGLE_CLOUD_PROJECT_ID
1. Go to `Google Cloud Console`.
2. Click `Dashboard` > Create Project.
3. Copy the Project ID from the Project Info section.

#### GOOGLE_MANAGEMENT_MINUTES_FOLDER_ID
1. Go to `Google Drive`.
2. Click `New` > Folder to create a folder.
3. Right-click the folder > Share > Copy link.
4. Copy the Folder ID from the URL.

#### GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID & GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
1. Go to `IAM & Admin`.
2. Select Service Accounts > Create Service Account.
3. Click `Create Key` > JSON.
4. Download the key and extract the Private Key ID and Private Key from the JSON file.

#### GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL
1. Go to `IAM & Admin`.
2. Select Service Accounts.
3. Copy the Client Email from the service account details.

### Open AI Chat GPT usage

#### OPENAI_API_KEY
1. Go to OpenAI Platform.
2. Click `API` > Create New Secret Key.
3. Copy the generated API Key.

### Trello usage

#### TRELLO_API_KEY & TRELLO_TOKEN
1. Go to `https://trello.com/power-ups/admin`.
2. Create a Power-Up and generate the API Key and API Secret.

#### TRELLO_MANAGEMENT_BOARD_ID
1. Go to Trello and create a board.
3. Copy the Board ID from the URL.

### Slack usage

#### CHANNEL_ID
1. Open Slack and create a channel.
3. Copy the Channel ID from the URL.