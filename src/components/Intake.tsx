"use client";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import InsideDeviceHero from "./ui/inside-device-hero";
import { smartphone } from "../data/smartphone";
import { iphone } from "../data/iphone";
import { useWorkspace, type Mode } from "../lib/store";

export function Intake({ onOpen }: { onOpen: () => void }) {
  const router = useRouter();
  const [activeSystem, setActiveSystem] = useState("all");
  const systems = [
    ["all", "All parts"],
    ["exterior", "Exterior"],
    ["power", "Power system"],
    ["compute", "Compute"],
    ["camera", "Camera"],
    ["audio", "Audio"],
  ];
  const featuredParts = smartphone.components
    .filter((part) => activeSystem === "all" || part.systemId === activeSystem)
    .slice(0, 6);
  function openDemo(
    mode: Mode = "Explore",
    componentId?: string,
    product = iphone,
  ) {
    const state = useWorkspace.getState();
    if (state.product !== product) state.loadProduct(product);
    useWorkspace.getState().restore();
    useWorkspace.getState().setMode(mode);
    if (componentId) useWorkspace.getState().focus(componentId);
    else useWorkspace.getState().resetCamera();
    onOpen();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <main className="landing inside-landing">
      <InsideDeviceHero
        onOpenDemo={() => openDemo()}
        onStartProduct={() => router.push("/workshop")}
        onOpenDependencies={() => openDemo("Dependencies")}
        onOpenSimulation={() => openDemo("Simulation", "battery")}
      />
      <section
        className="private-workspace-entry"
        id="private-models"
        aria-labelledby="workshop-entry-title"
      >
        <div>
          <span className="eyebrow">YOUR NEXT PROJECT</span>
          <h2 id="workshop-entry-title">Make it your own.</h2>
          <p>
            Import a model, build a schematic, or return to a saved project.
          </p>
        </div>
        <Link className="primary" href="/workshop">
          Open Workshop <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="how-heading">
          <span className="eyebrow">A CLOSER LOOK AT THE EVERYDAY</span>
          <p>
            From outer shell to inner system.
            <br />
            <em>All in one place.</em>
          </p>
        </div>
        <div className="how-cards">
          <article>
            <span className="card-index">01 — DISCOVER</span>
            <div className="mini-orbit">
              <span>01</span>
              <span>02</span>
              <span>03</span>
              <i />
            </div>
            <h3>See what’s inside</h3>
            <p>
              Move from a product’s outer shell to its individual parts in a
              living 3D view.
            </p>
          </article>
          <article>
            <span className="card-index">02 — UNDERSTAND</span>
            <div className="mini-dependency">
              <i />
              <i />
              <i />
              <i />
              <b>↗</b>
            </div>
            <h3>Follow every connection</h3>
            <p>
              See how parts rely on each other, and what changes when one part
              fails.
            </p>
          </article>
          <article>
            <span className="card-index">03 — MAKE IT YOURS</span>
            <div className="mini-slider">
              <span>XRAY</span>
              <i />
              <span>68%</span>
            </div>
            <h3>Explore at your pace</h3>
            <p>
              Inspect components, run a simulation, and learn how the system
              responds.
            </p>
          </article>
        </div>
        <div className="component-shelf">
          <div className="component-shelf-heading">
            <div>
              <span className="eyebrow">THE SMARTPHONE, UNDER THE SURFACE</span>
              <h2>Explore the component library.</h2>
            </div>
            <p>Choose a system. Open any part in the interactive lab.</p>
          </div>
          <div
            className="component-filters"
            role="group"
            aria-label="Filter components by system"
          >
            {systems.map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={activeSystem === id}
                onClick={() => setActiveSystem(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="component-grid">
            {featuredParts.map((part, index) => (
              <button
                className="component-card"
                key={part.id}
                type="button"
                onClick={() => {
                  openDemo("Explore", part.id);
                }}
                aria-label={`Explore ${part.name} in the interactive lab`}
              >
                <span className={`component-card-art art-${index % 4}`}>
                  <span
                    style={
                      {
                        backgroundColor: part.geometry.color,
                        "--part-color": part.geometry.color,
                      } as CSSProperties
                    }
                  />
                  <small>{part.systemId.toUpperCase()}</small>
                </span>
                <span className="component-card-copy">
                  <strong>{part.name}</strong>
                  <small>{part.function}</small>
                </span>
                <ArrowUpRight className="component-card-arrow" size={15} />
              </button>
            ))}
          </div>
        </div>
      </section>
      <footer className="landing-footer">
        <span>
          INSIDE <i> / </i> DIGITAL TWIN STUDIO
        </span>
        <span>
          Educational demo · models are illustrative, not manufacturer-verified.
        </span>
      </footer>
    </main>
  );
}
