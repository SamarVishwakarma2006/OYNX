"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  ContactShadows,
  Grid,
  Html,
  OrbitControls,
  RoundedBox,
  useGLTF,
} from "@react-three/drei";
import { Box3, Group, Mesh, MeshStandardMaterial, Shape, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useWorkspace } from "../lib/store";
import type { Component } from "../lib/product";
import { ErrorBoundary } from "./ErrorBoundary";
import { AssetModel } from "./AssetModel";
import { PartDetail } from "./PartDetail";
import { componentForNode, prepareModel } from "../lib/model";

function positionOf(
  c: Component,
  mode: string,
  explosion: number,
  group: string,
) {
  return c.geometry.position.map(
    (v, i) =>
      v +
      (mode === "Exploded" && (group === "all" || c.systemId === group)
        ? c.geometry.explodedOffset[i] * explosion
        : 0),
  ) as [number, number, number];
}
function Piece({
  size,
  color,
  opacity,
  position = [0, 0, 0],
  metalness = 0.3,
  radius,
}: {
  size: [number, number, number];
  color: string;
  opacity: number;
  position?: [number, number, number];
  metalness?: number;
  radius?: number;
}) {
  return (
    <RoundedBox
      args={size}
      position={position}
      radius={radius ?? Math.max(0.008, Math.min(...size) * 0.12)}
      smoothness={3}
    >
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={0.38}
        transparent
        opacity={opacity}
        depthWrite={opacity > 0.5}
      />
    </RoundedBox>
  );
}

function BoardPart({
  size,
  color,
  opacity,
}: {
  size: [number, number, number];
  color: string;
  opacity: number;
}) {
  const [w, h, d] = size;
  const shape = useMemo(() => {
    const board = new Shape();
    board.moveTo(-w * 0.5 + 0.08, -h * 0.5);
    board.lineTo(w * 0.5, -h * 0.5);
    board.lineTo(w * 0.5, h * 0.5 - 0.14);
    board.lineTo(w * 0.5 - 0.18, h * 0.5);
    board.lineTo(-w * 0.5 + 0.18, h * 0.5);
    board.lineTo(-w * 0.5, h * 0.5 - 0.18);
    board.lineTo(-w * 0.5, -h * 0.5 + 0.08);
    board.closePath();
    return board;
  }, [w, h]);
  return (
    <mesh position={[0, 0, -d / 2]}>
      <extrudeGeometry args={[shape, { depth: d, bevelEnabled: false }]} />
      <meshStandardMaterial
        color={color}
        metalness={0.25}
        roughness={0.52}
        transparent
        opacity={opacity}
        depthWrite={opacity > 0.5}
      />
    </mesh>
  );
}

function PouchBattery({
  size,
  color,
  opacity,
}: {
  size: [number, number, number];
  color: string;
  opacity: number;
}) {
  const [w, h, d] = size;
  const outline = useMemo(() => {
    const shape = new Shape();
    const corner = Math.min(w, h) * 0.07;
    shape.moveTo(-w / 2 + corner, -h / 2);
    shape.lineTo(w / 2 - corner, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + corner);
    shape.lineTo(w / 2, h / 2 - corner);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - corner, h / 2);
    shape.lineTo(-w / 2 + corner, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - corner);
    shape.lineTo(-w / 2, -h / 2 + corner);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + corner, -h / 2);
    return shape;
  }, [h, w]);

  return (
    <mesh position={[0, 0, -d / 2]}>
      <extrudeGeometry args={[outline, { depth: d, bevelEnabled: false }]} />
      <meshStandardMaterial
        color={color}
        metalness={0.52}
        roughness={0.4}
        transparent
        opacity={opacity}
        depthWrite={opacity > 0.5}
      />
    </mesh>
  );
}

