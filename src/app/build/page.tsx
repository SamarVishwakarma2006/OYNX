/* eslint-disable react-hooks/set-state-in-effect -- Hydrate browser-only local records after SSR; never write storage during hydration. */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  buildProduct,
  downloadJson,
  draftPartSchema,
  projectsSchema,
  readLocal,
  writeLocal,
  type DraftPart,
} from "../../lib/community";
import type { Product } from "../../lib/product";
import { useWorkspace } from "../../lib/store";
import { Workspace } from "../../components/Workspace";

const emptyPart: DraftPart = {
  name: "",
  purpose: "",
  status: "unknown",
  note: "",
};
export default function Builder() {
  const [step, setStep] = useState(0),
    [name, setName] = useState("");
  const [parts, setParts] = useState<DraftPart[]>([]),
    [part, setPart] = useState<DraftPart>(emptyPart);
  const [projects, setProjects] = useState<Product[]>([]),
    [ready, setReady] = useState<Product | null>(null);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setProjects(readLocal("inside-projects-v1", projectsSchema, []));
    } catch {
      setError(
        "Saved projects could not be read. Existing data has been preserved; you can still export a new project.",
      );
    }
  }, []);
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
  function save() {
    if (!ready) return;
    try {
      const existing = readLocal("inside-projects-v1", projectsSchema, []);
      const next = [...existing.filter((p) => p.id !== ready.id), ready];
      writeLocal("inside-projects-v1", next);
      setProjects(next);
      setNotice("Saved on this browser. Export a backup to keep it safe.");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    }
  }
  function explore(product: Product) {
    useWorkspace.getState().loadProduct(product);
    setOpen(true);
  }
  if (open) return <Workspace onBack={() => setOpen(false)} />;
  return (
    <main className="studio-page">
      <nav className="studio-nav">
        <Link href="/">inside /</Link>
        <Link href="/impact">Repair outcome log ↗</Link>
      </nav>
      <span className="eyebrow">COMMUNITY KNOWLEDGE / NO CAD REQUIRED</span>
      <h1>
        Start with what
        <br />
        <em>you can observe.</em>
      </h1>
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
              <button onClick={() => downloadJson(ready, "inside-device.json")}>
                Export JSON
              </button>
              <button onClick={save}>Save locally</button>
              <button className="primary" onClick={() => explore(ready)}>
                Open schematic →
              </button>
            </div>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
      </section>
      {projects.length > 0 && (
        <section className="studio-card">
          <h2>Saved on this browser</h2>
          <ul className="record-list">
            {projects.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong>
                <div className="studio-actions">
                  <button onClick={() => downloadJson(p, "inside-device.json")}>
                    Export
                  </button>
                  <button onClick={() => explore(p)}>Open</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <footer>
        Records stay on this browser. No account, cloud sync or automatic
        verification. Export JSON for a portable backup; import it from the
        workspace.
      </footer>
    </main>
  );
}
