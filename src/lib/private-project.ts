import { Box3, Mesh, Vector3, type Object3D, Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { buildProduct } from "./community";
import { validateProduct, type Product } from "./product";

export type PrivateProject = {
  id: string;
  name: string;
  file: Blob;
  product: Product;
};
export type ModelPart = {
  id: string;
  label: string;
  position: [number, number, number];
  size: [number, number, number];
};

// Stable traversal IDs include unnamed/duplicate nodes and survive reopening the same GLB.
export function namePrivateNodes(scene: Object3D) {
  let index = 0;
  scene.traverse((node) => {
    node.name = `oynx-node-${index++}`;
  });
}

export function checkGlb(data: ArrayBuffer) {
  const view = new DataView(data);
  if (
    data.byteLength < 20 ||
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== data.byteLength ||
    view.getUint32(16, true) !== 0x4e4f534a
  )
    throw new Error("Choose a valid GLB 2.0 file.");
  const length = view.getUint32(12, true);
  if (20 + length > data.byteLength)
    throw new Error("The GLB JSON chunk is incomplete.");
  const json = JSON.parse(
    new TextDecoder().decode(data.slice(20, 20 + length)),
  );
  if (
    (json.extensionsUsed ?? []).some((name: string) =>
      [
        "KHR_draco_mesh_compression",
        "EXT_meshopt_compression",
        "KHR_texture_basisu",
      ].includes(name),
    )
  )
    throw new Error(
      "Export an uncompressed GLB with embedded PNG/JPEG textures for this local preview.",
    );
  for (const resource of [...(json.buffers ?? []), ...(json.images ?? [])]) {
    if (resource.uri && !resource.uri.startsWith("data:"))
      throw new Error(
        "Use a self-contained GLB with embedded textures and buffers. External resources are blocked.",
      );
  }
  return json;
}

export async function inspectGlb(file: Blob) {
  if (file.size > 50 * 1024 * 1024)
    throw new Error("The first version supports GLB files up to 50 MB.");
  const data = await file.arrayBuffer();
  checkGlb(data);
  const gltf = await new GLTFLoader().parseAsync(data, "");
  const labels = new Map<Object3D, string>();
  gltf.scene.traverse((node) => labels.set(node, node.name));
  namePrivateNodes(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  const parts: ModelPart[] = [];
  gltf.scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const bounds = new Box3().setFromObject(node);
    const size = bounds.getSize(new Vector3());
    parts.push({
      id: node.name,
      label: labels.get(node) || `Mesh ${parts.length + 1}`,
      position: bounds.getCenter(new Vector3()).toArray(),
      size: size.toArray().map((n) => Math.max(n, 0.001)) as ModelPart["size"],
    });
  });
  const bounds = new Box3().setFromObject(gltf.scene);
  const extent = Math.max(...bounds.getSize(new Vector3()).toArray());
  const center = bounds.getCenter(new Vector3());
  if (!parts.length || !Number.isFinite(extent) || extent <= 0)
    throw new Error("No usable mesh geometry found.");
  const scale = 6 / extent;
  gltf.scene.traverse((node) => {
    if (node instanceof Mesh) {
      node.geometry.dispose();
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material]) {
        for (const value of Object.values(material))
          if (value && typeof value === "object" && "isTexture" in value)
            (value as Texture).dispose();
        material.dispose();
      }
    }
  });
  return { parts, center: center.toArray(), scale };
}

