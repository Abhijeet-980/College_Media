/**
 * College Media - Application Entry Point
 * * - Removed ThemeProvider from here to avoid duplicate context providers.
 * - App.jsx handles the global providers.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { BookmarkProvider } from "./context/BookmarkContext";
import { SocketProvider } from "./context/SocketContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { NotificationProvider } from "./context/NotificationContext";
import { PollProvider } from "./context/PollContext";
import { register as registerServiceWorker } from "./utils/serviceWorkerRegistration";
import "./index.css";
import "./styles/accessibility.css";
import "./i18n";
import App from "./app/App";

// Register service worker for PWA only in production
if (import.meta.env.PROD) {
  registerServiceWorker();
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <ThemeProvider>
                <BookmarkProvider>
                  <PollProvider>
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </PollProvider>
                </BookmarkProvider>
              </ThemeProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </HelmetProvider>
  </StrictMode>
);