function PartBody({
  component,
  color,
  opacity,
}: {
  component: Component;
  color: string;
  opacity: number;
}) {
  const [w, h, d] = component.geometry.size;
  const detail = component.geometry.detail;
  const zFront = d / 2;
  const addMaterial = (partColor = color, metalness = 0.3) => (
    <meshStandardMaterial
      color={partColor}
      metalness={metalness}
      roughness={detail === "glass" || detail === "screen" ? 0.2 : 0.4}
      transparent
      opacity={opacity}
      depthWrite={opacity > 0.5}
    />
  );

  if (detail === "enclosure") {
    const rail = Math.max(0.08, Math.min(w, h) * 0.045);
    return (
      <group>
        <Piece
          size={[w, rail, d]}
          position={[0, h / 2 - rail / 2, 0]}
          color={color}
          opacity={opacity}
          metalness={0.78}
        />
        <Piece
          size={[w, rail, d]}
          position={[0, -h / 2 + rail / 2, 0]}
          color={color}
          opacity={opacity}
          metalness={0.78}
        />
        <Piece
          size={[rail, h - rail * 2, d]}
          position={[-w / 2 + rail / 2, 0, 0]}
          color={color}
          opacity={opacity}
          metalness={0.78}
        />
        <Piece
          size={[rail, h - rail * 2, d]}
          position={[w / 2 - rail / 2, 0, 0]}
          color={color}
          opacity={opacity}
          metalness={0.78}
        />
        <Piece
          size={[w * 0.34, h * 0.025, d * 1.2]}
          position={[-w * 0.29, h * 0.34, 0]}
          color={color}
          opacity={opacity}
          metalness={0.78}
        />
      </group>
    );
  }
  if (detail === "glass") {
    return (
      <Piece
        size={component.geometry.size}
        color={color}
        opacity={opacity}
        metalness={0.55}
        radius={Math.min(w, h) * 0.08}
      />
    );
  }
  if (detail === "screen") {
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color="#111a25"
          opacity={opacity}
          metalness={0.2}
          radius={Math.min(w, h) * 0.06}
        />
        <Piece
          size={[Math.min(0.48, w * 0.18), Math.min(0.14, h * 0.025), 0.012]}
          position={[0, h * 0.46, zFront + 0.007]}
          color="#05080d"
          opacity={opacity}
          metalness={0.05}
          radius={0.06}
        />
      </group>
    );
  }
  if (detail === "battery") {
    return (
      <group>
        <PouchBattery
          size={component.geometry.size}
          color={color}
          opacity={opacity}
        />
        <Piece
          size={[w * 0.72, Math.max(0.035, h * 0.018), d * 0.35]}
          position={[0, h * 0.43, 0]}
          color="#d2bb8b"
          opacity={opacity}
          metalness={0.75}
        />
        <Piece
          size={[w * 0.17, Math.max(0.05, h * 0.025), d * 0.45]}
          position={[w * 0.42, h * 0.39, zFront * 0.15]}
          color="#c39c50"
          opacity={opacity}
          metalness={0.78}
        />
      </group>
    );
  }
  if (detail === "circuit") {
    return (
      <group>
        <BoardPart
          size={component.geometry.size}
          color={color}
          opacity={opacity}
        />
        {[
          [-0.28, 0.25],
          [0.28, 0.31],
          [0.28, -0.29],
          [-0.3, -0.34],
        ].map(([x, y], i) => (
          <Piece
            key={i}
            size={[w * 0.17, h * 0.13, Math.max(0.035, d * 0.3)]}
            position={[x, y, zFront * 0.55]}
            color={i % 2 ? "#19232a" : "#b7a36c"}
            opacity={opacity}
            metalness={0.58}
            radius={0.035}
          />
        ))}
        <Piece
          size={[w * 0.48, Math.max(0.025, h * 0.025), d * 0.12]}
          position={[0, -h * 0.43, zFront * 0.62]}
          color="#d1b673"
          opacity={opacity}
          metalness={0.8}
        />
      </group>
    );
  }
  if (detail === "lens") {
    const radius = Math.min(w, h) * 0.23;
    const lensPoints: [number, number][] = [
      [-w * 0.24, h * 0.22],
      [w * 0.24, h * 0.22],
      [0, -h * 0.22],
    ];
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color="#192432"
          opacity={opacity}
          metalness={0.55}
          radius={Math.min(w, h) * 0.16}
        />
        {lensPoints.map(([x, y], i) => (
          <group key={i} position={[x, y, zFront + 0.015]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry
                args={[radius, radius, Math.max(0.055, d * 0.16), 32]}
              />
              {addMaterial(i === 1 ? "#b89254" : "#111820", 0.85)}
            </mesh>
            <mesh
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, Math.max(0.035, d * 0.09)]}
            >
              <cylinderGeometry
                args={[radius * 0.72, radius * 0.78, 0.035, 32]}
              />
              {addMaterial(i === 1 ? "#27435b" : "#10243a", 0.62)}
            </mesh>
          </group>
        ))}
      </group>
    );
  }
  if (detail === "front-camera") {
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color="#343f50"
          opacity={opacity}
          metalness={0.62}
          radius={Math.min(w, h) * 0.32}
        />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, zFront + 0.02]}>
          <cylinderGeometry
            args={[
              Math.min(w, h) * 0.31,
              Math.min(w, h) * 0.34,
              Math.max(0.035, d * 0.14),
              32,
            ]}
          />
          {addMaterial("#111923", 0.72)}
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, zFront + 0.055]}>
          <sphereGeometry args={[Math.min(w, h) * 0.2, 24, 16]} />
          {addMaterial("#244768", 0.65)}
        </mesh>
      </group>
    );
  }
  if (detail === "chip") {
    const pin = Math.max(0.025, Math.min(w, h) * 0.045);
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color="#727d88"
          opacity={opacity}
          metalness={0.72}
          radius={Math.min(w, h) * 0.14}
        />
        <Piece
          size={[w * 0.68, h * 0.68, d * 0.48]}
          position={[0, 0, zFront * 0.38]}
          color="#252c35"
          opacity={opacity}
          metalness={0.56}
          radius={Math.min(w, h) * 0.06}
        />
        <Piece
          size={[w * 0.52, h * 0.52, Math.max(0.025, d * 0.12)]}
          position={[0, 0, zFront * 0.72]}
          color="#465564"
          opacity={opacity}
          metalness={0.42}
          radius={Math.min(w, h) * 0.04}
        />
        {Array.from({ length: 4 }, (_, i) => (
          <Piece
            key={i}
            size={[w * 0.68, pin, Math.max(0.015, d * 0.1)]}
            position={[0, (i - 1.5) * h * 0.15, -zFront * 0.62]}
            color="#d3ba7b"
            opacity={opacity}
            metalness={0.84}
            radius={0.008}
          />
        ))}
      </group>
    );
  }
  if (detail === "speaker" || detail === "grille") {
    const rows = detail === "grille" ? 3 : 2;
    const columns = detail === "grille" ? 9 : 6;
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color={detail === "speaker" ? "#374451" : color}
          opacity={opacity}
          metalness={0.72}
          radius={Math.min(w, h) * 0.16}
        />
        {Array.from({ length: rows * columns }, (_, i) => {
          const x = ((i % columns) / Math.max(1, columns - 1) - 0.5) * w * 0.76;
          const y =
            (Math.floor(i / columns) / Math.max(1, rows - 1) - 0.5) * h * 0.5;
          return (
            <mesh key={i} position={[x, y, zFront + 0.008]}>
              <sphereGeometry args={[Math.min(w, h) * 0.018, 8, 6]} />
              {addMaterial("#121922", 0.2)}
            </mesh>
          );
        })}
      </group>
    );
  }
  if (detail === "port") {
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color={color}
          opacity={opacity}
          metalness={0.86}
          radius={Math.min(w, h) * 0.38}
        />
        <Piece
          size={[w * 0.56, h * 0.42, Math.max(0.025, d * 0.24)]}
          position={[0, 0, zFront + 0.012]}
          color="#111820"
          opacity={opacity}
          metalness={0.4}
          radius={Math.min(w, h) * 0.2}
        />
        <Piece
          size={[w * 0.3, Math.max(0.015, h * 0.065), Math.max(0.01, d * 0.1)]}
          position={[0, -h * 0.035, zFront + 0.023]}
          color="#c2a363"
          opacity={opacity}
          metalness={0.85}
          radius={0.008}
        />
      </group>
    );
  }
  if (detail === "coil") {
    const ring = Math.min(w, h) * 0.34;
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color="#283341"
          opacity={opacity}
          metalness={0.48}
          radius={Math.min(w, h) * 0.1}
        />
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0, zFront + i * 0.012]}>
            <torusGeometry
              args={[
                ring - i * 0.1,
                Math.max(0.015, Math.min(w, h) * 0.018),
                8,
                64,
              ]}
            />
            {addMaterial("#b98245", 0.88)}
          </mesh>
        ))}
      </group>
    );
  }
  if (detail === "taptic") {
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color="#75808b"
          opacity={opacity}
          metalness={0.78}
          radius={Math.min(w, h) * 0.15}
        />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, zFront * 0.55]}>
          <cylinderGeometry
            args={[Math.min(w, h) * 0.3, Math.min(w, h) * 0.3, d * 0.45, 28]}
          />
          {addMaterial("#373e47", 0.86)}
        </mesh>
        <mesh position={[0, 0, zFront + 0.02]}>
          <torusGeometry
            args={[
              Math.min(w, h) * 0.26,
              Math.max(0.014, Math.min(w, h) * 0.035),
              8,
              32,
            ]}
          />
          {addMaterial("#b8a06f", 0.8)}
        </mesh>
      </group>
    );
  }
  if (detail === "microphone") {
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color={color}
          opacity={opacity}
          metalness={0.8}
          radius={Math.min(w, h) * 0.4}
        />
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, zFront + 0.008]}>
          <cylinderGeometry
            args={[Math.min(w, h) * 0.19, Math.min(w, h) * 0.21, 0.018, 20]}
          />
          {addMaterial("#111820", 0.25)}
        </mesh>
      </group>
    );
  }
  if (detail === "adhesive") {
    const strip = Math.max(0.025, Math.min(w, h) * 0.035);
    return (
      <group>
        <Piece
          size={[w, strip, d]}
          position={[0, h / 2 - strip / 2, 0]}
          color={color}
          opacity={opacity}
          metalness={0.08}
          radius={strip / 3}
        />
        <Piece
          size={[w, strip, d]}
          position={[0, -h / 2 + strip / 2, 0]}
          color={color}
          opacity={opacity}
          metalness={0.08}
          radius={strip / 3}
        />
        <Piece
          size={[strip, h - strip * 2, d]}
          position={[-w / 2 + strip / 2, 0, 0]}
          color={color}
          opacity={opacity}
          metalness={0.08}
          radius={strip / 3}
        />
        <Piece
          size={[strip, h - strip * 2, d]}
          position={[w / 2 - strip / 2, 0, 0]}
          color={color}
          opacity={opacity}
          metalness={0.08}
          radius={strip / 3}
        />
      </group>
    );
  }
  if (detail === "spacer") {
    const bar = Math.max(0.045, Math.min(w, h) * 0.13);
    return (
      <group>
        <Piece
          size={[w * 0.68, bar, d]}
          color={color}
          opacity={opacity}
          metalness={0.75}
        />
        <Piece
          size={[bar, h, d]}
          position={[-w * 0.4, 0, 0]}
          color={color}
          opacity={opacity}
          metalness={0.75}
        />
        <Piece
          size={[bar, h, d]}
          position={[w * 0.4, 0, 0]}
          color={color}
          opacity={opacity}
          metalness={0.75}
        />
      </group>
    );
  }
  if (detail === "cowling") {
    return (
      <group>
        <BoardPart
          size={component.geometry.size}
          color={color}
          opacity={opacity}
        />
        <Piece
          size={[w * 0.58, Math.max(0.02, h * 0.12), d * 0.3]}
          position={[0, 0, zFront * 0.8]}
          color="#c7b17a"
          opacity={opacity}
          metalness={0.82}
        />
      </group>
    );
  }
  if (detail === "vapor-chamber") {
    return (
      <group>
        <Piece
          size={component.geometry.size}
          color={color}
          opacity={opacity}
          metalness={0.82}
          radius={Math.min(w, h) * 0.14}
        />
        <Piece
          size={[w * 0.76, Math.max(0.02, h * 0.018), d * 0.25]}
          position={[0, h * 0.19, zFront * 0.5]}
          color="#d2aa78"
          opacity={opacity}
          metalness={0.88}
        />
        <Piece
          size={[w * 0.7, Math.max(0.02, h * 0.018), d * 0.25]}
          position={[0, -h * 0.2, zFront * 0.5]}
          color="#d2aa78"
          opacity={opacity}
          metalness={0.88}
        />
      </group>
    );
  }
  return (
    <Piece size={component.geometry.size} color={color} opacity={opacity} />
  );
}

