import { createReferenceData, type AppReferenceData } from "./referenceData";
import { createPrototypeDatabase } from "./runtime";
import type { PrototypeDatabase } from "./schema";

export type AppRuntime = {
  database: PrototypeDatabase;
  referenceData: AppReferenceData;
};

export function createAppRuntime(referenceDate = new Date()): AppRuntime {
  const database = createPrototypeDatabase(referenceDate);

  return {
    database,
    referenceData: createReferenceData(database),
  };
}
