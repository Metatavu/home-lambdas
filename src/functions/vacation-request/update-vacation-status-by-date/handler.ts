import type { APIGatewayProxyResult } from "aws-lambda";
import { DateTime } from "luxon";
import { vacationRequestService } from "src/database/services";
import { VacationRequestStatuses } from "src/generated/homeLambdasModels/model/vacationRequestStatuses";

/**
 * Updates vacation request statuses by date by replacing status array contents.
 */
const updateVacationStatusByDateHandler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const today = DateTime.now().toISODate();

    if (!today) {
      throw new Error("Could not resolve current date");
    }

    const vacations = await vacationRequestService.listVacationRequests(undefined, today);
    let ongoingUpdated = 0;
    let completedUpdated = 0;
    const errors: string[] = [];

    const results = await Promise.allSettled(
      vacations.map(async (vacation) => {
        // Get the latest status from the vacation request history
        const latestStatus = vacation.status?.at(-1)?.status;

        // A vacation request must always have at least one status entry
        if (!latestStatus) {
          throw new Error(
            `Vacation request ${vacation.id} has no status, cannot update status by date.`
          );
        }

        let nextStatus: VacationRequestStatuses = latestStatus;
        const parsedStartDate = DateTime.fromISO(vacation.startDate);
        const parsedEndDate = DateTime.fromISO(vacation.endDate);

        // Ensure both dates are valid before continuing
        if (!parsedStartDate.isValid || !parsedEndDate.isValid) {
          throw new Error(
            `Vacation request ${vacation.id} has invalid date values: startDate="${vacation.startDate}", endDate="${vacation.endDate}".`
          );
        }
        const startDate = parsedStartDate.toISODate();
        const endDate = parsedEndDate.toISODate();
        if (!startDate || !endDate) {
          throw new Error(
            `Vacation request ${vacation.id} could not be converted to ISO dates: startDate="${vacation.startDate}", endDate="${vacation.endDate}".`
          );
        }

        // Move from Approved to Ongoing when today's date falls
        // within the vacation period
        if (
          latestStatus === VacationRequestStatuses.Approved &&
          startDate <= today &&
          endDate >= today
        ) {
          nextStatus = VacationRequestStatuses.Ongoing;
        }

        // Move to Completed once the vacation end date has passed
        if (
          (latestStatus === VacationRequestStatuses.Approved ||
            latestStatus === VacationRequestStatuses.Ongoing) &&
          endDate < today
        ) {
          nextStatus = VacationRequestStatuses.Completed;
        }

        // Skip the update if the status remains unchanged
        if (latestStatus === nextStatus) return;
        const updatedAt = new Date();

        // Persist the new status as a system-generated status update
        await vacationRequestService.updateVacationRequest({
          ...vacation,
          status: [
            {
              status: nextStatus,
              createdBy: "system",
              updatedAt
            }
          ],
          updatedAt: updatedAt.toISOString()
        });

        return nextStatus;
      })
    );

    for (const result of results) {
      // Collect any errors from failed update operations
      if (result.status === "rejected") {
        errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
        // Count vacation requests that were transitioned to Ongoing
      } else if (result.value === VacationRequestStatuses.Ongoing) {
        ongoingUpdated += 1;
        // Count vacation requests that were transitioned to Completed
      } else if (result.value === VacationRequestStatuses.Completed) {
        completedUpdated += 1;
      }
    }

    return {
      statusCode: errors.length > 0 ? 207 : 200,
      body: JSON.stringify({
        processedVacations: ongoingUpdated + completedUpdated,
        ongoingUpdated,
        completedUpdated,
        ...(errors.length > 0 && { errors })
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to update vacation statuses by date",
        details: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

export const main = updateVacationStatusByDateHandler;
