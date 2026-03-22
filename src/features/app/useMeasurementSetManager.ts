import { useCallback, useState } from "react";
import {
  createDraftMeasurementSet,
  deleteMeasurementSetAndPreserveDraft,
  saveMeasurementSet,
} from "../measurements/service";
import type { AppAction, AppState } from "../../state/appState";
import type { Customer, MeasurementSet } from "../../types";

type UseMeasurementSetManagerArgs = {
  baseMeasurementSets: MeasurementSet[];
  selectedCustomer: Customer | null;
  linkedMeasurementSetId: string | null;
  measurements: AppState["order"]["custom"]["draft"]["measurements"];
  dispatch: React.Dispatch<AppAction>;
};

export function useMeasurementSetManager({
  baseMeasurementSets,
  selectedCustomer,
  linkedMeasurementSetId,
  measurements,
  dispatch,
}: UseMeasurementSetManagerArgs) {
  const [measurementSets, setMeasurementSets] = useState<MeasurementSet[]>(baseMeasurementSets);

  const saveMeasurements = useCallback((mode: "draft" | "saved", title: string) => {
    if (!selectedCustomer) {
      return;
    }

    const result = saveMeasurementSet(
      measurementSets,
      selectedCustomer,
      linkedMeasurementSetId,
      measurements,
      mode,
      title,
    );

    setMeasurementSets(result.measurementSets);
    dispatch({ type: "linkMeasurementSet", measurementSetId: result.linkedMeasurementSetId });
  }, [dispatch, linkedMeasurementSetId, measurementSets, measurements, selectedCustomer]);

  const createDraftMeasurements = useCallback(() => {
    const result = createDraftMeasurementSet(measurementSets, selectedCustomer);
    setMeasurementSets(result.measurementSets);
    dispatch({
      type: "replaceMeasurements",
      values: result.values,
      measurementSetId: result.linkedMeasurementSetId || null,
    });
  }, [dispatch, measurementSets, selectedCustomer]);

  const deleteMeasurementSet = useCallback((measurementSetId: string) => {
    const result = deleteMeasurementSetAndPreserveDraft(
      measurementSets,
      measurementSetId,
      linkedMeasurementSetId,
      selectedCustomer,
      measurements,
    );
    setMeasurementSets(result.measurementSets);
    dispatch({ type: "linkMeasurementSet", measurementSetId: result.linkedMeasurementSetId });
  }, [dispatch, linkedMeasurementSetId, measurementSets, measurements, selectedCustomer]);

  return {
    measurementSets,
    saveMeasurements,
    createDraftMeasurements,
    deleteMeasurementSet,
  };
}
