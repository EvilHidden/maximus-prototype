import { useEffect } from "react";
import type { Dispatch } from "react";
import type { MeasurementSet, OrderWorkflowState } from "../../../types";
import type { AppAction } from "../../../state/appState";
import { getSuggestedMeasurementSet } from "../selectors";

type UseCustomMeasurementDefaultsArgs = {
  measurementSets: MeasurementSet[];
  wearerCustomerId: string | null;
  order: OrderWorkflowState;
  dispatch: Dispatch<AppAction>;
};

export function useCustomMeasurementDefaults({
  measurementSets,
  wearerCustomerId,
  order,
  dispatch,
}: UseCustomMeasurementDefaultsArgs) {
  useEffect(() => {
    if (order.activeWorkflow !== "custom" || !wearerCustomerId || order.custom.draft.linkedMeasurementSetId) {
      return;
    }

    const hasAnyMeasurements = Object.values(order.custom.draft.measurements).some((value) => value.trim().length > 0);
    if (hasAnyMeasurements) {
      return;
    }

    const suggestedMeasurementSet = getSuggestedMeasurementSet(measurementSets, wearerCustomerId);
    if (!suggestedMeasurementSet) {
      return;
    }

    dispatch({
      type: "replaceMeasurements",
      values: suggestedMeasurementSet.values,
      measurementSetId: suggestedMeasurementSet.id,
    });
  }, [dispatch, measurementSets, order, wearerCustomerId]);
}
