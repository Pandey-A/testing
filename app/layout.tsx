import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/navigation/header";
import { GeistSans } from "geist/font/sans";

import "./globals.css";
import Footer from "@/components/footer/footer";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "GDG RBU",
  description: "Google Developer Group on Campus - Ramdeobaba University",
  icons: {
    icon: "/gdg.ico",
    shortcut: "/gdg.ico",
    apple: "/gdg.ico",
    android: "/gdg.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.className} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-black text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Header />
          <main className="container mx-auto px-4 pt-20 ">{children}</main>
          <Footer/>
        </ThemeProvider>
      </body>
    </html>
  );
}
