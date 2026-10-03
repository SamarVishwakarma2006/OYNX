"use client";
import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Box3, Group, Mesh, Vector3, type Material } from "three";

// Keep cached geometry/textures shared; own only transforms and cloned materials.
export function AssetModel({
  url,
  phone = false,
  opacity,
}: {
  url: string;
  phone?: boolean;
  opacity?: () => number;
}) {
  const { scene } = useGLTF(url);
  const animated = useRef<Group>(null);
  const prepared = useMemo(() => {
    const model = scene.clone(true);
    const materials: Material[] = [];
    model.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const clones = (
        Array.isArray(node.material) ? node.material : [node.material]
      ).map((m) => {
        const copy = m.clone();
        materials.push(copy);
        return copy;
      });
      node.material = Array.isArray(node.material) ? clones : clones[0];
    });
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const centered = new Group();
    model.position.sub(center);
    centered.add(model);
    centered.rotation.y = phone ? Math.PI / 2 : 0;
    centered.scale.setScalar(
      phone ? 6.2 / size.y : 7.5 / Math.max(size.x, size.y, size.z),
    );
    return { centered, materials };
  }, [scene, phone]);
  useEffect(
    () => () => prepared.materials.forEach((m) => m.dispose()),
    [prepared],
  );
  useFrame(() => {
    const alpha = opacity ? opacity() : 1;
    if (!animated.current) return;
    animated.current.visible = alpha > 0.01;
    if (opacity)
      animated.current.traverse((node) => {
        if (!(node instanceof Mesh)) return;
        for (const m of Array.isArray(node.material)
          ? node.material
          : [node.material]) {
          m.transparent = true;
          m.opacity = alpha;
          m.depthWrite = alpha > 0.5;
        }
      });
  });
  return <primitive ref={animated} object={prepared.centered} />;
}
