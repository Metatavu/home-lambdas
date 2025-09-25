/**
 * Date range type
 */
export type DateRange = {
    start_date: string,
    end_date: string
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
    },
    splunkApi: {
        apiKey: string
        apiId: string,
        teamOnCallUrl: string,
        schedulePolicyName: string
    }
    testUser: {
        email: string
    }
    email: {                             
        mailgunUser: string;
        mailgunPassword: string;
        adminEmails: string[];
    }
    slack: {
        botToken: string;
        adminUsers: string[];
    }
    vacationDetails?: VacationDetails;
    homeBaseUrl: string;
}