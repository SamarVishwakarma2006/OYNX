/* eslint-disable react-hooks/set-state-in-effect -- Read browser-only tab and project state after hydration. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PrivateModelBuilder } from "./PrivateModelBuilder";
import { ProjectBuilder } from "./ProjectBuilder";
import { Workspace } from "./Workspace";
import {
  inspectGlb,
  privateProjects,
  type PrivateProject,
} from "../lib/private-project";
import { useWorkspace } from "../lib/store";
import { validateProduct, type Product } from "../lib/product";
import {
  deleteWorkshopProject,
  exportWorkshopProject,
  listWorkshopProjects,
  restoreWorkshopProject,
  saveSchematic,
  type WorkshopProject,
} from "../lib/workshop";

const choices = [
  {
    id: "import",
    title: "Import a model",
    description: "Bring a GLB and connect its meshes to your components.",
  },
  {
    id: "build",
    title: "Build without a model",
    description: "Record parts and evidence to create a schematic.",
  },
  {
    id: "projects",
    title: "Open an existing project",
    description: "Find saved work or restore a project backup.",
  },
] as const;
type Tab = (typeof choices)[number]["id"];

export function Workshop() {
  const savedModelUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (savedModelUrl.current) URL.revokeObjectURL(savedModelUrl.current);
    },
    [],
  );
  const [tab, setTab] = useState<Tab>("import");
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<WorkshopProject[]>([]);
  const [message, setMessage] = useState("");
  const [storageErrors, setStorageErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async () => {
    const result = await listWorkshopProjects();
    setProjects(result.projects);
    setStorageErrors(result.errors);
    setLoaded(true);
  }, []);
  useEffect(() => {
    const sync = () => {
      const value = window.location.hash.slice(1);
      setTab(choices.some((c) => c.id === value) ? (value as Tab) : "import");
      setOpen(false);
    };
    sync();
    void refresh();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [refresh]);
  function choose(value: Tab) {
    setTab(value);
    window.history.replaceState(null, "", `#${value}`);
  }
  async function saved() {
    await refresh();
    choose("projects");
    setMessage(
      "Saved on this browser. Export a backup to keep a portable copy.",
    );
  }
  async function saveManual(product: Product) {
    saveSchematic(product);
    await saved();
  }
  async function saveModel(record: PrivateProject) {
    await privateProjects("save", record);
    await saved();
  }
  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not complete this action.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function openProject(project: WorkshopProject) {
    let product = project.product;
    if (project.kind === "model") {
      const model = await inspectGlb(project.record.file);
      const result = validateProduct(
        product,
        model.parts.map((p) => p.id),
      );
      if (!result.product) throw new Error(result.errors.join("; "));
      if (savedModelUrl.current) URL.revokeObjectURL(savedModelUrl.current);
      savedModelUrl.current = URL.createObjectURL(project.record.file);
      product = {
        ...result.product,
        model3D: { ...result.product.model3D, url: savedModelUrl.current },
      };
    }
    useWorkspace.getState().loadProduct(product);
    if (useWorkspace.getState().error)
      throw new Error(useWorkspace.getState().error!);
    setOpen(true);
    window.scrollTo(0, 0);
  }
  if (open)
    return (
      <Workspace
        onBack={() => {
          setOpen(false);
          void refresh();
        }}
      />
    );
  return (
    <main className="private-model-page workshop-page">
      <nav
        className="studio-nav private-model-nav"
        aria-label="Workshop navigation"
      >
        <Link href="/">inside /</Link>
        <Link href="/">← Back to landing page</Link>
      </nav>
      <header className="workshop-heading">
        <span className="eyebrow">YOUR PRIVATE WORKSHOP</span>
        <h1>One place for your projects.</h1>
        <p>Choose how to start. Models and schematics stay on this browser.</p>
        <div
          className="workshop-choices"
          role="group"
          aria-label="Workshop options"
        >
          {choices.map((choice, index) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={tab === choice.id}
              onClick={() => choose(choice.id)}
            >
              <span className="eyebrow">0{index + 1}</span>
              <strong>{choice.title}</strong>
              <span>{choice.description}</span>
            </button>
          ))}
        </div>
        {message && <p role="status">{message}</p>}
        {storageErrors.map((error) => (
          <p role="alert" key={error}>
            {error}
          </p>
        ))}
      </header>
      <div hidden={tab !== "import"}>
        <PrivateModelBuilder onOpen={() => setOpen(true)} onSave={saveModel} />
      </div>
      <div hidden={tab !== "build"}>
        <ProjectBuilder onOpen={() => setOpen(true)} onSave={saveManual} />
      </div>
      <section
        hidden={tab !== "projects"}
        className="workshop-library"
        aria-labelledby="project-library-title"
      >
        <h2 id="project-library-title">Your projects</h2>
        <label className="field">
          Restore project backup or JSON
          <input
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void perform(async () => {
                await restoreWorkshopProject(file);
                await refresh();
                setMessage("Project restored locally. Open it below.");
              });
            }}
          />
        </label>
        <p className="caption">
          Supports complete model backups, schematic backups and existing
          product JSON files.
        </p>
        {!loaded ? (
          <p>Loading saved projects…</p>
        ) : (
          projects.length === 0 && (
            <p>
              No saved projects yet. Import a model, build a schematic, or
              restore a backup above.
            </p>
          )
        )}
        <ul className="record-list">
          {projects.map((project) => (
            <li key={project.key}>
              <div>
                <strong>{project.product.name}</strong>
                <small>
                  {project.kind === "model"
                    ? "3D model included"
                    : project.product.model3D.type === "procedural"
                      ? "Schematic"
                      : "Linked 3D model"}{" "}
                  · {project.product.components.length} components
                </small>
              </div>
              <div className="studio-actions">
                <button
                  disabled={busy}
                  onClick={() => void perform(() => openProject(project))}
                >
                  Open
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    void perform(() => exportWorkshopProject(project))
                  }
                >
                  Export backup
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      await deleteWorkshopProject(project);
                      await refresh();
                      setMessage("Local copy deleted.");
                    })
                  }
                >
                  Delete local copy
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="caption">
          Clearing site data removes local projects. Export a backup to keep
          them outside this browser.
        </p>
      </section>
    </main>
  );
}
