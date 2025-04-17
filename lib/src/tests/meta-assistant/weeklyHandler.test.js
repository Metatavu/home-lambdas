import { sendWeeklyMessageHandler } from "src/functions/meta-assistant/send-weekly-message/handler";
import TestHelpers from "./utilities/test-utils";
import { slackPostMock, slackUserMock } from "./__mocks__/slackMocks";
import { personsMock, personTotalTimeMock1, personTotalTimeMock2, personTotalTimeMock3 } from "./__mocks__/timebankMocks";
import { forecastMockNonProjectTimes, forecastMockTimeRegistrations } from "./__mocks__/forecastMocks";
jest.mock("node-fetch");
describe("mock the weekly handler", () => {
    it("should return all expected message data", async () => {
        TestHelpers.mockTimebankPersons(200, personsMock);
        TestHelpers.mockTimebankPersonTotalTimes(200, [personTotalTimeMock1, personTotalTimeMock2, personTotalTimeMock3]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageBody = await sendWeeklyMessageHandler();
        const messageData = messageBody.data;
        const spy = jest.spyOn(TestHelpers, "validateWeeklyMessage");
        messageData.forEach(messageData => {
            TestHelpers.validateWeeklyMessage(messageData, slackUserMock.members);
        });
        expect(spy).toHaveBeenCalledTimes(2);
    });
});
describe("Weekly vacation time test", () => {
    it("Should not return user who is on vacation", async () => {
        TestHelpers.mockTimebankPersons(200, personsMock);
        TestHelpers.mockTimebankPersonTotalTimes(200, [personTotalTimeMock1, personTotalTimeMock2, personTotalTimeMock3]);
        TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
        TestHelpers.mockSlackUsers(slackUserMock);
        TestHelpers.mockSlackPostMessage(slackPostMock);
        const messageData = await sendWeeklyMessageHandler();
        expect(messageData.data.length).toBe(2);
    });
});
//# sourceMappingURL=weeklyHandler.test.js.map