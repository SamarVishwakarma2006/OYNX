import { describe, expect, it } from "vitest";
import { iphone } from "./iphone";
import { validateProduct } from "../lib/product";

describe("iPhone schematic twin", () => {
  it("contains valid, connected service assemblies and labels illustrative geometry", () => {
    const result = validateProduct(iphone);
    expect(result.errors).toEqual([]);

    const parts = new Map(iphone.components.map((part) => [part.id, part]));
    expect(parts.has("usb-c")).toBe(true);
    expect(parts.has("taptic-engine")).toBe(true);
    expect(parts.has("vapor-chamber")).toBe(true);
    expect(parts.get("wireless-coil")?.evidence?.status).toBe("inferred");
    expect(parts.get("front-camera")?.geometry.detail).toBe("front-camera");
    expect(iphone.components.every((part) => part.geometry.detail)).toBe(true);
  });
});
