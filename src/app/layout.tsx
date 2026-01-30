import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
    subsets: ["latin", "vietnamese"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "Phiếu Xuất Nhập Kho - AI Powered",
    description: "Hệ thống quản lý xuất nhập tồn kho với AI tự động đọc phiếu",
};

import { Toaster } from "sonner";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={cn(
                "min-h-screen bg-background font-sans antialiased",
                inter.variable
            )}>
                {children}
                <Toaster position="top-right" richColors closeButton theme="light" />
            </body>
        </html>
    );
}
