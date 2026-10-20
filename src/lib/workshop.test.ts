import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { smartphone } from "../data/smartphone";
import { privateProjects } from "./private-project";
import {
  deleteWorkshopProject,
  listWorkshopProjects,
  restoreWorkshopProject,
} from "./workshop";
vi.mock("./private-project", () => ({
  privateProjects: vi.fn(),
  exportPrivateProject: vi.fn(),
  importPrivateProject: vi.fn(),
}));
let storage: Map<string, string>;
beforeEach(() => {
  storage = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  vi.mocked(privateProjects).mockReset().mockResolvedValue([]);
});
afterEach(() => vi.unstubAllGlobals());
describe("Workshop project compatibility", () => {
  it("lists legacy schematics beside model records without rewriting either", async () => {
    const legacy = JSON.stringify([smartphone]);
    storage.set("inside-projects-v1", legacy);
    const record = {
      id: "private",
      name: "Private model",
      file: new Blob(),
      product: { ...smartphone, id: "private", name: "Private model" },
    };
    vi.mocked(privateProjects).mockResolvedValue([record]);
    const result = await listWorkshopProjects();
    expect(result.projects.map((p) => p.kind)).toEqual(["schematic", "model"]);
    expect(storage.get("inside-projects-v1")).toBe(legacy);
    expect(result.errors).toEqual([]);
    await deleteWorkshopProject(result.projects[0]);
    expect(JSON.parse(storage.get("inside-projects-v1")!)).toEqual([]);
    expect(privateProjects).toHaveBeenCalledTimes(1);
  });
  it("keeps readable projects available when the other store fails", async () => {
    storage.set("inside-projects-v1", JSON.stringify([smartphone]));
    vi.mocked(privateProjects).mockRejectedValue(new Error("unavailable"));
    const result = await listWorkshopProjects();
    expect(result.projects).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });
  it("restores legacy JSON and new schematic backups and rejects nonportable blob references", async () => {
    await restoreWorkshopProject(
      new File([JSON.stringify(smartphone)], "legacy.json"),
    );
    const revised = { ...smartphone, name: "Updated schematic" };
    await restoreWorkshopProject(
      new File(
        [JSON.stringify({ version: 1, product: revised, model: null })],
        "backup.json",
      ),
    );
    expect(JSON.parse(storage.get("inside-projects-v1")!)).toHaveLength(1);
    expect(JSON.parse(storage.get("inside-projects-v1")!)[0].name).toBe(
      "Updated schematic",
    );
    const invalid = {
      ...smartphone,
      model3D: { type: "gltf", url: "blob:http://localhost/expired" },
    };
    await expect(
      restoreWorkshopProject(
        new File([JSON.stringify(invalid)], "broken.json"),
      ),
    ).rejects.toThrow("model file");
    expect(JSON.parse(storage.get("inside-projects-v1")!)[0].name).toBe(
      "Updated schematic",
    );
  });
});
