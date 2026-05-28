import { appConfig } from "./config";
import { demoStore } from "./demo-store";
import { sqlServerStore } from "./sqlserver";

export const store = appConfig.useMockDb ? demoStore : sqlServerStore;
