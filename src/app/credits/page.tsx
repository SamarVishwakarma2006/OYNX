import Link from "next/link";
export default function Credits() {
  return (
    <main className="studio-page">
      <nav className="studio-nav">
        <Link href="/">inside /</Link>
      </nav>
      <h1>Models & evidence.</h1>
      <section className="studio-card">
        <h2>iPhone 17 Pro Max</h2>
        <p>
          Exterior model by{" "}
          <a href="https://sketchfab.com/MG990">MajdyModels</a>, licensed under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.{" "}
          <a href="https://sketchfab.com/3d-models/iphone-17-pro-max-87fc1df741384124a8ce0226d2b2058d">
            Original model
          </a>
          . Adaptations: display scale, orientation and fading. Paired with
          separate schematic educational internals.
        </p>
        <p>
          The internal components, dependencies and repair examples are generic.
          This is not manufacturer service CAD or a verified iPhone repair
          guide.
        </p>
      </section>
      <section className="studio-card">
        <h2>Aston Martin Vulcan AMR Pro</h2>
        <p>
          Supplied locally in aston-martin-vulcan-amr-pro-wwwvecarzcom.zip. No
          author or redistribution license was included in the asset metadata.
          Rights must be established before public redistribution. Assembled
          preview only.
        </p>
      </section>
      <section className="studio-card">
        <h2>Evidence labels</h2>
        <p>
          Observed means a contributor reports a direct observation. Inferred
          means an explanation or estimate. Unknown means evidence is missing.
          None of these labels independently verifies a manufacturer
          specification.
        </p>
        <p>
          Repair outcomes are self-reported records, not independently audited
          environmental savings.
        </p>
      </section>
    </main>
  );
}
