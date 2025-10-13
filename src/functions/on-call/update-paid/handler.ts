import { UpdatePaidRequestBody } from "../../../types/on-call"
import { middyfy } from "@libs/lambda";
import { ValidatedEventAPIGatewayProxyEvent } from "src/libs/api-gateway";
import { onCallScheduleService } from "src/database/services";

/**
 * Lambda method for updating paid data
 * 
 * @param event event
 */
export const onCallUpdatePaidHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const { year, week, paid } = event.body as UpdatePaidRequestBody;

  if (!year || year < 2020 || year > new Date().getFullYear()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ code: 0, message: "Invalid year" }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  if (!week || week < 1 || week > 53) {
    return {
      statusCode: 400,
      body: JSON.stringify({ code: 0, message: "Invalid week" }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  if (paid === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({ code: 0, message: "Invalid paid status" }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }

  try {
    await onCallScheduleService.updatePaidStatus(year, week, paid);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Paid status updated" }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    return {
      statusCode: 404,
      body: JSON.stringify({ code: 0, message: error.message || "Error updating paid status" }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};

export const main = middyfy(onCallUpdatePaidHandler);