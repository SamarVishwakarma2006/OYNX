import { smartphone, demoSource } from "./smartphone";
import type {
  Component,
  Dependency,
  Product,
  Provenance,
} from "../lib/product";

const repairManual: Provenance = {
  sourceType: "serviceManual",
  sourceTitle: "Apple iPhone 17 Pro Max Internal View and Exploded View",
  sourceUrl: "https://support.apple.com/en-ie/124264",
  confidence: 0.98,
  verified: true,
  lastUpdated: "2026-04-22",
};
const appleHardware: Provenance = {
  sourceType: "manufacturer",
  sourceTitle: "Apple iPhone 17 Pro and iPhone 17 Pro Max announcement",
  sourceUrl:
    "https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/",
  confidence: 0.98,
  verified: true,
  lastUpdated: "2025-09-09",
};

type PartSeed = {
  id: string;
  name: string;
  systemId: string;
  detail: NonNullable<Component["geometry"]["detail"]>;
  position: [number, number, number];
  size: [number, number, number];
  explode: [number, number, number];
  color: string;
  description: string;
  source?: Provenance;
  exterior?: boolean;
};

const partSeeds: PartSeed[] = [
  {
    id: "display",
    name: "Super Retina XDR display assembly",
    systemId: "display",
    detail: "screen",
    position: [0, 0, 0.42],
    size: [3.04, 6.12, 0.1],
    explode: [0, 0, 2.25],
    color: "#293747",
    description: "Front display assembly with OLED and touch layers.",
    exterior: true,
  },
  {
    id: "display-adhesive",
    name: "Display adhesive",
    systemId: "display",
    detail: "adhesive",
    position: [0, 0, 0.35],
    size: [2.94, 6, 0.025],
    explode: [0, 0, 1.9],
    color: "#c6a66d",
    description: "Perimeter adhesive layer shown as a thin schematic gasket.",
  },
  {
    id: "display-cowling",
    name: "Display connector cowling",
    systemId: "display",
    detail: "cowling",
    position: [0.67, 2.45, 0.2],
    size: [0.42, 0.18, 0.035],
    explode: [0, 0, 1.2],
    color: "#8792a0",
    description: "Small metal shield over the display connection.",
  },
  {
    id: "battery-cowling",
    name: "Battery connector cowling",
    systemId: "power",
    detail: "cowling",
    position: [0.72, 0.72, 0.1],
    size: [0.42, 0.2, 0.04],
    explode: [0, 0, 0.85],
    color: "#8b929b",
    description: "Protective metal cover over the battery connector.",
  },
  {
    id: "battery",
    name: "Lithium-ion battery",
    systemId: "power",
    detail: "battery",
    position: [-0.16, -0.62, 0],
    size: [1.92, 3.55, 0.24],
    explode: [0, 0, 0.38],
    color: "#bd9c60",
    description:
      "Rechargeable battery pack. Its silhouette and placement are schematic.",
  },
  {
    id: "top-speaker-grille",
    name: "Top speaker grille",
    systemId: "audio",
    detail: "grille",
    position: [0, 2.92, 0.26],
    size: [0.76, 0.12, 0.025],
    explode: [0, 0, 1.15],
    color: "#788392",
    description: "Fine acoustic grille above the display.",
  },
  {
    id: "top-speaker",
    name: "Top speaker",
    systemId: "audio",
    detail: "speaker",
    position: [0, 2.76, 0.12],
    size: [0.78, 0.28, 0.12],
    explode: [0, 0, 0.75],
    color: "#9ea8b6",
    description: "Earpiece speaker assembly.",
  },
  {
    id: "camera-cowling",
    name: "Rear camera connector cowling",
    systemId: "camera",
    detail: "cowling",
    position: [-0.95, 2.1, -0.02],
    size: [0.58, 0.2, 0.035],
    explode: [0, 0, 1.1],
    color: "#8b949d",
    description: "Metal shield that secures the rear camera connectors.",
  },
  {
    id: "battery-spacer",
    name: "Battery spacer",
    systemId: "power",
    detail: "spacer",
    position: [0.05, 1.33, -0.04],
    size: [1.65, 0.16, 0.045],
    explode: [0, 0, 0.45],
    color: "#9da7ae",
    description: "Thin support piece shown in Apple’s exploded assembly.",
  },
  {
    id: "camera",
    name: "48 MP Fusion rear camera assembly",
    systemId: "camera",
    detail: "lens",
    position: [-0.97, 2.03, -0.2],
    size: [1.22, 1.2, 0.4],
    explode: [0, 0, -1.15],
    color: "#3f526c",
    description:
      "The replaceable rear camera assembly contains the Main, Ultra Wide and Telephoto cameras.",
  },
  {
    id: "front-camera-cowling",
    name: "Front camera connector cowling",
    systemId: "camera",
    detail: "cowling",
    position: [0, 2.82, 0.21],
    size: [0.34, 0.2, 0.035],
    explode: [0, 0, 1.45],
    color: "#9099a3",
    description: "Small cover over the front camera connector.",
  },
  {
    id: "front-camera",
    name: "18 MP Center Stage front camera",
    systemId: "camera",
    detail: "front-camera",
    position: [0, 2.78, 0.12],
    size: [0.38, 0.34, 0.16],
    explode: [0, 0, 1.05],
    color: "#495b76",
    description:
      "Front-facing camera assembly; exact sensor geometry is not supplied by the exterior model.",
    source: appleHardware,
  },
  {
    id: "logic-board-cowling",
    name: "Logic board connector cowling",
    systemId: "compute",
    detail: "cowling",
    position: [0.68, 1.2, 0.05],
    size: [0.56, 0.18, 0.035],
    explode: [0, 0, 0.92],
    color: "#89949e",
    description: "Metal shield for logic board connectors.",
  },
  {
    id: "logic-board-spacer",
    name: "Logic board spacer",
    systemId: "compute",
    detail: "spacer",
    position: [0.1, 0.56, -0.06],
    size: [1.36, 0.12, 0.045],
    explode: [0, 0, 0.58],
    color: "#9ea8ad",
    description: "Thin structural spacer shown in Apple’s exploded assembly.",
  },
  {
    id: "bottom-speaker",
    name: "Bottom speaker",
    systemId: "audio",
    detail: "speaker",
    position: [0.62, -2.65, 0.02],
    size: [1.06, 0.52, 0.17],
    explode: [0, 0, -0.5],
    color: "#8b96a5",
    description: "Lower loudspeaker module.",
  },
  {
    id: "board",
    name: "Logic board",
    systemId: "compute",
    detail: "circuit",
    position: [0.13, 1.78, -0.15],
    size: [1.56, 2, 0.16],
    explode: [0, 0, -0.82],
    color: "#337568",
    description:
      "Main printed circuit board; board outline, chips and placement are schematic.",
  },
  {
    id: "taptic-engine",
    name: "Taptic Engine",
    systemId: "haptics",
    detail: "taptic",
    position: [0.77, -1.95, -0.1],
    size: [0.72, 0.56, 0.3],
    explode: [0, 0, -0.82],
    color: "#818b96",
    description: "Linear actuator that produces haptic feedback.",
  },
  {
    id: "mmwave-cowling",
    name: "mmWave connector cowling",
    systemId: "connectivity",
    detail: "cowling",
    position: [1.26, 0.68, -0.18],
    size: [0.34, 0.18, 0.035],
    explode: [0, 0, -1.16],
    color: "#89939b",
    description:
      "Connector shield present on applicable regional configurations.",
  },
  {
    id: "main-microphone",
    name: "Main microphone",
    systemId: "audio",
    detail: "microphone",
    position: [0.98, -2.88, 0.08],
    size: [0.26, 0.24, 0.12],
    explode: [0, 0, -1.15],
    color: "#c3a66c",
    description: "Primary microphone module near the bottom edge.",
  },
  {
    id: "usb-c",
    name: "USB-C connector",
    systemId: "power",
    detail: "port",
    position: [0, -3.03, 0.08],
    size: [0.68, 0.32, 0.2],
    explode: [0, 0, -1.5],
    color: "#aab2bd",
    description: "Wired charging and data connector assembly.",
  },
  {
    id: "enclosure",
    name: "Aluminium unibody enclosure",
    systemId: "structure",
    detail: "enclosure",
    position: [0, 0, -0.34],
    size: [3.15, 6.22, 0.18],
    explode: [0, 0, -2.45],
    color: "#8b99a8",
    description:
      "Structural aluminium enclosure; the vapor chamber is laser-welded into the unibody.",
    exterior: true,
    source: appleHardware,
  },
  {
    id: "back-glass-cowling",
    name: "Back glass connector cowling",
    systemId: "structure",
    detail: "cowling",
    position: [0.88, 0.08, -0.28],
    size: [0.32, 0.16, 0.035],
    explode: [0, 0, -1.45],
    color: "#9099a3",
    description: "Small cover at the back glass connector.",
  },
  {
    id: "back-glass-adhesive",
    name: "Back glass adhesive",
    systemId: "structure",
    detail: "adhesive",
    position: [0, 0, -0.44],
    size: [2.99, 6.02, 0.025],
    explode: [0, 0, -2.05],
    color: "#bf9d64",
    description: "Perimeter adhesive layer shown as a thin schematic gasket.",
  },
  {
    id: "back-glass",
    name: "Ceramic Shield back glass",
    systemId: "structure",
    detail: "glass",
    position: [0, 0, -0.53],
    size: [3.1, 6.16, 0.07],
    explode: [0, 0, -2.8],
    color: "#405061",
    description: "Removable rear glass assembly.",
    exterior: true,
    source: appleHardware,
  },
  {
    id: "vapor-chamber",
    name: "Laser-welded vapor chamber",
    systemId: "thermal",
    detail: "vapor-chamber",
    position: [-0.03, 0.83, -0.01],
    size: [1.78, 2.2, 0.08],
    explode: [0, 0, -0.22],
    color: "#ad7960",
    description:
      "Apple-designed vapor chamber transfers heat into the aluminium unibody.",
    source: appleHardware,
  },
  {
    id: "a19-pro",
    name: "A19 Pro system-on-chip",
    systemId: "compute",
    detail: "chip",
    position: [0.18, 1.76, 0.04],
    size: [0.58, 0.62, 0.12],
    explode: [0, 0, 0.85],
    color: "#aeb9c6",
    description:
      "A19 Pro package on the logic board; shown as a schematic die, not a chip-level scan.",
    source: appleHardware,
  },
  {
    id: "wireless-coil",
    name: "Wireless charging coil assembly",
    systemId: "power",
    detail: "coil",
    position: [0, -0.08, -0.32],
    size: [2.2, 2.2, 0.045],
    explode: [0, 0, -1.72],
    color: "#c9a56d",
    description:
      "Wireless charging receiver assembly; its exact service boundary is not shown in Apple’s public exploded view.",
    source: demoSource,
  },
];

