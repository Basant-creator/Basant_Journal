import type { Metadata } from "next";
import { TitleBench } from "./TitleBench";

export const metadata: Metadata = {
  title: "Titles — Lab",
  robots: { index: false, follow: false },
};

/**
 * Steps 04 and 05: the two title components, side by side so the difference
 * between them is visible rather than asserted.
 */
export default function TitlesLabPage() {
  return <TitleBench />;
}
