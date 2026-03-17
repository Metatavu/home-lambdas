import { DateTime } from "luxon";
import TimeUtilities from "src/meta-assistant/generic/time-utils";
import {
  expectedResults,
  forecastMockVacationTypes,
  mockNonProjectTimes
} from "./__mocks__/forecastMocks";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Expected time left test, including different non project time types", () => {
  const fakeStartDate = DateTime.fromISO("2024-03-18");
  const fakeEndDate = DateTime.fromISO("2024-03-21");

  describe.each(expectedResults)("Check vacation calculations", (fakePersonId, expectedResult) => {
    it(`Should return proper exact time for person ID ${fakePersonId}`, () => {
      const result = TimeUtilities.checkIfVacationCaseExists(
        fakePersonId,
        forecastMockVacationTypes,
        mockNonProjectTimes,
        fakeStartDate,
        fakeEndDate
      );

      expect(result).toBe(expectedResult);
    });
  });
});
