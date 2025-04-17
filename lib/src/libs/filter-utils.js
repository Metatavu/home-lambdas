export var FilterUtilities;
(function (FilterUtilities) {
    FilterUtilities.filterByDate = (dateRange, currentDate, parameters) => {
        if (dateRange.start_date === null) {
            return false;
        }
        const startDate = new Date(dateRange.start_date);
        let endDate = new Date(dateRange.end_date);
        if (dateRange.end_date === null)
            endDate = currentDate;
        if (parameters.startDate && parameters.startDate < startDate) {
            return false;
        }
        else if (!parameters.startDate && currentDate <= startDate) {
            return false;
        }
        if (parameters.endDate && parameters.endDate > endDate) {
            return false;
        }
        else if (!parameters.endDate && currentDate > endDate) {
            return false;
        }
        return true;
    };
    FilterUtilities.filterByProject = (project, projectId) => {
        if (projectId !== undefined && project?.toString() !== projectId) {
            return false;
        }
        return true;
    };
    FilterUtilities.filterByPerson = (person, personId) => {
        if (personId !== undefined && person.toString() !== personId) {
            return false;
        }
        return true;
    };
    FilterUtilities.filterByUserSevera = (severaUserId, targetUserId) => {
        if (severaUserId === null || targetUserId === null) {
            return false;
        }
        return targetUserId === severaUserId;
    };
    FilterUtilities.filterByTask = (task, taskId) => {
        if (taskId && task?.toString() !== taskId || !task)
            return false;
        return true;
    };
    FilterUtilities.filterByPhaseSevera = (severaPhaseId, targetPhaseId) => {
        if (severaPhaseId === null || targetPhaseId === null) {
            return false;
        }
        return severaPhaseId === targetPhaseId;
    };
})(FilterUtilities || (FilterUtilities = {}));
//# sourceMappingURL=filter-utils.js.map