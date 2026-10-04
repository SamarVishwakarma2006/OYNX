import Link from "next/link";

export default function Credits() {
  return (
    <main className="studio-page">
      <nav className="studio-nav">
        <Link href="/">inside /</Link>
        <Link href="/coming-soon">Automotive preview</Link>
      </nav>
      <h1>Legal Notices, Disclaimers & Credits</h1>

      <section className="studio-card">
        <h2>iPhone 17 Pro Max Exterior 3D Model Attribution</h2>
        <p>
          The 3D exterior model of the phone is created by{" "}
          <a
            href="https://sketchfab.com/MG990"
            target="_blank"
            rel="noopener noreferrer"
          >
            MajdyModels
          </a>{" "}
          and licensed under the{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Creative Commons Attribution 4.0 International (CC BY 4.0) License
          </a>
          .
        </p>
        <p>
          Original asset source:{" "}
          <a
            href="https://sketchfab.com/3d-models/iphone-17-pro-max-87fc1df741384124a8ce0226d2b2058d"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sketchfab — iPhone 17 Pro Max
          </a>
          . Modifications made: coordinate system re-scaling, material adaptation for
          real-time WebGL, camera bounding, and integration alongside procedural internal
          components.
        </p>
      </section>

      <section className="studio-card">
        <h2>Trademark & Non-Affiliation Disclaimer (Apple Inc.)</h2>
        <p>
          <strong>Apple</strong>, <strong>iPhone</strong>, <strong>iOS</strong>, and all
          associated marks, product names, and trade dress are registered trademarks of{" "}
          <strong>Apple Inc.</strong>, registered in the U.S. and other countries and regions.
        </p>
        <p>
          This project (<strong>OYNX / Inside</strong>) is an independent, non-commercial,
          open-source educational project developed solely for research, educational
          demonstration, and interactive systems visualization under nominative fair use.
          It is <strong>not sponsored, endorsed, authorized, or affiliated with Apple Inc.</strong> in any way.
        </p>
        <p>
          All internal schematics, component architectures, specifications, and repair guides
          presented within this software are illustrative educational demonstrations created
          independently. They do <strong>not</strong> represent official manufacturer service
          manuals, certified engineering CAD, or authorized repair instructions.
        </p>
      </section>

      <section className="studio-card">
        <h2>Automotive Concept Twin</h2>
        <p>
          The automotive showroom features an original procedural 3D concept prototype
          generated entirely via WebGL code. It does not utilize proprietary CAD data,
          trademarks, or copyrighted 3D meshes from any vehicle manufacturer.
        </p>
      </section>

      <section className="studio-card">
        <h2>Evidence & Data Provenance</h2>
        <p>
          Observed means a contributor reports a direct observation. Inferred
          means an explanation or estimate. Unknown means evidence is missing.
          None of these labels independently verifies an official manufacturer
          specification.
        </p>
        <p>
          Repair outcomes and telemetry figures are self-reported demonstration records,
          not independently audited environmental or industrial certifications.
        </p>
      </section>
    </main>
  );
}
