import { test, expect } from "@playwright/test";

test("private GLB maps, saves, survives refresh, exports and restores", async ({
  page,
}) => {
  const vertices = Buffer.from(
    new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]).buffer,
  );
  const json = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [
      { name: "Cell", mesh: 0 },
      { name: "Shield", mesh: 0, translation: [0, 0, 1] },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true }],
    buffers: [{ byteLength: vertices.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: vertices.length }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
        min: [-1, -1, 0],
        max: [1, 1, 0],
      },
    ],
  };
  const text = JSON.stringify(json),
    padded = text + " ".repeat((4 - (text.length % 4)) % 4);
  const buffer = Buffer.alloc(28 + padded.length + vertices.length);
  buffer.writeUInt32LE(0x46546c67, 0);
  buffer.writeUInt32LE(2, 4);
  buffer.writeUInt32LE(buffer.length, 8);
  buffer.writeUInt32LE(padded.length, 12);
  buffer.writeUInt32LE(0x4e4f534a, 16);
  buffer.write(padded, 20);
  buffer.writeUInt32LE(vertices.length, 20 + padded.length);
  buffer.writeUInt32LE(0x004e4942, 24 + padded.length);
  vertices.copy(buffer, 28 + padded.length);
  await page.goto("/");
  await expect(page.getByLabel("3D assembly")).toHaveCount(0);
  await page.getByRole("link", { name: "Open Workshop" }).click();
  await expect(page).toHaveURL(/\/workshop$/);
  const workspace = page.locator("#private-models");
  const library = page.locator(".workshop-library");
  await workspace.getByLabel("3D assembly").setInputFiles({
    name: "Private test.glb",
    mimeType: "model/gltf-binary",
    buffer,
  });
  await expect(
    workspace.getByText("2 meshes found.", { exact: false }),
  ).toBeVisible();
  await workspace.getByLabel("Parts list CSV").setInputFiles({
    name: "parts.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,mesh\nBattery,Cell\nHeat shield,Shield"),
  });
  await expect(workspace.getByLabel("Component name").first()).toHaveValue(
    "Battery",
  );
  await workspace.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this browser" }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await library.getByRole("button", { name: "Export backup" }).click();
  const download = await downloadPromise;
  const backup = await download.path();
  await page.reload();
  await expect(
    library.getByRole("button", { name: "Export backup" }),
  ).toBeVisible();
  await library.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByText("GLTF MODEL READY")).toBeVisible();
  await page.getByRole("button", { name: "Battery", exact: true }).click();
  await expect(page.locator(".inspector h2")).toHaveText("Battery");
  await page.getByRole("link", { name: "Workshop", exact: true }).click();
  await expect(library).toBeVisible();
  await library.getByRole("button", { name: "Delete local copy" }).click();
  await expect(
    library.getByRole("button", { name: "Export backup" }),
  ).toHaveCount(0);
  await library
    .getByLabel("Restore project backup or JSON")
    .setInputFiles(backup!);
  await expect(
    page.getByText("Project restored locally. Open it below."),
  ).toBeVisible();
  await expect(
    library.getByRole("button", { name: "Open", exact: true }),
  ).toBeVisible();
});
