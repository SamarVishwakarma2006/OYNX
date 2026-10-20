"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  inspectGlb,
  mappedProduct,
  parsePartsCsv,
  namePrivateNodes,
  type ModelPart,
  type PrivateProject,
} from "../lib/private-project";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls, useGLTF } from "@react-three/drei";
import { Mesh, type MeshStandardMaterial } from "three";
import { ErrorBoundary } from "./ErrorBoundary";
import { useWorkspace } from "../lib/store";

// Keep the active model URL alive across landing/workspace transitions.
let activeUrl: string | undefined;
function modelUrl(file: Blob) {
  if (activeUrl) URL.revokeObjectURL(activeUrl);
  activeUrl = URL.createObjectURL(file);
  return activeUrl;
}
function ModelPreview({
  url,
  selected,
  onSelect,
}: {
  url: string;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { scene } = useGLTF(url);
  const root = useMemo(() => {
    const copy = scene.clone(true);
    namePrivateNodes(copy);
    copy.traverse((node) => {
      if (node instanceof Mesh) {
        node.material = (
          Array.isArray(node.material) ? node.material : [node.material]
        ).map((m) => {
          const material = m.clone() as MeshStandardMaterial;
          material.emissive?.set(
            node.name === selected ? "#176b86" : "#000000",
          );
          return material;
        });
      }
    });
    return copy;
  }, [scene, selected]);
  useEffect(
    () => () =>
      root.traverse((node) => {
        if (node instanceof Mesh)
          for (const material of Array.isArray(node.material)
            ? node.material
            : [node.material])
            material.dispose();
      }),
    [root],
  );
  return (
    <Bounds fit clip observe margin={1.3}>
      <primitive
        object={root}
        onClick={(e: {
          stopPropagation: () => void;
          object: { name: string };
        }) => {
          e.stopPropagation();
          onSelect(e.object.name);
        }}
      />
    </Bounds>
  );
}

export function PrivateModelBuilder({
  onOpen,
  onSave,
}: {
  onOpen: () => void;
  onSave: (record: PrivateProject) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [model, setModel] = useState<{
    parts: ModelPart[];
    center: number[];
    scale: number;
  } | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState("");
  const [selected, setSelected] = useState("");
  const [csvNames, setCsvNames] = useState<string[]>([]);
  useEffect(() => {
    return () => {
      if (preview) {
        useGLTF.clear(preview);
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function importModel(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setModel(null);
    setFile(null);
    setPreview("");
    try {
      const result = await inspectGlb(file);
      setModel(result);
      setFile(file);
      setPreview(URL.createObjectURL(file));
      setCsvNames([]);
      setName(file.name.replace(/\.glb$/i, ""));
      setAssignments(
        Object.fromEntries(result.parts.map((part) => [part.id, ""])),
      );
      setMessage(
        `${result.parts.length} meshes found. Name each component; reuse a name to group meshes.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not import model.");
    } finally {
      setBusy(false);
    }
  }
  async function open(save: boolean) {
    if (!file || !model) return;
    setBusy(true);
    try {
      const url = modelUrl(file);
      const product = mappedProduct(
        name,
        model.parts,
        assignments,
        url,
        model.center,
        model.scale,
      );
      if (save) {
        const record = {
          id: product.id,
          name,
          file,
          product: {
            ...product,
            model3D: { ...product.model3D, url: "/private-local-model" },
          },
        };
        await onSave(record);
        setMessage(
          "Saved on this browser. Find it under Open an existing project.",
        );
      } else {
        useWorkspace.getState().loadProduct(product);
        onOpen();
        window.scrollTo(0, 0);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not open project.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="studio-page landing-builder"
      id="private-models"
      aria-labelledby="private-title"
    >
      <span className="eyebrow">PRIVATE MODEL WORKSPACE / LOCAL PREVIEW</span>
      <h2 id="private-title">
        Your model.
        <br />
        <em>Your components.</em>
      </h2>
      <p className="studio-lead">
        Import a self-contained GLB and connect its meshes to real component
        records. Files stay on this browser; no account or server upload.
      </p>
      <div className="studio-card">
        <label className="field">
          3D assembly · GLB up to 50 MB
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            disabled={busy}
            onChange={(e) => {
              void importModel(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {model && (
          <>
            {preview && (
              <div
                style={{ height: 340, background: "#101b29", borderRadius: 16 }}
              >
                <ErrorBoundary
                  fallback={
                    <p>
                      Preview unavailable. You can still map meshes from the
                      list.
                    </p>
                  }
                >
                  <Canvas camera={{ position: [6, 4, 8] }}>
                    <ambientLight intensity={2} />
                    <directionalLight position={[5, 8, 5]} intensity={3} />
                    <Suspense fallback={null}>
                      <ModelPreview
                        url={preview}
                        selected={selected}
                        onSelect={setSelected}
                      />
                    </Suspense>
                    <OrbitControls makeDefault />
                  </Canvas>
                </ErrorBoundary>
              </div>
            )}
            <p>
              Click a mesh to highlight it. Selected:{" "}
              {model.parts.find((p) => p.id === selected)?.label || "none"}.
            </p>
            <label className="field">
              Parts list CSV · name, optional mesh
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    if (file.size > 1024 * 1024)
                      throw new Error("CSV must be at most 1 MB.");
                    const parts = parsePartsCsv(await file.text());
                    setCsvNames([...new Set(parts.map((p) => p.name))]);
                    const next = { ...assignments };
                    let matched = 0;
                    for (const part of parts) {
                      const matches = model.parts.filter(
                        (m) =>
                          m.id === part.mesh ||
                          m.label === (part.mesh || part.name),
                      );
                      if (matches.length === 1) {
                        next[matches[0].id] = part.name;
                        matched++;
                      }
                    }
                    setAssignments(next);
                    setMessage(
                      `${parts.length} CSV rows loaded; ${matched} unique meshes matched. Choose remaining components manually.`,
                    );
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : "Could not read CSV.",
                    );
                  }
                }}
              />
            </label>
            <datalist id="private-component-names">
              {csvNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <label className="field">
              Project name
              <input
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <p>
              {Object.values(assignments).filter((s) => s.trim()).length} /{" "}
              {model.parts.length} meshes assigned. Components sharing a name
              move together in exploded view.
            </p>
            <button
              type="button"
              onClick={() =>
                setAssignments(
                  Object.fromEntries(
                    model.parts.map((p, i) => [p.id, `${p.label} ${i + 1}`]),
                  ),
                )
              }
            >
              Use mesh labels as components
            </button>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              <ul className="record-list">
                {model.parts.map((part) => (
                  <li
                    key={part.id}
                    style={{
                      border:
                        selected === part.id ? "1px solid #2bd5de" : undefined,
                    }}
                  >
                    <div>
                      <button onClick={() => setSelected(part.id)}>
                        {part.label}
                      </button>
                      <small>{part.id}</small>
                    </div>
                    <label className="field">
                      Component name
                      <input
                        list="private-component-names"
                        maxLength={100}
                        value={assignments[part.id] ?? ""}
                        onChange={(e) =>
                          setAssignments({
                            ...assignments,
                            [part.id]: e.target.value,
                          })
                        }
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <div className="studio-actions">
              <button
                disabled={busy || !name.trim()}
                onClick={() => void open(true)}
              >
                Save project
              </button>
              <button
                className="primary"
                disabled={busy || !name.trim()}
                onClick={() => void open(false)}
              >
                Open mapped model →
              </button>
            </div>
          </>
        )}
        {message && <p role="status">{message}</p>}
        {busy && <p role="status">Processing locally…</p>}
      </div>
      <p className="caption">
        Local storage is specific to this browser and site address. Clearing
        site data removes saved models. Uploaded geometry does not establish
        validated repair procedures or dependencies.
      </p>
    </section>
  );
}
