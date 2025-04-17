import { sendWeeklyMessageHandler } from "src/functions/meta-assistant/send-weekly-message/handler";
import { sendDailyMessageHandler } from "src/functions/meta-assistant/send-daily-message/handler";
import TestHelpers from "./utilities/test-utils";
import { forecastMockError, forecastMockNonProjectTimes, forecastMockTimeRegistrations } from "./__mocks__/forecastMocks";
import { personsErrorMock, dailyEntryErrorMock, personTotalTimeErrorMock, personMock1, personsMock, dailyEntryMock1, dailyEntryMock2, dailyEntryMock3, personTotalTimeMock1, personTotalTimeMock2, personTotalTimeMock3, personTotalTimeMock4 } from "./__mocks__/timebankMocks";
import { slackPostErrorMock, slackPostMock, slackUserMock, slackUserErrorMock } from "./__mocks__/slackMocks";
jest.mock("node-fetch");
const consoleSpy = jest.spyOn(console, "error");
beforeEach(() => {
    jest.resetAllMocks();
});
describe("timebank api get time entries error response", () => {
    it("should respond with corresponding error response", async () => {
        TestHelpers.mockTimebankPersons(200, [personMock1]);
        TestHelpers.mockTimebankDailyEntries(dailyEntryErrorMock.status, dailyEntryErrorMock.message);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageData = await sendDailyMessageHandler();
        expect(messageData).toBeDefined();
        expect(consoleSpy).toHaveBeenCalledWith("Error: Error while loading DailyEntries for person 1 from Timebank");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
});
describe("forecast api time registrations error response", () => {
    it("should respond with corresponding error response", async () => {
        TestHelpers.mockTimebankPersons(200, personsMock);
        TestHelpers.mockTimebankDailyEntries(200, [dailyEntryMock1, dailyEntryMock2, dailyEntryMock3]);
        TestHelpers.mockForecastResponse(401, forecastMockError, true);
        TestHelpers.mockForecastResponse(200, [forecastMockNonProjectTimes], false);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageData = await sendDailyMessageHandler();
        expect(messageData).toBeDefined();
        expect(consoleSpy).toHaveBeenLastCalledWith("Error: Error while loading time registrations, Server failed to authenticate the request.");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
});
describe("forecast api non project time error response", () => {
    it("should respond with corresponding error response", async () => {
        TestHelpers.mockTimebankPersons(200, personsMock);
        TestHelpers.mockTimebankDailyEntries(200, [dailyEntryMock1, dailyEntryMock2, dailyEntryMock3]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations], true);
        TestHelpers.mockForecastResponse(401, forecastMockError, false);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageData = await sendDailyMessageHandler();
        expect(messageData).toBeDefined();
        expect(consoleSpy).toHaveBeenCalledWith("Error: Error while loading non project times, Server failed to authenticate the request.");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
});
describe("timebank api get total time entries error response", () => {
    it("should respond with corresponding error response when no entries", async () => {
        TestHelpers.mockTimebankPersons(200, [personMock1]);
        TestHelpers.mockTimebankPersonTotalTimes(personTotalTimeErrorMock.status, personTotalTimeErrorMock.message);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageData = await sendWeeklyMessageHandler();
        expect(messageData).toBeDefined();
        expect(consoleSpy).toHaveBeenCalledWith("Error: Error while loading PersonTotalTimes for person 1 from Timebank");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
    it("should respond with corresponding error response when double entries", async () => {
        TestHelpers.mockTimebankPersons(200, [personMock1]);
        TestHelpers.mockTimebankPersonTotalTimes(200, [personTotalTimeMock4]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockTimeRegistrations], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        await sendWeeklyMessageHandler();
        expect(consoleSpy).toHaveBeenCalledWith("Error: Found more than one PersonTotalTime for given year and week");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
});
describe("timebank api get users error response", () => {
    it("should respond with corresponding error response", async () => {
        TestHelpers.mockTimebankPersons(personsErrorMock.status, personsErrorMock.message);
        TestHelpers.mockTimebankPersonTotalTimes(200, [personTotalTimeMock1, personTotalTimeMock2, personTotalTimeMock3]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageData = await sendDailyMessageHandler();
        expect(messageData).toBeDefined();
        expect(consoleSpy).toHaveBeenCalledWith("Error: Error while loading Persons from Timebank");
    });
    it("should respond with corresponding error response when no Persons found when sending weekly", async () => {
        TestHelpers.mockTimebankPersons(personsErrorMock.status, personsErrorMock.message);
        TestHelpers.mockTimebankPersonTotalTimes(personTotalTimeErrorMock.status, personTotalTimeErrorMock.message);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        await sendWeeklyMessageHandler();
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "Error: Error while loading Persons from Timebank");
        expect(consoleSpy).toHaveBeenNthCalledWith(2, "Error: No persons retrieved from Timebank");
        expect(consoleSpy).toHaveBeenCalledTimes(2);
    });
});
describe("Slack API error handling in daily message handler", () => {
    it("should return expected error handling for slack API get user endpoint", async () => {
        TestHelpers.mockTimebankPersons(200, personsMock);
        TestHelpers.mockTimebankDailyEntries(200, [dailyEntryMock1, dailyEntryMock2, dailyEntryMock3]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserErrorMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageData = await sendDailyMessageHandler();
        expect(messageData).toBeDefined();
        expect(messageData.message).toMatch("Error while sending slack message:");
        expect(messageData.message).toMatch(slackUserErrorMock.error);
        expect(consoleSpy).toHaveBeenCalledWith("Error: Error while loading slack users list, invalid_cursor");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
    it("should return expected error handling for slack API postmessage endpoint", async () => {
        TestHelpers.mockTimebankPersons(200, personsMock);
        TestHelpers.mockTimebankDailyEntries(200, [dailyEntryMock1, dailyEntryMock2, dailyEntryMock3]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostErrorMock);
        const messageData = await sendDailyMessageHandler();
        expect(messageData).toBeDefined();
        expect(messageData.message).toMatch("Everything went well sending the daily, see data for message breakdown...");
        expect(consoleSpy).toHaveBeenCalledWith("Error while posting slack messages, too_many_attachments\n");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
});
describe("Slack API error handling in weekly message handler", () => {
    it("should return expected error handling for slack API get user endpoint", async () => {
        TestHelpers.mockTimebankPersons(200, personsMock);
        TestHelpers.mockTimebankDailyEntries(200, [dailyEntryMock1, dailyEntryMock2, dailyEntryMock3]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserErrorMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageData = await sendWeeklyMessageHandler();
        expect(messageData).toBeDefined();
        expect(messageData.message).toMatch("Error while sending slack message:");
        expect(messageData.message).toMatch(slackUserErrorMock.error);
        expect(consoleSpy).toHaveBeenCalledWith("Error: Error while loading slack users list, invalid_cursor");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
    it("should return expected error handling for slack API postmessage endpoint", async () => {
        TestHelpers.mockTimebankPersons(200, personsMock);
        TestHelpers.mockTimebankPersonTotalTimes(200, [personTotalTimeMock1, personTotalTimeMock2, personTotalTimeMock3]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostErrorMock);
        const messageData = await sendWeeklyMessageHandler();
        expect(messageData).toBeDefined();
        expect(messageData.message).toMatch("Everything went well sending the weekly, see data for message breakdown...");
        expect(consoleSpy).toHaveBeenCalledWith("Error while posting slack messages, too_many_attachments\ntoo_many_attachments\n");
        expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=errors.test.js.map