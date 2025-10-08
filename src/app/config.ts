import { cleanEnv, str, port } from "envalid";
import { Configuration } from "src/types";

const env = cleanEnv(process.env, {
  AUTH_ISSUER: str(),
  SPLUNK_API_KEY: str(),
  SPLUNK_API_ID: str(),
  SPLUNK_TEAM_ONCALL_URL: str(),
  SPLUNK_SCHEDULE_POLICY_NAME : str(),
  SEVERA_TEST_USER_EMAIL: str({ default: undefined }),
  MAILGUN_PORT: port(),
  MAILGUN_SMTP_HOST: str(),
  MAILGUN_SMTP_USER: str(),
  MAILGUN_SMTP_PASSWORD: str(),
  ADMIN_EMAILS: str({ default: undefined }), 
  METATAVU_BOT_TOKEN: str(),       
  ADMIN_SLACK_USERS: str({ default: undefined }),  
  HOME_BASE_URL: str({ default: "http://localhost:5173" })
});

export default class Config {

  /**
   * Get static application configuration
   *
   * @returns promise of static application configuration
   */
  public static get = (): Configuration => ({
    auth: {
      issuer: env.AUTH_ISSUER
    },
    splunkApi : {
      apiKey: env.SPLUNK_API_KEY,
      apiId: env.SPLUNK_API_ID,
      teamOnCallUrl: env.SPLUNK_TEAM_ONCALL_URL,
      schedulePolicyName: env.SPLUNK_SCHEDULE_POLICY_NAME
    },
    testUser: {
      email: env.SEVERA_TEST_USER_EMAIL,
    },
    email: {
      mailgunPort: env.MAILGUN_PORT,
      mailgunSmtpHost: env.MAILGUN_SMTP_HOST,
      mailgunSmtpUser: env.MAILGUN_SMTP_USER,
      mailgunSmtpPassword: env.MAILGUN_SMTP_PASSWORD,
      adminEmails: env.ADMIN_EMAILS ? env.ADMIN_EMAILS.split(",") : [],
    },
    slack: {
      botToken: env.METATAVU_BOT_TOKEN,
      adminUsers: env.ADMIN_SLACK_USERS ? env.ADMIN_SLACK_USERS.split(",") : [],
    },
    homeBaseUrl: env.HOME_BASE_URL || "http://localhost:5173",
  });
}