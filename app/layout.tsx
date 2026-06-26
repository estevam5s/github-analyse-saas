import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GitAnalytica";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://github-analyse-saas.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Analytics, Gestão e IA para o seu GitHub`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Plataforma de Analytics, gestão e Inteligência Artificial para GitHub. Métricas de commits, PRs, releases, contributors, code review com IA, score de qualidade e detecção de vulnerabilidades.",
  keywords: ["github analytics", "code review ia", "devops", "métricas de engenharia", "github saas"],
  openGraph: {
    title: `${APP_NAME} — Analytics + IA para GitHub`,
    description: "Métricas de engenharia, gestão de repositórios e IA para o seu GitHub.",
    type: "website",
    url: APP_URL,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={mono.variable}>
      <body className="min-h-screen bg-canvas font-mono text-ink antialiased">{children}</body>
    </html>
  );
}
