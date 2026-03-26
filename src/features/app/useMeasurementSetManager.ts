import { useCallback } from "react";
import type { AppAction } from "../../state/appState";
import type { MeasurementSet } from "../../types";

type UseMeasurementSetManagerArgs = {
  measurementSets: MeasurementSet[];
  dispatch: React.Dispatch<AppAction>;
};

export function useMeasurementSetManager({
  measurementSets,
  dispatch,
}: UseMeasurementSetManagerArgs) {
  const saveMeasurements = useCallback((mode: "update" | "copy", title?: string) => {
    dispatch({ type: "saveMeasurementSet", payload: { mode, title } });
  }, [dispatch]);

  const startNewMeasurementSet = useCallback(() => {
    dispatch({ type: "startNewMeasurementSet" });
  }, [dispatch]);

  const deleteMeasurementSet = useCallback((measurementSetId: string) => {
    dispatch({ type: "deleteMeasurementSet", measurementSetId });
  }, [dispatch]);

  return {
    measurementSets,
    saveMeasurements,
    startNewMeasurementSet,
    deleteMeasurementSet,
  };
}
