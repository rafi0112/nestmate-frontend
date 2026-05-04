import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import AuthSideNavbar from "@/components/AuthSideNavbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "NestMate Find Your Perfect Roommate",
  description: "Connect with compatible roommates based on lifestyle, budget, and location.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  fontFamily: "'Times New Roman', Times, serif",
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                },
                duration: 3500,
              }}
            />
            <Navbar />
            <AuthSideNavbar />
            <div className="app-shell-content">
              <main style={{ minHeight: 'calc(100vh - 64px)' }}>
                {children}
              </main>
              <Footer />
            </div>
            <style>{`
              .app-shell-content {
                margin-left: 0;
                padding-top: 62px;
                transition: margin-left .22s ease;
              }

              body.has-auth-sidenav .app-shell-content {
                margin-left: 72px;
              }

              body.has-auth-sidenav.auth-sidenav-expanded .app-shell-content {
                margin-left: 240px;
              }

              @media (max-width: 900px) {
                .app-shell-content {
                  margin-left: 0;
                }

                body.has-auth-sidenav .app-shell-content,
                body.has-auth-sidenav.auth-sidenav-expanded .app-shell-content {
                  margin-left: 0;
                }
              }
            `}</style>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