function Part({ component: c }: { component: Component }) {
  const s = useWorkspace();
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const selected = s.selectedComponentId === c.id;
  const status = s.compareBefore
    ? "healthy"
    : s.activeSimulation?.statuses[c.id];
  const color =
    status === "failed"
      ? "#e97676"
      : status === "degraded"
        ? "#e4b461"
        : c.geometry.color;
  const visible =
    !s.hiddenComponentIds.includes(c.id) &&
    (!s.isolatedComponentId || s.isolatedComponentId === c.id);
  const faded = s.focusedComponentId && s.focusedComponentId !== c.id;
  const opacity = faded
    ? 0.09
    : s.mode === "X-Ray" && c.geometry.exterior
      ? Math.max(0.06, 1 - s.xRayIntensity)
      : 1;
  const target = useMemo(
    () =>
      new Vector3(
        ...positionOf(c, s.mode, s.explosionFactor, s.explosionGroup),
      ),
    [c, s.mode, s.explosionFactor, s.explosionGroup],
  );
  const reduced = useRef(false);
  const originalColors = useRef(new WeakMap<MeshStandardMaterial, string>());
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = query.matches;
    const update = () => {
      reduced.current = query.matches;
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    ref.current?.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material]) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        if (!originalColors.current.has(material))
          originalColors.current.set(
            material,
            `#${material.color.getHexString()}`,
          );
        const original = originalColors.current.get(material)!;
        material.color.set(
          status === "failed" || status === "degraded" ? color : original,
        );
        material.opacity = opacity;
        material.transparent = true;
        material.depthWrite = opacity > 0.5;
        material.emissive.set(
          selected ? "#77dcb9" : hovered ? "#668bab" : "#000000",
        );
        material.emissiveIntensity = selected ? 0.4 : hovered ? 0.2 : 0;
      }
    });
  }, [color, hovered, opacity, selected, status]);
  useFrame((_, delta) => {
    ref.current?.position.lerp(
      target,
      reduced.current ? 1 : 1 - Math.exp(-delta * 10),
    );
  });
  return (
    <group
      ref={ref}
      position={c.geometry.position}
      visible={visible}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        if (s.mode === "X-Ray" && c.geometry.exterior && s.xRayIntensity > 0.4)
          return;
        e.stopPropagation();
        s.select(c.id);
      }}
    >
      <PartBody component={c} color={color} opacity={opacity} />
      <PartDetail component={c} opacity={opacity} />
      {s.mode === "Exploded" && selected && visible && (
        <Html
          center
          position={[0, c.geometry.size[1] / 2 + 0.3, 0]}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <span className="badge">
            {c.name} · {c.evidence?.status ?? "illustrative"}
          </span>
        </Html>
      )}
    </group>
  );
}

