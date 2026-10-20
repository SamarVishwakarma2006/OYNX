import {
  downloadJson,
  projectsSchema,
  readLocal,
  writeLocal,
} from "./community";
import {
  exportPrivateProject,
  importPrivateProject,
  privateProjects,
  type PrivateProject,
} from "./private-project";
import { validateProduct, type Product } from "./product";

export type WorkshopProject =
  | { key: string; kind: "model"; record: PrivateProject; product: Product }
  | { key: string; kind: "schematic"; product: Product };

// Keep existing storage intact: one library exposes both without a destructive migration.
export async function listWorkshopProjects() {
  const projects: WorkshopProject[] = [];
  const errors: string[] = [];
  try {
    const records = readLocal("inside-projects-v1", projectsSchema, []);
    projects.push(
      ...records.map((product) => ({
        key: `schematic:${product.id}`,
        kind: "schematic" as const,
        product,
      })),
    );
  } catch {
    errors.push(
      "Saved schematics could not be read. Existing data has been preserved.",
    );
  }
  try {
    const records = await privateProjects("list");
    projects.push(
      ...records.map((record) => ({
        key: `model:${record.id}`,
        kind: "model" as const,
        record,
        product: record.product,
      })),
    );
  } catch {
    errors.push(
      "Saved model files could not be read. Existing data has been preserved.",
    );
  }
  return { projects, errors };
}

export function saveSchematic(product: Product) {
  const result = validateProduct(product);
  if (!result.product) throw new Error(result.errors.join("; "));
  if (product.model3D.privateNodes || product.model3D.url?.startsWith("blob:"))
    throw new Error(
      "This project needs its model file. Restore a complete model backup instead.",
    );
  const records = readLocal("inside-projects-v1", projectsSchema, []);
  writeLocal("inside-projects-v1", [
    ...records.filter((p) => p.id !== product.id),
    result.product,
  ]);
}

export async function deleteWorkshopProject(project: WorkshopProject) {
  if (project.kind === "model")
    await privateProjects("delete", undefined, project.record.id);
  else {
    const records = readLocal("inside-projects-v1", projectsSchema, []);
    writeLocal(
      "inside-projects-v1",
      records.filter((p) => p.id !== project.product.id),
    );
  }
}

export async function exportWorkshopProject(project: WorkshopProject) {
  if (project.kind === "model") return exportPrivateProject(project.record);
  downloadJson(
    { version: 1, product: project.product, model: null },
    "oynx-project.json",
  );
}

export async function restoreWorkshopProject(file: File) {
  if (file.size > 72 * 1024 * 1024)
    throw new Error("Project backup exceeds 72 MB.");
  const input = JSON.parse(await file.text());
  if (!input || typeof input !== "object")
    throw new Error("Choose a valid project JSON or backup.");
  if (input.version !== undefined && input.version !== 1)
    throw new Error("Unsupported backup version.");
  if (input.version === 1 && input.model != null) {
    const record = await importPrivateProject(file);
    await privateProjects("save", record);
    return;
  }
  const result = validateProduct(input.version === 1 ? input.product : input);
  if (!result.product) throw new Error(result.errors.join("; "));
  saveSchematic(result.product);
}
