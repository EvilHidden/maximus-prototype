import { Plus, Settings2, ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { PrototypeDatabase } from "../db";
import type { AppAction } from "../state/appState";
import { ActionButton, Callout, FieldStack, SectionHeader, SelectField, Surface, SurfaceHeader } from "../components/ui/primitives";
import { getCustomPricingGarments, getSortedAlterationServices, getSortedCustomPricingTiers, getSortedLocations, getSortedMeasurementFields } from "../features/settings/selectors";

type SettingsScreenProps = {
  database: PrototypeDatabase;
  dispatch: React.Dispatch<AppAction>;
};

function NumberField({
  label,
  value,
  step = "0.01",
  min,
  onChange,
}: {
  label: string;
  value: number;
  step?: string;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <FieldStack label={label}>
      <div className="app-field-control">
        <input
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number.parseFloat(event.target.value || "0"))}
          className="app-text-body min-w-0 flex-1 p-0"
        />
      </div>
    </FieldStack>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldStack label={label}>
      <div className="app-field-control">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="app-text-body min-w-0 flex-1 p-0"
        />
      </div>
    </FieldStack>
  );
}

export function SettingsScreen({ database, dispatch }: SettingsScreenProps) {
  const measurementFields = useMemo(() => getSortedMeasurementFields(database), [database]);
  const alterationServices = useMemo(() => getSortedAlterationServices(database), [database]);
  const locations = useMemo(() => getSortedLocations(database), [database]);
  const customPricingTiers = useMemo(() => getSortedCustomPricingTiers(database), [database]);
  const customPricingGarments = useMemo(() => getCustomPricingGarments(database), [database]);
  const [newMeasurementLabel, setNewMeasurementLabel] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newService, setNewService] = useState({
    category: "",
    name: "",
    price: 0,
    supportsAdjustment: false,
    requiresAdjustment: false,
  });

  const measurementLabelCandidate = newMeasurementLabel.trim();
  const locationNameCandidate = newLocationName.trim();
  const serviceCanSubmit = Boolean(newService.category.trim() && newService.name.trim());

  return (
    <div className="space-y-3">
      <SectionHeader
        icon={Settings2}
        title="Settings"
        subtitle="Control the organization defaults and reference data that shape the workflow."
      />

      <div className="space-y-3.5">
        <Surface tone="support" className="p-4">
          <Callout
            tone="default"
            title="User preferences stay lightweight in this pass"
          >
            Theme stays in the shell controls for now. This first pass is focused on organization settings that affect measurements, pricing, services, and locations.
          </Callout>
        </Surface>

        <Surface tone="work" className="p-4">
          <SurfaceHeader
            title="Shop profile"
            subtitle="Basic organization defaults used across the app."
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="Organization name"
              value={database.organizationSettings.organizationName}
              onChange={(value) => dispatch({ type: "updateOrganizationSettings", payload: { organizationName: value } })}
            />
            <SelectField
              label="Default location"
              value={database.organizationSettings.defaultLocationId}
              onChange={(value) => dispatch({ type: "updateOrganizationSettings", payload: { defaultLocationId: value } })}
            >
              {locations.filter((location) => location.isActive).map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </SelectField>
            <NumberField
              label="Sales tax rate"
              value={database.organizationSettings.taxRate}
              step="0.0001"
              min={0}
              onChange={(value) => dispatch({ type: "updateOrganizationSettings", payload: { taxRate: value } })}
            />
            <NumberField
              label="Custom deposit rate"
              value={database.organizationSettings.customDepositRate}
              step="0.01"
              min={0}
              onChange={(value) => dispatch({ type: "updateOrganizationSettings", payload: { customDepositRate: value } })}
            />
          </div>
        </Surface>

        <Surface tone="work" className="p-4">
          <SurfaceHeader
            title="Measurements"
            subtitle="Set the field names, active list, and display order used for measurement capture."
          />
          <div className="mt-4 space-y-2.5">
            {measurementFields.map((field, index) => (
              <div key={field.id} className="grid gap-2 rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <TextField
                  label={`Field ${index + 1}`}
                  value={field.label}
                  onChange={(value) => dispatch({ type: "updateMeasurementField", payload: { fieldId: field.id, patch: { label: value } } })}
                />
                <div className="flex items-end gap-2">
                  <ActionButton tone="secondary" onClick={() => dispatch({ type: "moveMeasurementField", fieldId: field.id, direction: "up" })}>
                    <ArrowUp className="h-4 w-4" />
                    <span>Up</span>
                  </ActionButton>
                  <ActionButton tone="secondary" onClick={() => dispatch({ type: "moveMeasurementField", fieldId: field.id, direction: "down" })}>
                    <ArrowDown className="h-4 w-4" />
                    <span>Down</span>
                  </ActionButton>
                </div>
                <div className="flex items-end">
                  <label className="app-text-caption inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border)]/60 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={field.isActive}
                      onChange={(event) => dispatch({ type: "updateMeasurementField", payload: { fieldId: field.id, patch: { isActive: event.target.checked } } })}
                    />
                    <span>{field.isActive ? "Active" : "Inactive"}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
            <TextField label="Add measurement field" value={newMeasurementLabel} onChange={setNewMeasurementLabel} />
            <div className="flex items-end">
              <ActionButton
                disabled={!measurementLabelCandidate}
                disabledReason="Enter a measurement field name before adding it."
                onClick={() => {
                  dispatch({ type: "addMeasurementField", label: measurementLabelCandidate });
                  setNewMeasurementLabel("");
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Add field</span>
              </ActionButton>
            </div>
          </div>
        </Surface>

        <Surface tone="work" className="p-4">
          <SurfaceHeader
            title="Alteration services"
            subtitle="Manage service names, prices, categories, and adjustment rules."
          />
          <div className="mt-4 space-y-2.5">
            {alterationServices.map((service) => (
              <div key={service.id} className="grid gap-2 rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_auto_auto_auto]">
                <TextField
                  label="Category"
                  value={service.category}
                  onChange={(value) => dispatch({ type: "updateAlterationServiceDefinition", payload: { serviceId: service.id, patch: { category: value } } })}
                />
                <TextField
                  label="Service"
                  value={service.name}
                  onChange={(value) => dispatch({ type: "updateAlterationServiceDefinition", payload: { serviceId: service.id, patch: { name: value } } })}
                />
                <NumberField
                  label="Price"
                  value={service.price}
                  onChange={(value) => dispatch({ type: "updateAlterationServiceDefinition", payload: { serviceId: service.id, patch: { price: value } } })}
                />
                <label className="app-text-caption inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border)]/60 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={service.supportsAdjustment}
                    onChange={(event) => dispatch({
                      type: "updateAlterationServiceDefinition",
                      payload: { serviceId: service.id, patch: { supportsAdjustment: event.target.checked } },
                    })}
                  />
                  <span>Supports adj.</span>
                </label>
                <label className="app-text-caption inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border)]/60 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={service.requiresAdjustment}
                    onChange={(event) => dispatch({
                      type: "updateAlterationServiceDefinition",
                      payload: { serviceId: service.id, patch: { requiresAdjustment: event.target.checked } },
                    })}
                  />
                  <span>Requires adj.</span>
                </label>
                <label className="app-text-caption inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border)]/60 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={service.isActive}
                    onChange={(event) => dispatch({
                      type: "updateAlterationServiceDefinition",
                      payload: { serviceId: service.id, patch: { isActive: event.target.checked } },
                    })}
                  />
                  <span>{service.isActive ? "Active" : "Inactive"}</span>
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto]">
            <TextField
              label="New category"
              value={newService.category}
              onChange={(value) => setNewService((current) => ({ ...current, category: value }))}
            />
            <TextField
              label="New service"
              value={newService.name}
              onChange={(value) => setNewService((current) => ({ ...current, name: value }))}
            />
            <NumberField
              label="Price"
              value={newService.price}
              onChange={(value) => setNewService((current) => ({ ...current, price: value }))}
            />
            <div className="flex items-end">
              <ActionButton
                disabled={!serviceCanSubmit}
                disabledReason="Add both a category and service name before creating the service."
                onClick={() => {
                  dispatch({
                    type: "addAlterationServiceDefinition",
                    payload: {
                      ...newService,
                      category: newService.category.trim(),
                      name: newService.name.trim(),
                    },
                  });
                  setNewService({
                    category: "",
                    name: "",
                    price: 0,
                    supportsAdjustment: false,
                    requiresAdjustment: false,
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Add service</span>
              </ActionButton>
            </div>
          </div>
          <div className="mt-3 flex gap-4">
            <label className="app-text-caption inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={newService.supportsAdjustment}
                onChange={(event) => setNewService((current) => ({ ...current, supportsAdjustment: event.target.checked }))}
              />
              <span>Supports adjustment</span>
            </label>
            <label className="app-text-caption inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={newService.requiresAdjustment}
                onChange={(event) => setNewService((current) => ({ ...current, requiresAdjustment: event.target.checked }))}
              />
              <span>Requires adjustment</span>
            </label>
          </div>
        </Surface>

        <Surface tone="work" className="p-4">
          <SurfaceHeader
            title="Custom pricing"
            subtitle="Fabric SKU lookup resolves to a pricing tier. Tier base prices live here, and jacket construction surcharges stay global."
          />
          <Callout
            tone="default"
            className="mt-4"
            title="Pricing model"
          >
            Fabric determines the pricing tier. Three-piece garments are priced directly as their own garments, and jacket construction uses one global surcharge table instead of per-tier overrides.
          </Callout>
          <div className="mt-4 space-y-3">
            {customPricingTiers.map((tier) => (
              <div key={tier.key} className="rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <TextField
                    label="Tier label"
                    value={tier.label}
                    onChange={(value) => dispatch({ type: "updateCustomPricingTier", payload: { tierKey: tier.key, patch: { label: value } } })}
                  />
                  <label className="app-text-caption inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border)]/60 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={tier.isActive}
                      onChange={(event) => dispatch({ type: "updateCustomPricingTier", payload: { tierKey: tier.key, patch: { isActive: event.target.checked } } })}
                    />
                    <span>{tier.isActive ? "Active" : "Inactive"}</span>
                  </label>
                </div>

                <div className="mt-4 grid gap-2 xl:grid-cols-3">
                  {customPricingGarments.map((garment) => (
                    <NumberField
                      key={`${tier.key}-${garment}`}
                      label={String(garment)}
                      value={tier.basePrices[garment] ?? 0}
                      onChange={(value) => dispatch({ type: "updateCustomPricingTierGarmentPrice", tierKey: tier.key, garment, price: value })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-4">
            <SurfaceHeader
              title="Jacket construction surcharges"
              subtitle="Applied only to Two-piece suit, Three-piece suit, Jacket, Tuxedo jacket, and Three-piece tuxedo. Fused is the baseline, then half and full canvas add on top."
            />
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {(["Fused", "Half", "Full"] as const).map((canvas) => (
                <NumberField
                  key={canvas}
                  label={`${canvas} canvas`}
                  value={database.organizationSettings.jacketCanvasSurcharges[canvas]}
                  onChange={(value) => dispatch({
                    type: "updateOrganizationSettings",
                    payload: {
                      jacketCanvasSurcharges: {
                        ...database.organizationSettings.jacketCanvasSurcharges,
                        [canvas]: value,
                      },
                    },
                  })}
                />
              ))}
            </div>
          </div>
        </Surface>

        <Surface tone="work" className="p-4">
          <SurfaceHeader
            title="Locations"
            subtitle="Control which locations are available across scheduling and order pickup."
          />
          <div className="mt-4 space-y-2.5">
            {locations.map((location) => (
              <div key={location.id} className="grid gap-2 rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <TextField
                  label="Location name"
                  value={location.name}
                  onChange={(value) => dispatch({ type: "updateLocation", payload: { locationId: location.id, patch: { name: value } } })}
                />
                <div className="flex items-end">
                  <label className="app-text-caption inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border)]/60 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={location.isActive}
                      onChange={(event) => dispatch({ type: "updateLocation", payload: { locationId: location.id, patch: { isActive: event.target.checked } } })}
                    />
                    <span>{location.isActive ? "Active" : "Inactive"}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
            <TextField label="Add location" value={newLocationName} onChange={setNewLocationName} />
            <div className="flex items-end">
              <ActionButton
                disabled={!locationNameCandidate}
                disabledReason="Enter a location name before adding it."
                onClick={() => {
                  dispatch({ type: "addLocation", name: locationNameCandidate });
                  setNewLocationName("");
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Add location</span>
              </ActionButton>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
