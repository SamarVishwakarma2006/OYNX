"use client";
import { Suspense, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { ErrorBoundary } from "./ErrorBoundary";
import type { Group } from "three";

function ConceptVehicle() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Main Aerodynamic Lower Chassis */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[2.2, 0.35, 4.8]} />
        <meshStandardMaterial
          color="#0f382c"
          roughness={0.25}
          metalness={0.8}
        />
      </mesh>

      {/* Front Hood Slope */}
      <mesh position={[0, 0.42, 1.3]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[2.1, 0.22, 1.8]} />
        <meshStandardMaterial
          color="#144d3d"
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>

      {/* Cabin & Tinted Glass Canopy */}
      <mesh position={[0, 0.78, -0.2]}>
        <boxGeometry args={[1.6, 0.55, 2.2]} />
        <meshPhysicalMaterial
          color="#0a1a18"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Roof Aerodynamic Ridge */}
      <mesh position={[0, 1.07, -0.3]}>
        <boxGeometry args={[1.3, 0.08, 1.6]} />
        <meshStandardMaterial color="#0f382c" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Front Splitter / Diffuser */}
      <mesh position={[0, 0.18, 2.3]}>
        <boxGeometry args={[2.25, 0.08, 0.6]} />
        <meshStandardMaterial color="#1a1f1d" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Rear Performance Spoiler */}
      <group position={[0, 0.95, -2.2]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[2.4, 0.06, 0.45]} />
          <meshStandardMaterial color="#111815" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[-0.8, -0.15, 0]}>
          <boxGeometry args={[0.08, 0.35, 0.25]} />
          <meshStandardMaterial color="#1a1f1d" />
        </mesh>
        <mesh position={[0.8, -0.15, 0]}>
          <boxGeometry args={[0.08, 0.35, 0.25]} />
          <meshStandardMaterial color="#1a1f1d" />
        </mesh>
      </group>

      {/* Headlights (Cyan Neon) */}
      <mesh position={[-0.85, 0.42, 2.38]}>
        <boxGeometry args={[0.35, 0.08, 0.1]} />
        <meshStandardMaterial
          color="#52e0c4"
          emissive="#52e0c4"
          emissiveIntensity={2.5}
        />
      </mesh>
      <mesh position={[0.85, 0.42, 2.38]}>
        <boxGeometry args={[0.35, 0.08, 0.1]} />
        <meshStandardMaterial
          color="#52e0c4"
          emissive="#52e0c4"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Tail Light Strip (Crimson Neon) */}
      <mesh position={[0, 0.52, -2.41]}>
        <boxGeometry args={[2.1, 0.06, 0.05]} />
        <meshStandardMaterial
          color="#ff3344"
          emissive="#ff2233"
          emissiveIntensity={3}
        />
      </mesh>

      {/* 4 Performance Wheels */}
      {[
        [-1.15, 0.35, 1.45],
        [1.15, 0.35, 1.45],
        [-1.15, 0.35, -1.45],
        [1.15, 0.35, -1.45],
      ].map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.3, 24]} />
            <meshStandardMaterial color="#151716" roughness={0.8} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.26, 0.26, 0.32, 16]} />
            <meshStandardMaterial
              color="#a4b8af"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function CarPreview() {
  const [version, setVersion] = useState(0);
  const [lost, setLost] = useState(false);

  return (
    <div className="car-preview">
      {lost ? (
        <div className="empty" role="alert">
          3D unavailable. Reload this page to retry with WebGL enabled.
        </div>
      ) : (
        <ErrorBoundary
          fallback={
            <div className="empty" role="alert">
              The concept model could not load. Reload to retry.
            </div>
          }
        >
          <Canvas
            key={version}
            aria-label="Assembled Automotive Concept 3D preview"
            camera={{ position: [6, 3.5, 6], fov: 38 }}
            dpr={[1, 1.5]}
            onCreated={({ gl }) =>
              gl.domElement.addEventListener(
                "webglcontextlost",
                () => setLost(true),
                { once: true },
              )
            }
          >
            <ambientLight intensity={1.5} />
            <directionalLight position={[6, 9, 6]} intensity={3.5} />
            <directionalLight
              position={[-5, 4, -4]}
              intensity={2.5}
              color="#b8e1d1"
            />
            <Suspense fallback={null}>
              <ConceptVehicle />
              <ContactShadows
                position={[0, -0.05, 0]}
                opacity={0.65}
                scale={12}
                blur={2}
                far={4}
                resolution={256}
              />
            </Suspense>
            <OrbitControls
              makeDefault
              minDistance={3}
              maxDistance={20}
              enablePan={false}
              autoRotate={false}
            />
          </Canvas>
        </ErrorBoundary>
      )}
      <div className="preview-controls">
        <span>Drag to orbit · Scroll to zoom</span>
        <button onClick={() => setVersion((v) => v + 1)}>Reset view</button>
      </div>
    </div>
  );
}
