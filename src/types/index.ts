/**
 * Date range type
 */
export type DateRange = {
  start_date: string;
  end_date: string;
};

/**
 * Details of a vacation request.
 */
export interface VacationDetails {
  id: string;
  user: string;
  startDate: string;
  endDate: string;
  type?: string;
}

/**
 * Application configuration
 */
export interface Configuration {
  auth: {
    issuer: string;
  };
  splunkApi: {
    apiKey: string;
    apiId: string;
    teamOnCallUrl: string;
    schedulePolicyName: string;
  };
  testUser: {
    email: string;
  };
  email: {
    mailgunPort: number;
    mailgunSmtpHost: string;
    mailgunSmtpUser: string;
    mailgunSmtpPassword: string;
    adminEmails: string[];
  };
  slack: {
    botToken: string;
    adminUsers: string[];
    userOverride: string;
    channelId: string;
  };
  vacationDetails?: VacationDetails;
  homeBaseUrl: string;
  severa: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
  };
  homeBucket: {
    name: string;
    region: string;
  };
}
