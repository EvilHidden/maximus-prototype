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
  const saveMeasurements = useCallback((mode: "draft" | "saved", title: string) => {
    dispatch({ type: "saveMeasurementSet", payload: { mode, title } });
  }, [dispatch]);

  const createDraftMeasurements = useCallback(() => {
    dispatch({ type: "createDraftMeasurementSet" });
  }, [dispatch]);

  const deleteMeasurementSet = useCallback((measurementSetId: string) => {
    dispatch({ type: "deleteMeasurementSet", measurementSetId });
  }, [dispatch]);

  return {
    measurementSets,
    saveMeasurements,
    createDraftMeasurements,
    deleteMeasurementSet,
  };
}
