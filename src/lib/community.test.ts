import { expect, it } from "vitest";
import { buildProduct, draftPartSchema, outcomeSchema } from "./community";
import { validateProduct } from "./product";
import { iphone } from "../data/iphone";

it("builds valid, explicitly unverified schematics without invented dependencies or repair steps", () => {
  const p = buildProduct("Desk fan", [
    {
      name: "Guard",
      purpose: "Covers blades",
      status: "observed",
      note: "Visible mesh surrounding the blades",
    },
  ]);
  expect(validateProduct(p).errors).toEqual([]);
  expect(p.dependencies).toEqual([]);
  expect(p.components[0].repair.steps).toEqual([]);
  expect(p.components[0].provenance.verified).toBe(false);
  expect(p.components[0].evidence?.status).toBe("observed");
  expect(
    draftPartSchema.safeParse({
      name: "Guard",
      purpose: "Protects",
      status: "observed",
      note: " ",
    }).success,
  ).toBe(false);
  expect(validateProduct(iphone).errors).toEqual([]);
  expect(
    outcomeSchema.safeParse({
      id: "a",
      product: "Fan",
      issue: "Noise",
      outcome: "Repaired",
      notes: "",
      date: "invalid",
    }).success,
  ).toBe(false);
});
