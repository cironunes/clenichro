import { PresentationBuilder } from "@/components/presentation-builder";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
  title: "Presentation Builder",
  description: "Create stunning presentations with ease",
};

export default function Home() {
  return <PresentationBuilder />;
}
