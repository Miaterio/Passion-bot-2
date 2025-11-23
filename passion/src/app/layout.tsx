import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Root } from "@/components/Root/Root";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Passion Bot",
    description: "Telegram Mini App",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Root>
                    {children}
                </Root>
            </body>
        </html>
    );
}
