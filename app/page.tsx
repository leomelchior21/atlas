"use client";

import { AtlasShell } from "@/components/AtlasShell";
import { AtlasProvider } from "@/store/atlas-store";

export default function AtlasPage() {
  return (
    <AtlasProvider>
      <AtlasShell />
    </AtlasProvider>
  );
}
