import { DateRange } from "src/types";

export namespace FilterUtilities {
  /**
   * Does various checks to see if currentDate or specified date is between Forecast dates
   * 
   * @param dateRange Date range from forecast
   * @param currentDate Current date
   * @param parameters Dates to compare
   * @returns If specified dates were null or not, if specified date parameters were between Forecast dates or if currentDate is between Forecast dates
   */
  export const filterByDate = (dateRange: DateRange, currentDate: Date, parameters: { startDate?: Date, endDate?: Date }): boolean => {
    if (dateRange.startDate === null || dateRange.endDate === null) {
      return false;
    }

    if (parameters.startDate) {
      if (parameters.startDate <= new Date(dateRange.startDate)) {
        return false;
      }
    } else if (currentDate <= new Date(dateRange.startDate)) {
      return false;
    }

    if (parameters.endDate) {
        if (parameters.endDate >= new Date(dateRange.endDate)) {
          return false;
        }
    } else if (currentDate >= new Date(dateRange.endDate)) {
      return false;
    }

    return true;
  }

  /**
   * Compares Forecast project id to specified id
   * 
   * @param project Project id from Forecast
   * @param projectId Project id to compare
   * @returns 
   */
  export const filterByProject = (project?: number, projectId?: string): boolean => {
    if (projectId !== undefined && project?.toString() !== projectId) {
      return false;
    }

    return true;
  }

  /**
   * Compares Forecast person id to specified id
   * 
   * @param person Person id from Forecast
   * @param personId Person id to compare
   * @returns If two parameters match or personId is null
   */
  export const filterByPerson = (person?: number, personId?: number): boolean => {
    if (personId !== undefined && person !== personId) {
      return false;
    }
    return true;
  }
}