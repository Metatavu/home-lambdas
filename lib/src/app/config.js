import { cleanEnv, str } from "envalid";
const env = cleanEnv(process.env, {
    AUTH_ISSUER: str(),
    ON_CALL_BUCKET_NAME: str(),
    PIPEDRIVE_API_KEY: str(),
    PIPEDRIVE_API_URL: str(),
    SPLUNK_API_KEY: str(),
    SPLUNK_API_ID: str(),
    SPLUNK_TEAM_ONCALL_URL: str(),
    SPLUNK_SCHEDULE_POLICY_NAME: str(),
    SEVERA_TEST_USER_EMAIL: str(),
    SEVERA_TEST_USER_ID: str(),
});
export default class Config {
}
Config.get = () => ({
    auth: {
        issuer: env.AUTH_ISSUER
    },
    onCall: {
        bucketName: env.ON_CALL_BUCKET_NAME
    },
    pipedriveApi: {
        apiKey: env.PIPEDRIVE_API_KEY,
        apiUrl: env.PIPEDRIVE_API_URL
    },
    splunkApi: {
        apiKey: env.SPLUNK_API_KEY,
        apiId: env.SPLUNK_API_ID,
        teamOnCallUrl: env.SPLUNK_TEAM_ONCALL_URL,
        schedulePolicyName: env.SPLUNK_SCHEDULE_POLICY_NAME
    },
    testUser: {
        email: env.SEVERA_TEST_USER_EMAIL,
        id: env.SEVERA_TEST_USER_ID,
    }
});
//# sourceMappingURL=config.js.map