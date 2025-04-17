import { DateTime, Duration } from "luxon";
var TimeUtilities;
(function (TimeUtilities) {
    TimeUtilities.timeConversion = (duration) => {
        const dur = Duration.fromObject({ hours: duration });
        const time = dur.shiftTo("hours", "minutes");
        return time.toHuman();
    };
    TimeUtilities.getlastWeeksDates = (date) => {
        let startOfWeek = DateTime.now().startOf("week");
        if (date) {
            startOfWeek = date.startOf("week");
        }
        const weekStartDate = startOfWeek.minus({ weeks: 1 });
        const weekEndDate = startOfWeek.minus({ days: 1 });
        return { weekEndDate: weekEndDate, weekStartDate: weekStartDate };
    };
    TimeUtilities.handleTimeFormatting = (user) => {
        const { totalLoggedTime, expectedHours, projectTime, totalBillableTime, nonBillableProject } = user;
        const displayTotalLoggedTime = TimeUtilities.timeConversion(totalLoggedTime);
        const displayExpectedHours = TimeUtilities.timeConversion(expectedHours);
        const displayProjectTime = TimeUtilities.timeConversion(projectTime);
        const displayTotalBillableTime = TimeUtilities.timeConversion(totalBillableTime);
        const displayNonBillableProject = TimeUtilities.timeConversion(nonBillableProject);
        return {
            totalLoggedTime: displayTotalLoggedTime,
            expectedHours: displayExpectedHours,
            projectTime: displayProjectTime,
            totalBillableTime: displayTotalBillableTime,
            nonBillableProject: displayNonBillableProject
        };
    };
    TimeUtilities.checkIfVacationCaseExists = (personId, timeRegistrations, nonProjectTimes, startDate, endDate) => {
        let totalNonProjectTime = 0;
        timeRegistrations.forEach((registration) => {
            const { date, time_registered, non_project_time, person } = registration;
            if (personId === person && nonProjectTimes.map(nonProjectTime => nonProjectTime.id).includes(non_project_time)) {
                if (DateTime.fromISO(date) >= startDate && DateTime.fromISO(date) <= endDate) {
                    totalNonProjectTime += time_registered;
                }
            }
        });
        return totalNonProjectTime;
    };
    TimeUtilities.checkIfUserShouldRecieveMessage = (timeRegistrations, personId, expected, date, nonProjectTimes) => {
        const personsTimeRegistration = timeRegistrations.find(timeRegistration => timeRegistration.person === personId
            && timeRegistration.date === date
            && timeRegistration.time_registered === expected);
        if (!personsTimeRegistration) {
            return false;
        }
        return nonProjectTimes.map(nonProjectTime => nonProjectTime.id).includes(personsTimeRegistration.non_project_time);
    };
    TimeUtilities.getPreviousTwoWorkdays = () => {
        const today = DateTime.now();
        const dayOfWeek = new Date().getDay();
        let previousWorkDay = today.minus({ days: 1 });
        let dayBeforePreviousWorkDay = today.minus({ days: 2 });
        if (dayOfWeek === 1) {
            previousWorkDay = today.minus({ days: 3 });
            dayBeforePreviousWorkDay = today.minus({ days: 4 });
        }
        return {
            today: today,
            yesterday: previousWorkDay,
            numberOfToday: dayOfWeek,
            dayBeforeYesterday: dayBeforePreviousWorkDay
        };
    };
})(TimeUtilities || (TimeUtilities = {}));
export default TimeUtilities;
//# sourceMappingURL=time-utils.js.map