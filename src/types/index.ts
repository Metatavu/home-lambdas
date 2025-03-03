/**
 * Date range type
 */
export type DateRange = {
    start_date: string,
    end_date: string
};

/**
 * Application configuration
 */
export interface Configuration {
    auth: {
        issuer: string;
    },
    onCall: {
        bucketName: string;
    },
    pipedriveApi: {
        apiKey: string,
        apiUrl: string
    },
    splunkApi: {
        apiKey: string
        apiId: string,
        teamOnCallUrl: string,
        schedulePolicyName: string
    }
    testUser: {
        email: string,
        id: string
    }
}