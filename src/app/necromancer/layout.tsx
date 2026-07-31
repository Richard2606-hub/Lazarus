import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citation Necromancer",
  description: "Find structurally analogous research methods across field boundaries.",
};

export default function NecromancerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
