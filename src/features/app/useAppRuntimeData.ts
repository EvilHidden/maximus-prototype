import { useMemo } from "react";
import { createAppRuntime } from "../../db";

export function useAppRuntimeData() {
  return useMemo(() => createAppRuntime(), []);
}
