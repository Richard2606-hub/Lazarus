import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification Exchange",
  description: "Review low-confidence Lazarus classifications with source context.",
};

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
