import { Card, StatusPill } from "../ui/primitives";

export function PrototypeNotes() {
  return (
    <section className="prototype-notes mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/80 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="formal-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Prototype Notes</div>
          <h2 className="formal-section-title mt-1 text-xl font-semibold text-slate-900">Concept callouts below the product shell</h2>
          <p className="formal-page-copy mt-2 max-w-3xl text-sm text-slate-600">
            These cards are presentation notes for the client conversation. They are intentionally separated from the in-app interface above.
          </p>
        </div>
        <StatusPill tone="warn">Not part of UI</StatusPill>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="prototype-notes-card p-5 ring-1 ring-inset ring-slate-200/80">
          <div className="formal-card-kicker mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Shell Rationale</div>
          <h3 className="formal-section-title mb-3 text-lg font-semibold">Why landscape works better here</h3>
          <p className="formal-page-copy mb-3 text-sm text-slate-600">This is an explainer card for stakeholders, not a screen inside the workflow.</p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-3">Customer list and selected profile can stay visible together.</div>
            <div className="rounded-2xl bg-slate-50 p-3">Order entry can use a dedicated summary rail instead of burying totals below the fold.</div>
            <div className="rounded-2xl bg-slate-50 p-3">Measurements can combine entry, version history, and order linkage on one screen.</div>
          </div>
        </Card>

        <Card className="prototype-notes-card p-5 ring-1 ring-inset ring-slate-200/80">
          <div className="formal-card-kicker mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Layout Rules</div>
          <h3 className="formal-section-title mb-3 text-lg font-semibold">Core layout principles</h3>
          <p className="formal-page-copy mb-3 text-sm text-slate-600">A simple summary of the structural decisions driving the prototype.</p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 p-3">Left rail for navigation</div>
            <div className="rounded-2xl border border-slate-200 p-3">Center pane for active work</div>
            <div className="rounded-2xl border border-slate-200 p-3">Right rail for context, summary, and next action</div>
          </div>
        </Card>

        <Card className="prototype-notes-card p-5 ring-1 ring-inset ring-slate-200/80">
          <div className="formal-card-kicker mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Client Questions</div>
          <h3 className="formal-section-title mb-3 text-lg font-semibold">Open questions for review</h3>
          <p className="formal-page-copy mb-3 text-sm text-slate-600">These are prompts to resolve in discussion before the workflow gets more detailed.</p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 p-3">Should appointment check-in create or update the working order automatically?</div>
            <div className="rounded-2xl border border-slate-200 p-3">Do custom bundles need one pricing band or per-garment pricing?</div>
            <div className="rounded-2xl border border-slate-200 p-3">Should measurement history allow compare and diff before saving a new version?</div>
          </div>
        </Card>
      </div>
    </section>
  );
}
