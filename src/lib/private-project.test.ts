import { describe, expect, it } from "vitest";
import { Group, Mesh } from "three";
import {
  checkGlb,
  mappedProduct,
  namePrivateNodes,
  parsePartsCsv,
} from "./private-project";
import { prepareModel, componentForNode } from "./model";
import { validateProduct } from "./product";
function glb(json: unknown) {
  const text = JSON.stringify(json);
  const padded = text + " ".repeat((4 - (text.length % 4)) % 4);
  const buffer = new ArrayBuffer(20 + padded.length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, padded.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(buffer, 20).set(new TextEncoder().encode(padded));
  return buffer;
}
describe("private model workflow", () => {
  it("rejects malformed GLB and external resources before loading", () => {
    expect(() => checkGlb(new ArrayBuffer(4))).toThrow();
    expect(() =>
      checkGlb(
        glb({ images: [{ uri: "https://example.com/private-texture.png" }] }),
      ),
    ).toThrow("External resources");
    expect(() =>
      checkGlb(glb({ buffers: [{ uri: "../secret.bin" }] })),
    ).toThrow();
    expect(() =>
      checkGlb(
        glb({ buffers: [{ byteLength: 8 }], images: [{ bufferView: 0 }] }),
      ),
    ).not.toThrow();
  });
  it("handles quoted CSV, BOM, CRLF and incomplete quotes", () => {
    expect(
      parsePartsCsv(
        '\uFEFFname,mesh\r\n"Battery, main",cell\r\n"Shield ""A""",shield',
      ),
    ).toEqual([
      { name: "Battery, main", mesh: "cell" },
      { name: 'Shield "A"', mesh: "shield" },
    ]);
    expect(() => parsePartsCsv('name\n"broken')).toThrow();
    expect(() => parsePartsCsv("mesh\nabc")).toThrow();
  });
  it("maps multiple unnamed meshes to one component and reopens stable identities", () => {
    const scene = new Group();
    scene.add(new Mesh(), new Mesh());
    const copy = scene.clone(true);
    namePrivateNodes(copy);
    const parts = copy.children.map((mesh) => ({
      id: mesh.name,
      label: "unnamed",
      position: [0, 0, 0] as [number, number, number],
      size: [1, 1, 1] as [number, number, number],
    }));
    const assignments = Object.fromEntries(parts.map((p) => [p.id, "Battery"]));
    const product = mappedProduct(
      "Local device",
      parts,
      assignments,
      "blob:http://localhost/test",
      [0, 0, 0],
      1,
    );
    expect(product.components).toHaveLength(1);
    expect(product.components[0].modelNodeIds).toHaveLength(2);
    const prepared = prepareModel(scene, product);
    expect(componentForNode(prepared.root.children[1], product)?.name).toBe(
      "Battery",
    );
    expect(() =>
      mappedProduct(
        "Local device",
        parts,
        {},
        "blob:http://localhost/test",
        [0, 0, 0],
        1,
      ),
    ).toThrow();
    expect(
      validateProduct({
        ...product,
        model3D: { type: "gltf", url: "javascript:alert(1)" },
      }).product,
    ).toBeNull();
    prepared.dispose();
  });
});
