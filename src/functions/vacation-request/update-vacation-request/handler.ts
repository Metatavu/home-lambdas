import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { vacationRequestService } from "src/database/services";
import type VacationRequestModel from "src/database/models/vacationRequest";
import type vacationRequestSchema from "src/schema/vacationRequest";

/**
 * Lambda function to update a vacation request
 *
 * @param event event
 */
const updateVacationRequestHandler: ValidatedEventAPIGatewayProxyEvent<typeof vacationRequestSchema> = async event => {
  const { pathParameters, body } = event;
  const id = pathParameters?.id;
  const {
    personId,
    draft,
    startDate,
    endDate,
    days,
    type,
    message,
    createdBy,
    createdAt,
    updatedAt,
    updatedBy,
  } = body;

  if (!id) {
    return {
      statusCode: 400,
      body: "Bad request, missing id"
    };
  }

  if(!personId || !draft || !startDate || !endDate || !days || !type || !message || !createdBy || !createdAt || !updatedAt || !updatedBy) {
    return {
      statusCode: 400,
      body: "Invalid body"
    }
  }

  const existingVacationRequest = await vacationRequestService.findVacationRequest(id);
  if (!existingVacationRequest) {
    return {
      statusCode: 404,
      body: `Vacation request ${id} not found`
    };
  }

  const vacationRequestUpdates: VacationRequestModel = {
    id: existingVacationRequest.id,
    personId: personId,
    draft: draft ? draft : false,
    startDate: startDate,
    endDate: endDate,
    days: days,
    type: type,
    message: message,
    createdBy: existingVacationRequest.createdBy,
    createdAt: existingVacationRequest.createdAt,
    updatedAt: updatedAt,
    updatedBy: updatedBy
  };

  try {
    const updatedVacationRequest = await vacationRequestService.updateVacationRequest(vacationRequestUpdates);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedVacationRequest)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error updating vacation request record with id ${id}, ${error}`
    };
  }
};

export const main = middyfy(updateVacationRequestHandler);