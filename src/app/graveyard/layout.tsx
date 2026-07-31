import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Graveyard",
  description: "Check a planned research approach against Lazarus failure records.",
};

export default function GraveyardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