export function mappedProduct(
  name: string,
  parts: ModelPart[],
  assignments: Record<string, string>,
  url: string,
  center: number[],
  scale: number,
) {
  const names = [
    ...new Set(parts.map((p) => assignments[p.id]?.trim()).filter(Boolean)),
  ];
  if (!names.length || names.length > 30)
    throw new Error("Assign meshes to between 1 and 30 components.");
  if (parts.some((p) => !assignments[p.id]?.trim()))
    throw new Error("Assign every mesh before opening this project.");
  const product = buildProduct(
    name,
    names.map((name) => ({
      name,
      purpose: "Customer-supplied component; function not documented.",
      status: "unknown",
      note: "Mapped manually from a private model.",
    })),
  );
  product.model3D = {
    type: "gltf",
    url,
    privateNodes: true,
    center: center as [number, number, number],
    scale,
  };
  product.model = "Private GLB";
  product.specifications.Geometry = "Customer-supplied GLB; unverified";
  for (const component of product.components) {
    const selected = parts.filter(
      (p) => assignments[p.id].trim() === component.name,
    );
    component.modelNodeIds = selected.map((p) => p.id);
    const bounds = new Box3();
    for (const part of selected) {
      const position = new Vector3(...part.position),
        half = new Vector3(...part.size).multiplyScalar(0.5);
      bounds.expandByPoint(position.clone().sub(half));
      bounds.expandByPoint(position.add(half));
    }
    component.geometry.position = bounds
      .getCenter(new Vector3())
      .sub(new Vector3(...center))
      .multiplyScalar(scale)
      .toArray();
    component.geometry.size = bounds
      .getSize(new Vector3())
      .multiplyScalar(scale)
      .toArray();
  }
  const result = validateProduct(
    product,
    parts.map((p) => p.id),
  );
  if (!result.product) throw new Error(result.errors.join("; "));
  return result.product;
}

export async function privateProjects(
  action: "list" | "save" | "delete",
  record?: PrivateProject,
  id?: string,
): Promise<PrivateProject[]> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("oynx-private-v1", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("projects", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Private browser storage is unavailable."));
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        "projects",
        action === "list" ? "readonly" : "readwrite",
      );
      const store = transaction.objectStore("projects");
      if (action === "save") store.put(record!);
      if (action === "delete") store.delete(id!);
      const request = store.getAll();
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () =>
        reject(
          new Error(
            "Could not save private files. Browser storage may be full or unavailable.",
          ),
        );
    });
  } finally {
    db.close();
  }
}

export function parsePartsCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (ch === "," || ch === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (ch === "\n") {
        rows.push(row);
        row = [];
      }
    } else cell += ch;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const header =
    rows.shift()?.map((s) => s.replace(/^\uFEFF/, "").toLowerCase()) ?? [];
  const name = header.indexOf("name"),
    mesh = header.indexOf("mesh");
  if (name < 0)
    throw new Error(
      'CSV needs a "name" column. Optional "mesh" matches a mesh label or ID.',
    );
  const parts = rows
    .filter((r) => r.some(Boolean))
    .map((r) => ({
      name: r[name] ?? "",
      mesh: mesh < 0 ? "" : (r[mesh] ?? ""),
    }));
  if (
    !parts.length ||
    parts.length > 1000 ||
    parts.some((p) => !p.name || p.name.length > 100)
  )
    throw new Error(
      "Use 1–1000 rows with component names up to 100 characters.",
    );
  return parts;
}

export async function exportPrivateProject(record: PrivateProject) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not export model."));
    reader.readAsDataURL(record.file);
  });
  const url = URL.createObjectURL(
    new Blob(
      [JSON.stringify({ version: 1, product: record.product, model: data })],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "oynx-private-project.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importPrivateProject(
  file: File,
): Promise<PrivateProject> {
  if (file.size > 72 * 1024 * 1024)
    throw new Error("Project backup exceeds 72 MB.");
  const input = JSON.parse(await file.text());
  if (
    input.version !== 1 ||
    typeof input.model !== "string" ||
    !/^data:[^,]*;base64,[A-Za-z0-9+/=]+$/.test(input.model)
  )
    throw new Error("Invalid private project backup.");
  const bytes = Uint8Array.from(atob(input.model.split(",")[1]), (c) =>
    c.charCodeAt(0),
  );
  const blob = new Blob([bytes], { type: "model/gltf-binary" });
  const model = await inspectGlb(blob);
  const result = validateProduct(
    input.product,
    model.parts.map((p) => p.id),
  );
  if (!result.product || !result.product.model3D.privateNodes)
    throw new Error(
      result.errors.join("; ") || "Invalid private mesh mappings.",
    );
  return {
    id: result.product.id,
    name: result.product.name,
    product: result.product,
    file: blob,
  };
}
