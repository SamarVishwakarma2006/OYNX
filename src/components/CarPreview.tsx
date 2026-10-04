"use client";
import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows, OrbitControls, useProgress } from "@react-three/drei";
import { AssetModel } from "./AssetModel";
import { ErrorBoundary } from "./ErrorBoundary";

function CarLoader() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      <span className="badge">
        Loading Vulcan model… {progress > 0 ? `${Math.round(progress)}%` : ""}
      </span>
    </div>
  );
}

export default function CarPreview() {
  const [version, setVersion] = useState(0);
  const [lost, setLost] = useState(false);
  return (
    <div className="car-preview">
      <CarLoader />
      {lost ? (
        <div className="empty" role="alert">
          3D unavailable. Reload this page to retry with WebGL enabled.
        </div>
      ) : (
        <ErrorBoundary
          fallback={
            <div className="empty" role="alert">
              The car could not load. Reload to retry.
            </div>
          }
        >
          <Canvas
            key={version}
            aria-label="Assembled Aston Martin Vulcan 3D preview"
            camera={{ position: [8, 4, 9], fov: 38 }}
            dpr={[1, 1.5]}
            onCreated={({ gl }) =>
              gl.domElement.addEventListener(
                "webglcontextlost",
                () => setLost(true),
                { once: true },
              )
            }
          >
            <ambientLight intensity={1.7} />
            <directionalLight position={[4, 8, 6]} intensity={4} />
            <directionalLight
              position={[-5, 3, -4]}
              intensity={3}
              color="#b8e1d1"
            />
            <Suspense fallback={null}>
              <Bounds fit clip observe margin={1.25}>
                <AssetModel url="/models/aston-vulcan-amr.glb" />
              </Bounds>
              <ContactShadows
                position={[0, -0.96, 0]}
                opacity={0.5}
                scale={18}
                blur={2.5}
                far={5}
                resolution={256}
              />
            </Suspense>
            <OrbitControls
              makeDefault
              minDistance={3}
              maxDistance={25}
              enablePan={false}
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
