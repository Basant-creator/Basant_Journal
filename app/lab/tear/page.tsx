import type { Metadata } from "next";
import { TearBench } from "./TearBench";

export const metadata: Metadata = {
  title: "Torn paper — Lab",
  robots: { index: false, follow: false },
};

/**
 * Step 06's deliverable: plain surface, torn paper reveal, second surface.
 * No project content — the tear is much harder to judge with real copy
 * competing for attention.
 */
export default function TearLabPage() {
  return <TearBench />;
}
