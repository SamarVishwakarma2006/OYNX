"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
const CarPreview = dynamic(() => import("../../components/CarPreview"), {
  ssr: false,
  loading: () => (
    <div className="car-preview empty">Preparing the showroom…</div>
  ),
});
export default function ComingSoon() {
  return (
    <main className="studio-page automotive">
      <nav className="studio-nav">
        <Link href="/">inside /</Link>
        <Link href="/build">Build a device ↗</Link>
      </nav>
      <div className="automotive-heading">
        <span className="eyebrow">NEXT CHAPTER / AUTOMOTIVE</span>
        <span className="badge">Coming soon</span>
        <h1>
          Engineering.
          <br />
          <em>On another scale.</em>
        </h1>
        <p>
          Explore automotive digital twin architectures. Interactive 3D component
          diagnostics and complex system simulations are in development.
        </p>
      </div>
      <CarPreview />
      <div className="studio-grid">
        <section>
          <span className="eyebrow">01 / CONCEPT PREVIEW</span>
          <h2>A closer look.</h2>
          <p>
            An interactive procedural 3D automotive prototype you can rotate, inspect,
            and view in real time.
          </p>
        </section>
        <section>
          <span className="eyebrow">02 / COMING SOON</span>
          <h2>Powertrain & subsystem telemetry.</h2>
          <p>
            Exploded assemblies, electrical wiring graphs, battery management systems,
            and repair simulations are coming in the next release.
          </p>
        </section>
      </div>
      <footer>
        Independent educational preview · No manufacturer affiliation ·{" "}
        <Link href="/credits">Asset credits</Link> ·{" "}
        <Link href="/">Explore the phone →</Link>
      </footer>
    </main>
  );
}
