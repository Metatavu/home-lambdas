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

    const vacations = await vacationRequestService.listVacationRequests();
    let ongoingUpdated = 0;
    let completedUpdated = 0;
    const errors: string[] = [];

    const results = await Promise.allSettled(
      vacations.map(async (vacation) => {
        const latestStatus = vacation.status?.at(-1)?.status;

        if (!latestStatus) {
          throw new Error(
            `Vacation request ${vacation.id} has no status, cannot update status by date.`
          );
        }

        let nextStatus: VacationRequestStatuses = latestStatus;
        const parsedStartDate = DateTime.fromISO(vacation.startDate);
        const parsedEndDate = DateTime.fromISO(vacation.endDate);
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

        if (
          latestStatus === VacationRequestStatuses.Approved &&
          startDate <= today &&
          endDate >= today
        ) {
          nextStatus = VacationRequestStatuses.Ongoing;
        }

        if (
          (latestStatus === VacationRequestStatuses.Approved ||
            latestStatus === VacationRequestStatuses.Ongoing) &&
          endDate < today
        ) {
          nextStatus = VacationRequestStatuses.Completed;
        }

        if (latestStatus === nextStatus) return;
        const updatedAt = new Date();
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
      if (result.status === "rejected") {
        errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      } else if (result.value === VacationRequestStatuses.Ongoing) {
        ongoingUpdated += 1;
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
