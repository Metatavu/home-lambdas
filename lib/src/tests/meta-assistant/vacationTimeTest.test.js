import { DateTime } from "luxon";
import TimeUtilities from "src/meta-assistant/generic/time-utils";
import { forecastMockNonProjectTimes, forecastMockTimeRegistrations } from "./__mocks__/forecastMocks";
beforeEach(() => {
    jest.clearAllMocks();
});
const today = DateTime.now().toISODate();
describe("vacation time tests", () => {
    it("not on vacation, should return false", () => {
        const fakePersonId = 3;
        const fakeExpected = 433;
        const result = TimeUtilities.checkIfUserShouldRecieveMessage(forecastMockTimeRegistrations, fakePersonId, fakeExpected, today, forecastMockNonProjectTimes);
        expect(result).toBe(false);
    });
    it("on vacation, should return true", () => {
        const fakePersonId = 124;
        const fakeExpected = 100;
        const result = TimeUtilities.checkIfUserShouldRecieveMessage(forecastMockTimeRegistrations, fakePersonId, fakeExpected, today, forecastMockNonProjectTimes);
        expect(result).toBe(true);
    });
    it("should throw an error if no non project times", () => {
        const fakeProjectTimes = undefined;
        const fakePersonId1 = 124;
        const fakeExpected = 100;
        expect(() => TimeUtilities.checkIfUserShouldRecieveMessage(forecastMockTimeRegistrations, fakePersonId1, fakeExpected, today, fakeProjectTimes)).toThrow(TypeError);
    });
    it("should return false if no person id, expected and date", () => {
        const fakePersonId1 = undefined;
        const fakeExpected = undefined;
        const fakeDate = undefined;
        const result = TimeUtilities.checkIfUserShouldRecieveMessage(forecastMockTimeRegistrations, fakePersonId1, fakeExpected, fakeDate, forecastMockNonProjectTimes);
        expect(result).toBe(false);
    });
    it("should throw an error if no time registrations", () => {
        const fakeTimeRegistrations = null;
        const fakePersonId1 = 1;
        const fakeExpected = 435;
        expect(() => TimeUtilities.checkIfUserShouldRecieveMessage(fakeTimeRegistrations, fakePersonId1, fakeExpected, today, forecastMockNonProjectTimes)).toThrow(TypeError);
    });
    it("should return false", () => {
        const fakePersonId1 = NaN;
        const fakeExpected = NaN;
        const fakeDate = null;
        const result = TimeUtilities.checkIfUserShouldRecieveMessage(forecastMockTimeRegistrations, fakePersonId1, fakeExpected, fakeDate, forecastMockNonProjectTimes);
        expect(result).toBe(false);
    });
});
//# sourceMappingURL=vacationTimeTest.test.js.map