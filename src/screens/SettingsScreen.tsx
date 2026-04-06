import { Plus, Settings2, ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { PrototypeDatabase } from "../db";
import { createReferenceData } from "../db";
import type { AppAction } from "../state/appState";
import { ActionButton, Callout, FieldStack, SectionHeader, SelectField, Surface, SurfaceHeader } from "../components/ui/primitives";
import { getSortedAlterationServices, getSortedCustomPricingTiers, getSortedLocations, getSortedMeasurementFields } from "../features/settings/selectors";

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

function CapabilityBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={active
        ? "rounded-full border border-emerald-300/60 bg-emerald-500/10 px-2.5 py-1 app-text-caption text-emerald-700"
        : "rounded-full border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/25 px-2.5 py-1 app-text-caption text-[var(--app-text-muted)]"}
    >
      {label}
    </span>
  );
}

export function SettingsScreen({ database, dispatch }: SettingsScreenProps) {
  const referenceData = useMemo(() => createReferenceData(database), [database]);
  const measurementFields = useMemo(() => getSortedMeasurementFields(database), [database]);
  const alterationServices = useMemo(() => getSortedAlterationServices(database), [database]);
  const locations = useMemo(() => getSortedLocations(database), [database]);
  const customPricingTiers = useMemo(() => getSortedCustomPricingTiers(database), [database]);
  const catalogItem = referenceData.catalogItems[0] ?? null;
  const catalogVariations = referenceData.catalogVariations;
  const catalogVariationMatrix = referenceData.catalogVariationMatrix;
  const catalogModifierOptions = referenceData.catalogModifierOptions;
  const pricingPrograms = referenceData.pricingPrograms;
  const millBooksByTier = useMemo(() => {
    return referenceData.millBooks.reduce<Record<string, typeof referenceData.millBooks>>((accumulator, book) => {
      (accumulator[book.tierKey] ||= []).push(book);
      return accumulator;
    }, {});
  }, [referenceData.millBooks]);
  const fabricsByBook = useMemo(() => {
    return referenceData.fabricCatalogItems.reduce<Record<string, typeof referenceData.fabricCatalogItems>>((accumulator, fabric) => {
      (accumulator[fabric.bookId] ||= []).push(fabric);
      return accumulator;
    }, {});
  }, [referenceData.fabricCatalogItems]);
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
            subtitle="Catalog-first view of what is sellable, what resolves pricing, and what adds price."
          />
          <Callout
            tone="default"
            className="mt-4"
            title="Catalog model"
          >
            The sellable thing is the catalog variation, not the tier. Fabric is a price-resolving option: the selected fabric source resolves a variation into a pricing tier, then only modifier groups add on top of that resolved base amount. QR values are stored exactly as scanned when available, but the internal SKU catalog remains the canonical lookup layer.
          </Callout>
          <div className="mt-4 space-y-4">
            <div className="rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-4">
              <SurfaceHeader
                title="Catalog item"
                subtitle="One top-level sellable product currently owns all custom garment variations."
              />
              {catalogItem ? (
                <div className="mt-3 rounded-[10px] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/45 p-3">
                  <div className="app-text-body font-medium">{catalogItem.label}</div>
                  <div className="app-text-caption mt-1">Key: {catalogItem.key}</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-4">
              <SurfaceHeader
                title="Sellable variations"
                subtitle="These are the products the operator actually sells. Tiers and books only influence their pricing."
              />
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {catalogVariations.map((variation) => (
                  <div key={variation.id} className="rounded-[12px] border border-[var(--app-border)]/50 bg-[var(--app-surface)]/36 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="app-text-body font-medium">{variation.label}</div>
                        <div className="app-text-caption mt-1">
                          {pricingPrograms.find((program) => program.key === variation.programKey)?.label ?? variation.programKey}
                        </div>
                      </div>
                      <div className="app-text-value [font-variant-numeric:tabular-nums]">${variation.fallbackAmount.toFixed(2)}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <CapabilityBadge label="Canvas" active={variation.supportsCanvas} />
                      <CapabilityBadge label="Custom lining" active={variation.supportsCustomLining} />
                      <CapabilityBadge label="Lapel" active={variation.supportsLapel} />
                      <CapabilityBadge label="Pockets" active={variation.supportsPocketType} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-4">
              <SurfaceHeader
                title="Fabric source"
                subtitle="Reference data only: pricing programs, tiers, books, and representative SKUs resolve a sellable variation into a pricing tier."
              />
              <div className="mt-4 space-y-3">
                {pricingPrograms.map((program) => (
                  <div key={program.id} className="rounded-[12px] border border-[var(--app-border)]/50 bg-[var(--app-surface)]/36 p-4">
                    <SurfaceHeader
                      title={program.label}
                      subtitle={program.key === "custom_suiting" ? "Suiting fabric source hierarchy." : "Shirting fabric source hierarchy."}
                    />
                    <div className="mt-4 space-y-3">
                      {customPricingTiers
                        .filter((tier) => tier.programKey === program.key)
                        .map((tier) => {
                          const books = (millBooksByTier[tier.key] ?? []).slice().sort((left, right) => left.sortOrder - right.sortOrder);
                          return (
                            <div key={tier.key} className="rounded-[12px] border border-[var(--app-border)]/50 bg-[var(--app-surface-muted)]/20 p-3">
                              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_auto]">
                                <TextField
                                  label="Tier label"
                                  value={tier.label}
                                  onChange={(value) => dispatch({ type: "updateCustomPricingTier", payload: { tierKey: tier.key, patch: { label: value } } })}
                                />
                                <NumberField
                                  label="Two-piece suit floor"
                                  value={tier.floorPrice ?? 0}
                                  min={0}
                                  onChange={(value) => dispatch({ type: "updateCustomPricingTier", payload: { tierKey: tier.key, patch: { floorPrice: value } } })}
                                />
                                <label className="app-text-caption inline-flex items-center gap-2 rounded-[12px] border border-[var(--app-border)]/60 px-3 py-3">
                                  <input
                                    type="checkbox"
                                    checked={database.pricingTiers.find((candidate) => candidate.key === tier.key)?.isActive ?? true}
                                    onChange={(event) => dispatch({ type: "updateCustomPricingTier", payload: { tierKey: tier.key, patch: { isActive: event.target.checked } } })}
                                  />
                                  <span>{database.pricingTiers.find((candidate) => candidate.key === tier.key)?.isActive ? "Active" : "Inactive"}</span>
                                </label>
                              </div>
                              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                                <div className="rounded-[12px] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/45 p-3">
                                  <div className="app-text-overline">Representative books</div>
                                  <div className="mt-2 space-y-2">
                                    {books.map((book) => (
                                      <div key={book.id} className="rounded-[10px] border border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/18 p-2.5">
                                        <div className="app-text-body font-medium">{book.label}</div>
                                        <div className="app-text-caption mt-1">{book.manufacturer}</div>
                                        {book.notes ? <div className="app-text-caption mt-1">{book.notes}</div> : null}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="rounded-[12px] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/45 p-3">
                                  <div className="app-text-overline">Representative SKUs</div>
                                  <div className="mt-2 space-y-2">
                                    {books.flatMap((book) => (fabricsByBook[book.id] ?? []).slice(0, 2)).map((fabric) => (
                                      <div key={fabric.id} className="rounded-[10px] border border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/18 p-2.5">
                                        <div className="app-text-body font-medium">{fabric.label}</div>
                                        <div className="app-text-caption mt-1">{fabric.sku}</div>
                                        <div className="app-text-caption mt-1">
                                          {fabric.hasQrCode && fabric.qrCodeRawValue ? `QR: ${fabric.qrCodeRawValue}` : "QR not available"}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-4">
              <SurfaceHeader
                title="Variation pricing by fabric tier"
                subtitle="Rows are sellable variations. Columns are internal pricing tiers resolved from fabric source data."
              />
              <div className="mt-4 space-y-3">
                {pricingPrograms.map((program) => {
                  const programTiers = customPricingTiers.filter((tier) => tier.programKey === program.key);
                  const programRows = catalogVariationMatrix.filter((row) => row.programKey === program.key);
                  return (
                    <div key={program.id} className="rounded-[12px] border border-[var(--app-border)]/50 bg-[var(--app-surface)]/36 p-4">
                      <div className="app-text-body font-medium">{program.label}</div>
                      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: `minmax(200px, 1.4fr) repeat(${programTiers.length}, minmax(120px, 1fr))` }}>
                        <div className="app-text-overline">Variation</div>
                        {programTiers.map((tier) => (
                          <div key={tier.key} className="app-text-overline">{tier.label}</div>
                        ))}
                        {programRows.map((variation) => (
                          <div key={variation.id} className="contents">
                            <div key={`${variation.id}-label`} className="rounded-[10px] border border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/18 px-3 py-2 app-text-body font-medium">
                              {variation.label}
                            </div>
                            {variation.tierAmounts.map((tierAmount) => (
                              <div key={`${variation.id}-${tierAmount.tierKey}`} className="rounded-[10px] border border-[var(--app-border)]/35 bg-[var(--app-surface)]/45 px-3 py-2">
                                <NumberField
                                  label=""
                                  value={tierAmount.amount}
                                  min={0}
                                  onChange={(value) => dispatch({ type: "updateCustomPricingTierGarmentPrice", tierKey: tierAmount.tierKey, garment: variation.label, price: value })}
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-4">
              <SurfaceHeader
                title="Modifiers"
                subtitle="Only these groups add price on top of the variation base amount."
              />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {catalogModifierOptions.map((option) => {
                  return (
                    <div key={option.id} className="rounded-[12px] border border-[var(--app-border)]/50 bg-[var(--app-surface)]/36 p-3">
                      <TextField
                        label="Modifier label"
                        value={option.label}
                        onChange={(value) => {
                          dispatch({
                            type: "updateCatalogModifierOption",
                            payload: {
                              optionId: option.id,
                              patch: { label: value },
                            },
                          });
                        }}
                      />
                      <div className="mt-3">
                        <NumberField
                          label="Amount"
                          value={option.amount}
                          min={0}
                          onChange={(value) => {
                            dispatch({
                              type: "updateCatalogModifierOption",
                              payload: {
                                optionId: option.id,
                                patch: { amount: value },
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[12px] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/26 p-4">
              <SurfaceHeader
                title="Option groups and build selections"
                subtitle="Fabric is price-resolving, modifiers add directly, and the remaining selections shape the build without independently changing price."
              />
              <div className="mt-4 grid gap-3 xl:grid-cols-3">
                <div className="rounded-[12px] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/45 p-3">
                  <div className="app-text-overline">Option groups</div>
                  <div className="mt-2 space-y-2">
                    {referenceData.catalogOptionGroups.map((group) => (
                      <div key={group.id} className="rounded-[10px] border border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/18 px-3 py-2">
                        <div className="app-text-body font-medium">{group.label}</div>
                        <div className="app-text-caption mt-1">
                          {group.key === "fabric"
                            ? "Price-resolving option group"
                            : "Build option group"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[12px] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/45 p-3">
                  <div className="app-text-overline">Style options</div>
                  <div className="mt-2 space-y-2">
                    <div className="rounded-[10px] border border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/18 px-3 py-2">
                      <div className="app-text-body font-medium">Lapels</div>
                      <div className="app-text-caption mt-1">{referenceData.lapelOptions.join(", ")}</div>
                    </div>
                    <div className="rounded-[10px] border border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/18 px-3 py-2">
                      <div className="app-text-body font-medium">Pockets</div>
                      <div className="app-text-caption mt-1">{referenceData.pocketTypeOptions.join(", ")}</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[12px] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/45 p-3">
                  <div className="app-text-overline">Material component catalogs</div>
                  <div className="mt-2 space-y-2">
                    <div className="rounded-[10px] border border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/18 px-3 py-2">
                      <div className="app-text-body font-medium">Buttons</div>
                      <div className="app-text-caption mt-1">{referenceData.customMaterialOptionsByKind.buttons.map((option) => option.label).join(", ")}</div>
                    </div>
                    <div className="rounded-[10px] border border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/18 px-3 py-2">
                      <div className="app-text-body font-medium">Standard lining</div>
                      <div className="app-text-caption mt-1">{referenceData.customMaterialOptionsByKind.lining.map((option) => option.label).join(", ")}</div>
                    </div>
                    <div className="rounded-[10px] border border-[var(--app-border)]/40 bg-[var(--app-surface-muted)]/18 px-3 py-2">
                      <div className="app-text-body font-medium">Threads</div>
                      <div className="app-text-caption mt-1">{referenceData.customMaterialOptionsByKind.threads.map((option) => option.label).join(", ")}</div>
                    </div>
                  </div>
                </div>
              </div>
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