const systemNames = [
  { id: "structure", name: "Structure & covers" },
  { id: "display", name: "Display" },
  { id: "power", name: "Power & charging" },
  { id: "compute", name: "Compute" },
  { id: "camera", name: "Camera & sensing" },
  { id: "audio", name: "Audio" },
  { id: "haptics", name: "Haptics" },
  { id: "thermal", name: "Thermal management" },
  { id: "connectivity", name: "Connectivity" },
];

const byId = new Map(smartphone.components.map((c) => [c.id, c]));
const components: Component[] = partSeeds.map((part) => {
  const templateId =
    part.systemId === "structure"
      ? "housing"
      : part.systemId === "display"
        ? "display"
        : part.systemId === "power"
          ? "battery"
          : part.systemId === "compute"
            ? "board"
            : part.systemId === "camera"
              ? "camera"
              : part.systemId === "audio"
                ? "speaker"
                : part.systemId === "haptics"
                  ? "speaker"
                  : part.systemId === "thermal"
                    ? "thermal"
                    : "wireless";
  const template = byId.get(templateId)!;
  const source = part.source ?? repairManual;
  const verifiedPart = source !== demoSource;
  const step = `Inspect the ${part.name} in the schematic. Confirm the exact model and follow Apple’s current service procedure before any physical repair.`;
  return {
    ...template,
    id: part.id,
    productId: "iphone-exterior-study",
    name: part.name,
    category: part.systemId,
    systemId: part.systemId,
    description: part.description,
    function: part.description,
    purpose: part.description,
    parentComponentId: part.id === "enclosure" ? undefined : "enclosure",
    modelNodeIds: [part.id],
    technicalSpecifications: {
      Evidence: verifiedPart
        ? "Assembly name appears in Apple documentation"
        : "Illustrative subsystem; public part boundary unavailable",
      Geometry: "Schematic shape and placement; not manufacturer CAD",
    },
    provenance: source,
    factSources: { assembly: source },
    evidence: {
      status: verifiedPart ? "observed" : "inferred",
      note: verifiedPart
        ? "Apple documentation lists this assembly. The geometry, dimensions and exact placement in this twin remain schematic."
        : "This subsystem is included for learning. Its separate component boundary and exact placement are not confirmed by the public exploded view.",
    },
    failureModes: template.failureModes,
    safetyNotes: [
      "Educational model only. It is not a step-by-step repair guide.",
      ...(part.systemId === "power"
        ? [
            "Lithium-ion battery service can cause fire or injury. Follow Apple’s safety procedure or use a qualified repair provider.",
          ]
        : []),
    ],
    geometry: {
      position: part.position,
      size: part.size,
      explodedOffset: part.explode,
      color: part.color,
      exterior: part.exterior ?? false,
      detail: part.detail,
    },
    repair: {
      ...template.repair,
      steps: [{ text: step, componentIds: [part.id] }],
      category: "Assembly identification",
    },
    replacement: {
      query: `iPhone 17 Pro Max ${part.name}`,
      requirements: { model: "iPhone 17 Pro Max", assembly: part.name },
    },
  };
});

