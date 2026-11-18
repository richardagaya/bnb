import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Host hub: free Airbnb ROI calculator and checklists | Tracktar",
  description:
    "Free tools for short-term rental hosts: an Airbnb ROI and break-even calculator, a hosting checklist and notes. No account needed.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
