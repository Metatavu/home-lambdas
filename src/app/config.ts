import { cleanEnv, str } from "envalid";
import { Configuration } from "../types/index";

const env = cleanEnv(process.env, {
    FORECAST_API_KEY: str()
});

export default class Config {

    /**
     * Get static application configuration
     *
     * @returns promise of static application configuration
     */
    public static get = (): Configuration => ({
      api: {
        apiKey: env.FORECAST_API_KEY
      }
    });
}