/* eslint-disable react-hooks/set-state-in-effect -- Hydrate browser-only local records after SSR; never write storage during hydration. */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  downloadJson,
  outcomeSchema,
  outcomesSchema,
  readLocal,
  writeLocal,
  type Outcome,
} from "../../lib/community";
export default function Impact() {
  const [records, setRecords] = useState<Outcome[]>([]),
    [product, setProduct] = useState("");
  const [issue, setIssue] = useState(""),
    [notes, setNotes] = useState(""),
    [outcome, setOutcome] = useState<Outcome["outcome"]>("Unresolved");
  const [date, setDate] = useState(""),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    setProduct(new URLSearchParams(location.search).get("product") ?? "");
    const now = new Date();
    setDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );
    try {
      setRecords(readLocal("inside-outcomes-v1", outcomesSchema, []));
    } catch {
      setError(
        "Saved records could not be read. Existing data has been preserved.",
      );
    }
  }, []);
  function record() {
    try {
      const item = outcomeSchema.parse({
        id: crypto.randomUUID(),
        product,
        issue,
        outcome,
        notes,
        date,
      });
      const existing = readLocal("inside-outcomes-v1", outcomesSchema, []);
      const next = [item, ...existing];
      writeLocal("inside-outcomes-v1", next);
      setRecords(next);
      setIssue("");
      setNotes("");
      setSaved(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save record.");
    }
  }
  return (
    <main className="studio-page">
      <nav className="studio-nav">
        <Link href="/">inside /</Link>
        <Link href="/build">Guided builder ↗</Link>
      </nav>
      <span className="eyebrow">REPAIR OUTCOME LOG</span>
      <h1>
        Small repairs.
        <br />
        <em>Real stories.</em>
      </h1>
      <p className="studio-lead">
        Document what actually happened, including unsuccessful attempts. Every
        entry is self-reported and stored on this browser.
      </p>
      <div className="impact-stats">
        {["Repaired", "Reused for parts", "Recycled", "Unresolved"].map(
          (status) => (
            <section key={status}>
              <strong>
                {records.filter((r) => r.outcome === status).length}
              </strong>
              <span>{status} records</span>
            </section>
          ),
        )}
      </div>
      <section className="studio-card">
        <h2>Record an outcome</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            record();
          }}
        >
          <div className="studio-grid">
            <label className="field">
              Device
              <input
                required
                maxLength={100}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
            </label>
            <label className="field">
              Date
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            Problem encountered
            <input
              required
              maxLength={1000}
              value={issue}
              onChange={(e) => {
                setIssue(e.target.value);
                setSaved(false);
              }}
            />
          </label>
          <label className="field">
            Outcome
            <select
              aria-label="Outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as Outcome["outcome"])}
            >
              {["Unresolved", "Repaired", "Reused for parts", "Recycled"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </label>
          <label className="field">
            What changed / how you checked
            <textarea
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button className="primary">Save outcome</button>
        </form>
        {error && <p role="alert">{error}</p>}
        {saved && <p role="status">Outcome saved on this browser.</p>}
      </section>
      <section className="studio-card">
        <div className="studio-actions">
          <h2>Your repair records</h2>
          <button
            disabled={!records.length}
            onClick={() => downloadJson(records, "inside-repair-outcomes.json")}
          >
            Export records
          </button>
        </div>
        {!records.length ? (
          <p>No outcomes recorded yet.</p>
        ) : (
          <ul className="record-list">
            {records.map((r) => (
              <li key={r.id}>
                <div>
                  <span className="badge">{r.outcome} · self-reported</span>
                  <h3>{r.product}</h3>
                  <p>{r.issue}</p>
                  <p>{r.notes}</p>
                  <small>{r.date}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <footer>
        Counts represent entries, not unique devices or independently verified
        repairs. No CO₂ or waste savings are estimated. Export a backup before
        clearing browser data.
      </footer>
    </main>
  );
}
