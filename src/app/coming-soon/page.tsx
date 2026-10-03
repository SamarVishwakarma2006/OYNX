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
          Meet the Aston Martin Vulcan AMR Pro. Explore the exterior today.
          Component-level learning is the next chapter.
        </p>
      </div>
      <CarPreview />
      <div className="studio-grid">
        <section>
          <span className="eyebrow">01 / AVAILABLE NOW</span>
          <h2>A closer look.</h2>
          <p>
            An assembled artist model you can rotate and inspect, with its
            supplied materials and textures.
          </p>
        </section>
        <section>
          <span className="eyebrow">02 / COMING SOON</span>
          <h2>Understand the systems.</h2>
          <p>
            Exploded assemblies, evidence-backed components and repair learning
            require suitable component data. These features are not yet
            available for this car.
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
