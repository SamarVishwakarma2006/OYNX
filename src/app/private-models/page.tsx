"use client";

import { useState } from "react";
import Link from "next/link";
import { PrivateModelBuilder } from "../../components/PrivateModelBuilder";
import { Workspace } from "../../components/Workspace";

export default function PrivateModelsPage() {
  const [open, setOpen] = useState(false);

  if (open) return <Workspace onBack={() => setOpen(false)} />;

  return (
    <main className="private-model-page">
      <nav
        className="studio-nav private-model-nav"
        aria-label="Private workspace navigation"
      >
        <Link href="/">inside /</Link>
        <Link href="/">← Back to landing page</Link>
      </nav>
      <PrivateModelBuilder onOpen={() => setOpen(true)} />
    </main>
  );
}
