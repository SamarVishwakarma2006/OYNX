import { smartphone } from "./smartphone";
import type { Product } from "../lib/product";

export const iphone: Product = {
  ...smartphone,
  id: "iphone-exterior-study",
  name: "iPhone 17 Pro Max · learning model",
  manufacturer: "Apple · exterior represented by MajdyModels",
  model: "Exterior + schematic study",
  description:
    "Artist-created exterior paired with generic educational internals. Internal layout, dependencies and repair steps are not verified for this iPhone.",
  model3D: { type: "procedural", exteriorUrl: "/models/iphone-17-pro-max.glb" },
  components: smartphone.components.map((c) => ({
    ...c,
    productId: "iphone-exterior-study",
    evidence: {
      status: "inferred",
      note: "Generic educational component. Neither geometry nor repair instructions are verified for iPhone 17 Pro Max.",
    },
  })),
  documentation: [
    {
      title: "iPhone 17 Pro Max by MajdyModels · CC BY 4.0",
      url: "https://sketchfab.com/3d-models/iphone-17-pro-max-87fc1df741384124a8ce0226d2b2058d",
    },
  ],
};
