import type { DateRange } from "src/types";

export namespace FilterUtilities {
  /**
   * Does various checks to see if currentDate or specified date is between Severa dates
   * 
   * @param dateRange Date range from severa
   * @param currentDate Current date
   * @param parameters Dates to compare
   * @returns If specified dates were null or not, if specified date parameters were between Severa dates or if currentDate is between Severa dates
   */
  export const filterByDate = (dateRange: DateRange, currentDate: Date, parameters: { startDate?: Date, endDate?: Date }): boolean => {
    if (dateRange.start_date === null) {
      return false;
    }
    const startDate = new Date(dateRange.start_date);
    let endDate = new Date(dateRange.end_date);
    
    if (dateRange.end_date === null) endDate = currentDate;
    if (parameters.startDate && parameters.startDate < startDate) {
      return false;
    } else if (!parameters.startDate && currentDate <= startDate) {
      return false;
    }

    if (parameters.endDate && parameters.endDate > endDate) {
      return false;
    } else if (!parameters.endDate && currentDate > endDate) {
      return false;
    }
    return true;
  }

  /**
   * Compares Severa project id to specified id
   * 
   * @param project Project id from Severa
   * @param projectId Project id to compare
   *  
   */
  export const filterByProject = (project?: number, projectId?: string): boolean => {
    if (projectId !== undefined && project?.toString() !== projectId) {
      return false;
    }
    return true;
  }

  /**
   * Compares Severa person id to specified id
   * 
   * @param person Person id from Severa
   * @param personId Person id to compare
   * @returns If two parameters match or personId is null
   */
  export const filterByPerson = (person?: number, personId?: string) => {
    if (personId !== undefined && person.toString() !== personId) {
      return false;
    }
    return true;
  }

  /**
   * Compares severa User id to targetUser id
   * 
   * @param severaUserId User id from Severa
   * @param targetUserId User id to compare
   *  
   */
  export const filterByUserSevera = (severaUserId: string, targetUserId: string) => {
    if(severaUserId === null || targetUserId === null) {
      return false;
    }
    return targetUserId === severaUserId;
  }

  /**
   * Compares Severa task id to specified id
   * 
   * @param task Task id from Severa
   * @param taskId Task id to compare
   * @returns If two parameters match or task is null
   */
  export const filterByTask = (task?: number, taskId?: string) => {
    if (taskId && task?.toString() !== taskId || !task) return false;
    return true;
  }

  /**
   * Compares severa phase id to targetPhase id
   * 
   * @param severaPhaseId Phase id from Severa
   * @param targetPhaseId Phase id to compare
   *  
   */
  export const filterByPhaseSevera = (severaPhaseId: string, targetPhaseId: string) => {
    if(severaPhaseId === null || targetPhaseId === null) {
      return false;
    }
    return severaPhaseId === targetPhaseId;
  }
}