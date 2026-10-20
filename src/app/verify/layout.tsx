import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify — Tracktar",
  description:
    "Search phone numbers the community has reported as con agents or hosts before you deal with them.",
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
