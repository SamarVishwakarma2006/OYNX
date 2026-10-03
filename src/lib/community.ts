import { z } from "zod";
import {
  type Product,
  type Provenance,
  validateProduct,
  productSchema,
} from "./product";

export const draftPartSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    purpose: z.string().trim().min(1).max(500),
    status: z.enum(["observed", "inferred", "unknown"]),
    note: z.string().trim().max(2000),
  })
  .refine(
    (p) => p.status !== "observed" || p.note.length > 0,
    "Describe the observation before marking it observed.",
  );
export type DraftPart = z.infer<typeof draftPartSchema>;
export function buildProduct(name: string, parts: DraftPart[]): Product {
  const title = z.string().trim().min(1).max(100).parse(name);
  const checked = z.array(draftPartSchema).min(1).max(30).parse(parts);
  const id = crypto.randomUUID();
  const source: Provenance = {
    sourceType: "userProvided",
    sourceTitle: "Contributor's local device record",
    confidence: 0,
    verified: false,
    lastUpdated: new Date().toISOString(),
  };
  const product: Product = {
    id,
    name: title,
    manufacturer: "Unknown",
    model: "Community schematic",
    category: "User-documented device",
    description:
      "A manually documented schematic. Geometry is an abstract layout, not CAD or a disassembly sequence.",
    images: [],
    model3D: { type: "procedural" },
    components: checked.map((p, i) => ({
      id: `part-${i}`,
      productId: id,
      name: p.name,
      category: "documented component",
      description: p.purpose,
      function: p.purpose,
      purpose: p.purpose,
      systemId: "assembly",
      modelNodeIds: [`part-${i}`],
      technicalSpecifications: {},
      provenance: source,
      evidence: { status: p.status, note: p.note },
      factSources: {},
      failureModes: ["COMPLETE_FAILURE"],
      safetyNotes: [
        "No validated repair procedure supplied. Consult a qualified repairer before disassembly.",
      ],
      geometry: {
        position: [
          ((i % 3) - 1) * 1.6,
          (Math.floor((checked.length - 1) / 3) / 2 - Math.floor(i / 3)) * 1.25,
          0,
        ],
        size: [1.3, 0.85, 0.3],
        explodedOffset: [0, 0, i % 2 ? 1.5 : -1.5],
        color:
          p.status === "observed"
            ? "#78b99b"
            : p.status === "inferred"
              ? "#cea86c"
              : "#7f8d9d",
        exterior: false,
      },
      repair: {
        symptoms: [],
        causes: [],
        tools: [],
        preparation: [],
        difficulty: "professional",
        category: "Not documented",
        steps: [],
        verification: [],
      },
      replacement: { query: `${title} ${p.name}`, requirements: {} },
    })),
    dependencies: [],
    systems: [{ id: "assembly", name: "Documented components" }],
    specifications: {
      Geometry: "Abstract schematic; not measured",
      Dependencies: "Not documented",
    },
    documentation: [],
    dataSources: [source],
    confidence: 0,
  };
  const result = validateProduct(product);
  if (!result.product || result.errors.length)
    throw new Error(result.errors.join("; "));
  return result.product;
}
export const outcomeSchema = z.object({
  id: z.string(),
  product: z.string().trim().min(1).max(100),
  issue: z.string().trim().min(1).max(1000),
  outcome: z.enum(["Repaired", "Reused for parts", "Recycled", "Unresolved"]),
  notes: z.string().max(2000),
  date: z.string().date(),
});
export type Outcome = z.infer<typeof outcomeSchema>;
export const projectsSchema = z.array(productSchema);
export const outcomesSchema = z.array(outcomeSchema);
export function readLocal<T>(key: string, schema: z.ZodType<T>, empty: T): T {
  const raw = localStorage.getItem(key);
  return raw === null ? empty : schema.parse(JSON.parse(raw));
}
export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error(
      "Browser storage is unavailable or full. Your form is still here; use an available export option or free storage before leaving.",
    );
  }
}
export function downloadJson(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
