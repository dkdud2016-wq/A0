import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "너를 너무 잘 알아",
  description:
    "카톡, 일기, 메모를 넣어보세요. 당신이 어떤 사람인지 AI가 아주 조금 참견해드립니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFF8F0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-cream font-sans antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
