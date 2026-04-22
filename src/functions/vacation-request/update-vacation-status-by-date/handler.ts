import type { APIGatewayProxyResult } from "aws-lambda";
import { DateTime } from "luxon";
import { vacationRequestService } from "src/database/services";
import { VacationRequestStatuses } from "src/generated/homeLambdasModels/model/vacationRequestStatuses";
import { middyfy } from "src/libs/lambda";

/**
 * Updates vacation request statuses by date by replacing status array contents.
 */
const updateVacationStatusByDateHandler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const today = DateTime.now().toISODate();

    if (!today) {
      throw new Error("Could not resolve current date");
    }

    const vacations = await vacationRequestService.listVacationRequests();
    let ongoingUpdated = 0;
    let completedUpdated = 0;

    await Promise.allSettled(
      vacations.map(async (vacation) => {
        const latestStatus = vacation.status?.at(-1)?.status;

        if (latestStatus) {
          let nextStatus: VacationRequestStatuses = latestStatus;
          /**
           * If the latest status is Approved and the current date is between start and end date, set status to Ongoing.
           */
          if (
            latestStatus === VacationRequestStatuses.Approved &&
            vacation.startDate <= today &&
            vacation.endDate >= today
          ) {
            nextStatus = VacationRequestStatuses.Ongoing;
          }
          /**
           * If the latest status is Approved or Ongoing and the end date has passed, set status to Completed.
           */
          if (
            (latestStatus === VacationRequestStatuses.Approved ||
              latestStatus === VacationRequestStatuses.Ongoing) &&
            vacation.endDate < today
          ) {
            nextStatus = VacationRequestStatuses.Completed;
          }

          const isStatusChanged = latestStatus !== nextStatus;

          /**
           * If the status has changed, update the vacation request in the database and increment the appropriate counter
           */
          if (isStatusChanged) {
            const updatedVacation = {
              ...vacation,
              status: [
                {
                  status: nextStatus,
                  createdBy: "system",
                  updatedAt: new Date()
                }
              ],
              updatedAt: new Date().toISOString()
            };
            await vacationRequestService.updateVacationRequest(updatedVacation);

            if (nextStatus === VacationRequestStatuses.Ongoing) {
              ongoingUpdated += 1;
            } else if (nextStatus === VacationRequestStatuses.Completed) {
              completedUpdated += 1;
            }
          }
        } else
          throw new Error(
            `Vacation request with id ${vacation.id} has no status, cannot update status by date.`
          );
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        processedVacations: ongoingUpdated + completedUpdated,
        ongoingUpdated,
        completedUpdated
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

export const main = middyfy(updateVacationStatusByDateHandler);
