import ForecastApiUtilities from "../../meta-assistant/forecastapi/forecast-api";
import TestHelpers from "./utilities/test-utils";
import { forecastMockNonProjectTimes, forecastMockTimeRegistrations, forecastMockError } from "./__mocks__/forecastMocks";
import { DateTime } from "luxon";

jest.mock("node-fetch");

describe("forecast api tests", () => {
  describe("forecast getNonProjectTimes", () => {
    it("should return mocked data", async () => {
      TestHelpers.mockForecastResponse(200, [forecastMockNonProjectTimes], false);

      const results = await ForecastApiUtilities.getNonProjectTime();

      expect(results[0].id).toBe(123);
      expect(results[0].name).toBe("vacation");

      expect(results[1].id).toBe(456);
      expect(results[1].name).toBe("something");

      expect(results.length).toBe(2);
    });

    it("should throw error if no non project times", async () => {
      TestHelpers.mockForecastResponse(401, forecastMockError, false);

      const expectedError = new Error("Error while loading non project times, Server failed to authenticate the request.");

      try {
        await ForecastApiUtilities.getNonProjectTime();
      } catch(error) {
        expect(error).toEqual(expectedError);
      }
    });
  });

  describe("forecast api get time registrations", () => {
    it("should return mock data", async () => {
      TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations], false);

      const results = await ForecastApiUtilities.getTimeRegistrations(DateTime.fromISO("2022-04-22"));

      expect(results[0].person).toBe(1);
      expect(results[0].non_project_time).toBe(228255);
      expect(results[0].time_registered).toBe(435);

      expect(results[1].time_registered).toBe(433);
      expect(results[1].non_project_time).toBe(280335);

      expect(results[2].person).toBe(4);
      expect(results[2].non_project_time).toBe(123);
      expect(results[2].time_registered).toBe(433);

      expect(results.length).toBe(5);
    });

    it("should throw error if no time registrations", async () => {
      TestHelpers.mockForecastResponse(401, forecastMockError, false);

      const expectedError = new Error("Error while loading time registrations, Server failed to authenticate the request.");
      
      try {
        await ForecastApiUtilities.getTimeRegistrations(DateTime.fromISO("2022-04-22"));
      } catch(error) {
        expect(error).toEqual(expectedError);
      }
    });

    it("should throw error if missing date", async () => {
      TestHelpers.mockForecastResponse(200, [forecastMockTimeRegistrations], false);

      expect( async () => {
        await ForecastApiUtilities.getTimeRegistrations(null);
      }).rejects.toThrow(TypeError);
    });
  });
});