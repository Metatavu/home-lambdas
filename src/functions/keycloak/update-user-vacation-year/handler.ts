import { DateTime } from "luxon";
import { CreateKeycloakApiService } from "src/services/keycloak-api-service";

const updateUserVacationYearHandler = async () => {
  try {
    const keycloakApiService = CreateKeycloakApiService();
    const today = DateTime.now();
    const toChange = 0;
    let changed = 0;

    if (!today) {
      throw new Error("Could not resolve current date");
    }

    const vacationYear = today.month >= 4 ? String(today.year) : String(today.year - 1);

    const users = await keycloakApiService.getUsers();
    const usersToUpdate = users.filter(
      (user) => !user?.attributes?.vacationDaysByYear?.find((s) => s.startsWith(vacationYear))
    );

    if (!usersToUpdate) {
      return {
        statusCode: 406,
        body: JSON.stringify({ message: "No users mathcing criteria." })
      };
    }

    const updatedUsers = usersToUpdate.map((user) => ({
      id: user.id,
      total: [...(user.attributes?.vacationDaysByYear ?? []), `${vacationYear}:000`],
      unspent: [...(user.attributes?.unspentVacationDaysByYear ?? []), `${vacationYear}:000`]
    }));

    for (const user of updatedUsers) {
      await keycloakApiService.updateUserAttributes(user.id, {
        vacationDaysByYear: user.total,
        unspentVacationDaysByYear: user.unspent
      });
      changed++;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        processedUsers: toChange,
        createdEntries: changed
      })
    };
  } catch (err) {
    return {
      statuscode: 500,
      body: JSON.stringify({
        error: "Failed to update user vacation years",
        details: err instanceof Error ? err.message : String(err)
      })
    };
  }
};

export const main = updateUserVacationYearHandler;
