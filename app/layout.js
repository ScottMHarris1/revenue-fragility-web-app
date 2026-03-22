import "./globals.css";

export const metadata = {
  title: "Revenue Architecture Diagnostic | Scott Michael Harris",
  description:
    "For agency founders between $10M–$50M dealing with forecast instability, growth friction, or client concentration. Start with the Revenue Fragility Snapshot or book a private diagnostic discussion.",
  openGraph: {
    title: "Revenue Architecture Diagnostic | Scott Michael Harris",
    description:
      "Fix the revenue system issues that make agency growth harder than it should be.",
    url: "https://revenue-architecture-site.vercel.app/",
    siteName: "Scott Michael Harris",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revenue Architecture Diagnostic | Scott Michael Harris",
    description:
      "Fix the revenue system issues that make agency growth harder than it should be.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