function ImportedModel() {
  const s = useWorkspace();
  const [hovered, setHovered] = useState<string | null>(null);
  const gltf = useGLTF(s.product.model3D.url!);
  const prepared = useMemo(
    () => prepareModel(gltf.scene, s.product),
    [gltf.scene, s.product],
  );
  const { root, originals } = prepared;
  useEffect(() => () => prepared.dispose(), [prepared]);
  useEffect(() => {
    useWorkspace.setState({ modelStatus: "loaded" });
  }, [prepared]);
  useFrame((_, delta) =>
    root.traverse((n) => {
      const c = componentForNode(n, s.product);
      if (!c) return;
      n.visible =
        !s.hiddenComponentIds.includes(c.id) &&
        (!s.isolatedComponentId || s.isolatedComponentId === c.id);
      if (c.modelNodeIds.includes(n.name)) {
        const target = originals.get(n.uuid)!.clone();
        if (
          s.mode === "Exploded" &&
          (s.explosionGroup === "all" || c.systemId === s.explosionGroup)
        )
          target.addScaledVector(
            new Vector3(...c.geometry.explodedOffset),
            s.explosionFactor,
          );
        n.position.lerp(
          target,
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 1
            : 1 - Math.exp(-delta * 10),
        );
      }
      if (n instanceof Mesh)
        for (const mat of Array.isArray(n.material)
          ? n.material
          : [n.material]) {
          mat.transparent = true;
          mat.opacity =
            s.focusedComponentId && s.focusedComponentId !== c.id
              ? 0.12
              : s.mode === "X-Ray" && c.geometry.exterior
                ? Math.max(0.06, 1 - s.xRayIntensity)
                : 1;
          mat.depthWrite = mat.opacity > 0.5;
          if (mat.emissive)
            mat.emissive.set(
              s.selectedComponentId === c.id
                ? "#467967"
                : hovered === c.id
                  ? "#314454"
                  : !s.compareBefore &&
                      s.activeSimulation?.statuses[c.id] === "failed"
                    ? "#a22d2d"
                    : !s.compareBefore &&
                        s.activeSimulation?.statuses[c.id] === "degraded"
                      ? "#926219"
                      : "#000000",
            );
        }
    }),
  );
  return (
    <primitive
      object={root}
      onPointerOver={(e: ThreeEvent<PointerEvent>) =>
        setHovered(componentForNode(e.object, s.product)?.id ?? null)
      }
      onPointerOut={() => setHovered(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        const c = e.intersections
          .map((hit) => componentForNode(hit.object, s.product))
          .find(
            (c) =>
              c &&
              !(
                s.mode === "X-Ray" &&
                c.geometry.exterior &&
                s.xRayIntensity > 0.4
              ),
          );
        if (c) {
          e.stopPropagation();
          s.select(c.id);
        }
      }}
    />
  );
}
function CameraRig() {
  const s = useWorkspace();
  const { camera, scene, size: viewportSize } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<{ position: Vector3; target: Vector3 } | null>(null);
  useEffect(() => {
    const c = s.product.components.find((c) => c.id === s.focusedComponentId);
    let target = c
      ? new Vector3(
          ...positionOf(c, s.mode, s.explosionFactor, s.explosionGroup),
        )
      : new Vector3();
    let size = c ? Math.max(...c.geometry.size) : 6;
    if (c && s.product.model3D.type === "gltf") {
      const node = scene.getObjectByName(c.modelNodeIds[0]);
      if (node) {
        const box = new Box3().setFromObject(node);
        target = box.getCenter(new Vector3());
        size = box.getSize(new Vector3()).length();
      }
    }
    if (!c) {
      const bounds = new Box3();
      for (const part of s.product.components) {
        const center = new Vector3(
          ...positionOf(part, s.mode, s.explosionFactor, s.explosionGroup),
        );
        const half = new Vector3(...part.geometry.size).multiplyScalar(0.5);
        bounds.expandByPoint(center.clone().add(half));
        bounds.expandByPoint(center.clone().sub(half));
      }
      target = bounds.getCenter(new Vector3());
      size = bounds.getSize(new Vector3()).length();
    }
    const aspect = viewportSize.width / viewportSize.height;
    const fitDistance =
      size /
      (2 *
        Math.sin(
          Math.atan(Math.tan((21 * Math.PI) / 180) * Math.min(1, aspect)),
        ));
    goal.current = {
      target,
      position: target
        .clone()
        .add(
          new Vector3(
            s.cameraView === "front"
              ? 0
              : s.cameraView === "rear"
                ? 0
                : s.cameraView === "top"
                  ? 0
                  : 0.6,
            s.cameraView === "top" ? 1 : s.cameraView === "iso" ? 0.35 : 0,
            s.cameraView === "rear" ? -1 : s.cameraView === "top" ? 0.001 : 1,
          )
            .normalize()
            .multiplyScalar(c ? Math.max(size * 2.2, 3) : fitDistance * 1.12),
        ),
    };
  }, [
    s.cameraVersion,
    s.cameraView,
    s.focusedComponentId,
    s.product,
    s.mode,
    s.explosionFactor,
    s.explosionGroup,
    scene,
    viewportSize.width,
    viewportSize.height,
  ]);
  useFrame((_, dt) => {
    if (!goal.current || !controls.current) return;
    const a = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : 1 - Math.exp(-dt * 7);
    camera.position.lerp(goal.current.position, a);
    controls.current.target.lerp(goal.current.target, a);
    controls.current.update();
    if (camera.position.distanceTo(goal.current.position) < 0.01)
      goal.current = null;
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={1.5}
      maxDistance={70}
      enableDamping
      onStart={() => {
        goal.current = null;
      }}
    />
  );
}
function Scene() {
  const s = useWorkspace();
  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[5, 8, 8]} intensity={3} />
      <directionalLight position={[-5, 0, 4]} intensity={1.5} />
      <group rotation={[0, 0, 0]}>
        {s.product.model3D.exteriorUrl &&
        s.mode === "Explore" &&
        !s.focusedComponentId &&
        !s.isolatedComponentId &&
        !s.hiddenComponentIds.length ? (
          <ErrorBoundary
            fallback={
              <group>
                {s.product.components.map((c) => (
                  <Part key={c.id} component={c} />
                ))}
              </group>
            }
          >
            <Suspense
              fallback={
                <group>
                  {s.product.components.map((c) => (
                    <Part key={c.id} component={c} />
                  ))}
                </group>
              }
            >
              <AssetModel url={s.product.model3D.exteriorUrl} phone />
            </Suspense>
          </ErrorBoundary>
        ) : s.product.model3D.type === "gltf" && s.product.model3D.url ? (
          <ErrorBoundary
            key={s.product.model3D.url}
            onError={() =>
              useWorkspace.setState({
                modelStatus: "fallback",
                error:
                  "The model could not load or its component mappings are invalid. Showing the procedural fallback.",
              })
            }
            fallback={
              <group>
                {s.product.components.map((c) => (
                  <Part key={c.id} component={c} />
                ))}
              </group>
            }
          >
            <Suspense
              fallback={
                <group>
                  {s.product.components.map((c) => (
                    <Part key={c.id} component={c} />
                  ))}
                </group>
              }
            >
              <ImportedModel />
            </Suspense>
          </ErrorBoundary>
        ) : (
          s.product.components.map((c) => <Part key={c.id} component={c} />)
        )}
      </group>
      <Grid
        position={[0, -3.7, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={s.mode === "Exploded" ? "#d8dde3" : "#384551"}
        sectionColor={s.mode === "Exploded" ? "#b7c1cc" : "#536274"}
        sectionSize={5}
        fadeDistance={22}
        infiniteGrid
      />
      {s.quality === "High" && (
        <ContactShadows
          position={[0, -3.65, 0]}
          opacity={0.35}
          scale={18}
          blur={2}
          far={15}
          resolution={256}
        />
      )}
      <CameraRig />
    </>
  );
}
export default function Viewer() {
  const quality = useWorkspace((s) => s.quality);
  const [autoDpr] = useState(() =>
    typeof navigator !== "undefined" &&
    (navigator.hardwareConcurrency <= 4 || window.innerWidth < 800)
      ? 1
      : 1.5,
  );
  return (
    <ErrorBoundary
      fallback={
        <div className="empty" role="alert">
          <h3>3D rendering unavailable</h3>
          <p>
            Use the component navigator, graph and simulation panels. Try a
            browser with WebGL enabled to restore the 3D view.
          </p>
        </div>
      }
    >
      <Canvas
        aria-label="Interactive 3D product viewer"
        camera={{ position: [5, 3, 10], fov: 42 }}
        dpr={
          quality === "Low"
            ? 1
            : quality === "High"
              ? [1, 2]
              : [1, quality === "Auto" ? autoDpr : 1.5]
        }
        gl={{
          antialias: quality !== "Low",
          powerPreference: quality === "High" ? "high-performance" : "default",
        }}
      >
        <Scene />
      </Canvas>
    </ErrorBoundary>
  );
}