const relationships: [string, string, Dependency["dependencyType"]][] = [
  ["usb-c", "board", "power"],
  ["battery", "board", "power"],
  ["board", "display", "data"],
  ["board", "camera", "data"],
  ["board", "front-camera", "data"],
  ["board", "top-speaker", "electrical"],
  ["board", "bottom-speaker", "electrical"],
  ["board", "taptic-engine", "electrical"],
  ["board", "main-microphone", "data"],
  ["enclosure", "board", "structural"],
  ["enclosure", "vapor-chamber", "thermal"],
  ["vapor-chamber", "a19-pro", "thermal"],
  ["enclosure", "back-glass", "structural"],
  ["enclosure", "display", "structural"],
  ["battery", "wireless-coil", "power"],
];
const dependencies: Dependency[] = relationships.map(
  ([sourceComponentId, targetComponentId, dependencyType], i) => ({
    id: `iphone-edge-${i}`,
    sourceComponentId,
    targetComponentId,
    dependencyType,
    criticality: "medium",
    required: true,
    propagation: "degraded",
    description: `${components.find((c) => c.id === targetComponentId)!.name} is associated with ${components.find((c) => c.id === sourceComponentId)!.name} in this educational relationship map.`,
    provenance: demoSource,
  }),
);

export const iphone: Product = {
  ...smartphone,
  id: "iphone-exterior-study",
  name: "iPhone 17 Pro Max · schematic twin",
  manufacturer: "Apple · exterior model by MajdyModels",
  model: "Exterior + schematic assemblies",
  description:
    "An artist-made exterior model paired with a 27-part schematic based on Apple’s published service exploded view and hardware announcement. The internal meshes are illustrative, not scanned CAD.",
  model3D: { type: "procedural", exteriorUrl: "/models/iphone-17-pro-max.glb" },
  components,
  dependencies,
  systems: systemNames,
  specifications: {
    "Model fidelity": "Artist-made exterior + schematic internal assemblies",
    "Assemblies shown": String(components.length),
    "Service evidence": "Apple iPhone 17 Pro Max service manual",
  },
  dataSources: [repairManual, appleHardware, demoSource],
  documentation: [
    {
      title: "Apple · iPhone 17 Pro Max internal view and exploded view",
      url: "https://support.apple.com/en-ie/124264",
    },
    {
      title: "Apple · iPhone 17 Pro Max repair manual",
      url: "https://support.apple.com/en-ie/124278",
    },
    {
      title: "Apple · iPhone 17 Pro and Pro Max hardware announcement",
      url: "https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/",
    },
    {
      title: "iPhone 17 Pro Max by MajdyModels · CC BY 4.0",
      url: "https://sketchfab.com/3d-models/iphone-17-pro-max-87fc1df741384124a8ce0226d2b2058d",
    },
  ],
};
