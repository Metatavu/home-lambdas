import { sendDailyMessageHandler } from "../../functions/meta-assistant/send-daily-message/handler";
import TestHelpers from "./utilities/test-utils";
import { dailyEntryMock1, dailyEntryMock2, dailyEntryMock3, personsMock, personSpecialCharsMock } from "./__mocks__/timebankMocks";
import { slackUserMock, slackUserSpecialCharacterMock, slackPostMock } from "./__mocks__/slackMocks";
import { forecastMockNonProjectTimes, forecastMockTimeRegistrations } from "./__mocks__/forecastMocks";
jest.mock("node-fetch");
beforeEach(() => {
    jest.resetAllMocks();
});
describe("mock the daily handler", () => {
    describe("handler is mocked and run to send a message", () => {
        it("should return all expected message data", async () => {
            TestHelpers.mockTimebankPersons(200, personsMock);
            TestHelpers.mockTimebankDailyEntries(200, [dailyEntryMock1, dailyEntryMock2, dailyEntryMock3]);
            TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
            TestHelpers.mockSlackUsers(slackUserMock);
            TestHelpers.mockSlackPostMessage(slackPostMock);
            const messageBody = await sendDailyMessageHandler();
            const messageData = messageBody.data;
            const spy = jest.spyOn(TestHelpers, "validateDailyMessage");
            messageData.forEach(messageData => {
                TestHelpers.validateDailyMessage(messageData, slackUserMock.members);
            });
        });
    });
    describe("Daily vacation time test", () => {
        it("Should not return user who is on vacation", async () => {
            TestHelpers.mockTimebankPersons(200, personsMock);
            TestHelpers.mockTimebankDailyEntries(200, [dailyEntryMock1, dailyEntryMock2, dailyEntryMock3]);
            TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
            TestHelpers.mockSlackUsers(slackUserMock);
            TestHelpers.mockSlackPostMessage(slackPostMock);
            const messageData = await sendDailyMessageHandler();
            expect(messageData.data.length).toBe(1);
        });
    });
    describe("special character test", () => {
        it("should return expected data", async () => {
            TestHelpers.mockTimebankPersons(200, personSpecialCharsMock);
            TestHelpers.mockTimebankDailyEntries(200, [dailyEntryMock1, dailyEntryMock2, dailyEntryMock3]);
            TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations, forecastMockNonProjectTimes], true);
            TestHelpers.mockSlackUsers(slackUserSpecialCharacterMock);
            TestHelpers.mockSlackPostMessage(slackPostMock);
            const messageData = await sendDailyMessageHandler();
            expect(messageData).toBeDefined();
            expect(messageData.data[0].message.name).toBe("Ñöä!£ Çøæé");
        });
    });
});
//# sourceMappingURL=dailyHandler.test.js.map