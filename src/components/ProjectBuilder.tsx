"use client";
import { useState } from "react";
import {
  buildProduct,
  draftPartSchema,
  type DraftPart,
} from "../lib/community";
import type { Product } from "../lib/product";
import { useWorkspace } from "../lib/store";

const emptyPart: DraftPart = {
  name: "",
  purpose: "",
  status: "unknown",
  note: "",
};
export function ProjectBuilder({
  onOpen,
  onSave,
}: {
  onOpen: () => void;
  onSave: (product: Product) => Promise<void>;
}) {
  const [step, setStep] = useState(0),
    [name, setName] = useState("");
  const [parts, setParts] = useState<DraftPart[]>([]),
    [part, setPart] = useState<DraftPart>(emptyPart);
  const [ready, setReady] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  function addPart() {
    const result = draftPartSchema.safeParse(part);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setParts([...parts, result.data]);
    setPart(emptyPart);
    setError("");
  }
  function review() {
    try {
      setReady(buildProduct(name, parts));
      setStep(2);
      setError("");
    } catch {
      setError(
        "Add at least one named component with its purpose, and a device name.",
      );
    }
  }
  async function save() {
    if (!ready) return;
    setSaving(true);
    try {
      await onSave(ready);
      setNotice("Saved on this browser.");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }
  function explore(product: Product) {
    useWorkspace.getState().loadProduct(product);
    onOpen();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  return (
    <section
      className="studio-page landing-builder"
      id="build"
      aria-labelledby="builder-title"
    >
      <span className="eyebrow">BUILD WITHOUT A MODEL</span>
      <h2 id="builder-title">
        Start with what
        <br />
        <em>you can observe.</em>
      </h2>
      <p className="studio-lead">
        Turn a device into a small, honest knowledge record. We create an
        abstract component layout, not an exact 3D reconstruction.
      </p>
      <ol className="builder-steps">
        {["Name the device", "Document components", "Review & explore"].map(
          (label, i) => (
            <li key={label} aria-current={step === i ? "step" : undefined}>
              <span>0{i + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      <section className="studio-card">
        {step === 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(1);
            }}
          >
            <h2>What are you documenting?</h2>
            <label className="field">
              Device name
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. School laptop or desk fan"
              />
            </label>
            <p>
              Start from a label, an external inspection or an existing service
              document. You do not need to open a device to begin.
            </p>
            <button className="primary" disabled={!name.trim()}>
              Continue →
            </button>
          </form>
        )}
        {step === 1 && (
          <>
            <h2>{name} / components</h2>
            <p>
              Observed: describe what you saw. Inferred: explain your reasoning.
              Unknown: leave uncertainty visible.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addPart();
              }}
            >
              <div className="studio-grid">
                <label className="field">
                  Component name
                  <input
                    required
                    maxLength={100}
                    value={part.name}
                    onChange={(e) => setPart({ ...part, name: e.target.value })}
                  />
                </label>
                <label className="field">
                  Purpose
                  <input
                    required
                    maxLength={500}
                    value={part.purpose}
                    onChange={(e) =>
                      setPart({ ...part, purpose: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="field">
                Evidence status
                <select
                  value={part.status}
                  onChange={(e) =>
                    setPart({
                      ...part,
                      status: e.target.value as DraftPart["status"],
                    })
                  }
                >
                  <option value="unknown">Unknown</option>
                  <option value="observed">Observed by contributor</option>
                  <option value="inferred">Inferred</option>
                </select>
              </label>
              <label className="field">
                Evidence note / source reference
                <textarea
                  maxLength={2000}
                  required={part.status === "observed"}
                  value={part.note}
                  onChange={(e) => setPart({ ...part, note: e.target.value })}
                  placeholder="What did you observe, or which document and page supports this?"
                />
              </label>
              <button disabled={parts.length >= 30}>Add component</button>
            </form>
            <ul className="record-list">
              {parts.map((p, i) => (
                <li key={i}>
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      {p.status} · {p.purpose}
                    </small>
                  </div>
                  <button
                    aria-label={`Remove ${p.name}`}
                    onClick={() => setParts(parts.filter((_, n) => n !== i))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="studio-actions">
              <button onClick={() => setStep(0)}>Back</button>
              <button
                className="primary"
                disabled={!parts.length}
                onClick={review}
              >
                Review {parts.length} components →
              </button>
            </div>
          </>
        )}
        {step === 2 && ready && (
          <>
            <span className="badge">
              Schematic · contributor supplied · unverified
            </span>
            <h2>{ready.name}</h2>
            <p>
              {parts.length} components. Connections, repair instructions and
              measured geometry have not been documented.
            </p>
            <ul className="record-list">
              {parts.map((p, i) => (
                <li key={i}>
                  <div>
                    <strong>
                      {p.name} · {p.status}
                    </strong>
                    <p>{p.note || "No supporting evidence recorded."}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="studio-actions">
              <button onClick={() => setStep(1)}>Edit components</button>
              <button disabled={saving} onClick={() => void save()}>
                {saving ? "Saving…" : "Save project"}
              </button>
              <button className="primary" onClick={() => explore(ready)}>
                Open schematic →
              </button>
            </div>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
      </section>
      <footer>
        Save your project to find it under Open an existing project. Export a
        backup there to keep a portable copy.
      </footer>
    </section>
  );
}
