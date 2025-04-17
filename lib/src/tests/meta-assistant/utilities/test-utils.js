import { IncomingMessage } from "http";
import { Socket } from "net";
import TimeBankApiProvider from "src/meta-assistant/timebank/timebank-api";
import slackUtilities from "src/meta-assistant/slack/slack-utils";
import fetch from "node-fetch";
import * as KeycloakMock from "keycloak-mock";
var TestHelpers;
(function (TestHelpers) {
    const personsClient = TimeBankApiProvider.personsClient;
    const dailyEntriesClient = TimeBankApiProvider.dailyEntriesClient;
    const slackUsersClient = slackUtilities.client;
    const { Response } = jest.requireActual("node-fetch");
    const mockedFetch = {
        fetch: fetch
    };
    const createIncomingMessage = (status, body) => {
        let message = new IncomingMessage(new Socket);
        message.statusCode = status;
        return {
            response: message,
            body: body
        };
    };
    const createResponse = (status, body) => {
        return new Response(JSON.stringify(body), { status: status });
    };
    const mockKeycloak = async () => {
        const keycloak = await KeycloakMock.createMockInstance({
            authServerURL: "http://localhost:8080",
            realm: "quarkus",
            clientID: "meta-assistant",
            clientSecret: "zoxruqJ6bBYptkJwewhu9bqmkgwxatzS"
        });
        const mock = KeycloakMock.activateMock(keycloak);
        keycloak.database.createUser({
            firstName: "test",
            email: "test@test.test",
            credentials: [{
                    value: "password"
                }]
        });
        KeycloakMock.deactivateMock(mock);
        return keycloak;
    };
    TestHelpers.mockAccessToken = async () => {
        const keycloak = await mockKeycloak();
        const user = keycloak.database.allUsers();
        return new Response(JSON.stringify({ access_token: keycloak.createBearerToken(user[0].profile.id) }));
    };
    TestHelpers.mockTimebankDailyEntries = (statusCode, body) => {
        const dailyEntriesSpy = jest.spyOn(dailyEntriesClient, "listDailyEntries");
        if (statusCode !== 200) {
            dailyEntriesSpy.mockReturnValueOnce(createIncomingMessage(statusCode, body));
        }
        for (let i = 0; i < body.length; i++) {
            dailyEntriesSpy.mockReturnValueOnce(createIncomingMessage(statusCode, body[i]));
        }
    };
    TestHelpers.mockTimebankPersons = (statusCode, body) => {
        jest.spyOn(personsClient, "listPersons")
            .mockReturnValueOnce(createIncomingMessage(statusCode, body));
    };
    TestHelpers.mockTimebankPersonTotalTimes = (statusCode, body) => {
        const personTotalTimesSpy = jest.spyOn(personsClient, "listPersonTotalTime");
        for (let i = 0; i < body.length; i++) {
            personTotalTimesSpy.mockReturnValueOnce(createIncomingMessage(statusCode, body[i]));
        }
    };
    TestHelpers.mockForecastResponse = (statusCode, body, keycloakMock) => {
        const fetchSpy = jest.spyOn(mockedFetch, "fetch");
        if (keycloakMock) {
            fetchSpy.mockReturnValueOnce(TestHelpers.mockAccessToken());
        }
        if (statusCode !== 200) {
            fetchSpy.mockReturnValueOnce(createResponse(statusCode, body));
        }
        for (let i = 0; i < body.length; i++) {
            fetchSpy.mockReturnValueOnce(createResponse(statusCode, body[i]));
        }
    };
    TestHelpers.mockSlackUsers = (mockData) => {
        jest.spyOn(slackUsersClient.users, "list").mockReturnValueOnce(Promise.resolve(mockData));
    };
    TestHelpers.mockSlackPostMessage = (mockData) => {
        jest.spyOn(slackUsersClient.chat, "postMessage").mockImplementation(() => Promise.resolve(mockData));
    };
    TestHelpers.validateDailyMessage = (data, slackUsers) => {
        const { message, name, displayDate, billableHoursPercentage, displayExpected, displayInternal, displayLogged, displayBillableProject } = data.message;
        const slackNameMatches = slackUsers.find(user => user.real_name === name);
        const date = new Date(displayDate);
        expect(message).toBeDefined();
        expect(typeof message).toEqual(typeof "string");
        expect(name).toBeDefined();
        expect(displayDate).toBeDefined();
        expect(billableHoursPercentage).toBeDefined();
        expect(displayExpected).toBeDefined();
        expect(displayInternal).toBeDefined();
        expect(displayLogged).toBeDefined();
        expect(displayBillableProject).toBeDefined();
        expect(slackNameMatches).toBeDefined();
    };
    TestHelpers.validateWeeklyMessage = (data, slackUsers) => {
        const { message, name, endDate, startDate, week, billableHoursPercentage, displayExpected, displayInternal, displayLogged, displayBillableProject } = data.message;
        const slackNameMatches = slackUsers.find(user => user.real_name === name);
        expect(message).toBeDefined();
        expect(typeof message).toEqual(typeof "string");
        expect(name).toBeDefined();
        expect(endDate).toBeDefined();
        expect(startDate).toBeDefined();
        expect(week).toBeDefined();
        expect(billableHoursPercentage).toBeDefined();
        expect(displayExpected).toBeDefined();
        expect(displayInternal).toBeDefined();
        expect(displayLogged).toBeDefined();
        expect(displayBillableProject).toBeDefined();
        expect(slackNameMatches).toBeDefined();
    };
})(TestHelpers || (TestHelpers = {}));
export default TestHelpers;
//# sourceMappingURL=test-utils.js.map