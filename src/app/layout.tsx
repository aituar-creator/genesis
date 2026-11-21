import type { Metadata, Viewport } from "next";
import { Caveat, JetBrains_Mono, Manrope, Unbounded } from "next/font/google";
import { Starfield } from "@/components/Starfield";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "cyrillic"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Послесвечение",
  description: "Дневник, который помнит, как ощущался день.",
  appleWebApp: { capable: true, title: "Послесвечение", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0d0f24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${unbounded.variable} ${manrope.variable} ${jetbrains.variable} ${caveat.variable} antialiased`}
    >
      <body className="min-h-dvh">
        <Starfield />
        <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-night-900/80 sm:border-x sm:border-night-700">
          {children}
        </div>
      </body>
    </html>
  );
}
