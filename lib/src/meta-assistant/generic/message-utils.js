import TimeUtilities from "src/meta-assistant/generic/time-utils";
var MessageUtilities;
(function (MessageUtilities) {
    MessageUtilities.calculateWorkedTimeAndBillableHours = (user) => {
        const { totalLoggedTime, expectedHours, totalBillableTime } = user;
        const billableHoursPercentage = totalLoggedTime === 0 ? "0" : (totalBillableTime / totalLoggedTime * 100).toFixed(0);
        const totalOverTime = totalLoggedTime - expectedHours;
        const undertime = TimeUtilities.timeConversion(totalOverTime * -1);
        const overtime = TimeUtilities.timeConversion(totalOverTime);
        let message = "You worked the expected amount of time";
        if (totalOverTime > 0) {
            message = `Overtime: ${overtime}`;
        }
        if (totalOverTime < 0) {
            message = `Undertime: ${undertime}`;
        }
        return {
            message: message,
            billableHoursPercentage: billableHoursPercentage
        };
    };
})(MessageUtilities || (MessageUtilities = {}));
export default MessageUtilities;
//# sourceMappingURL=message-utils.js.map