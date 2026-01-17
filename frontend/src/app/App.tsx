import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { performanceMonitor } from "../utils/performanceMonitor";
import AppRoutes from "../routes/AppRoutes";
import { AppProviders } from "./AppProviders";
import { useWebVitals, reportWebVitals } from "../hooks/useWebVitals";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import KeyboardShortcutsHelp from "../components/KeyboardShortcutsHelp";
import { useTheme } from "../context/ThemeContext";

export interface LayoutState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Home");

  const layoutState: LayoutState = {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
  };

  useWebVitals(reportWebVitals);

  useEffect(() => {
    performanceMonitor.mark("app-init");

    // Register Service Worker
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register("/serviceWorker.js")
        .then((registration) => {
          console.log("[SW] Registered:", registration);
        })
        .catch((error) => {
          console.error("[SW] Registration failed:", error);
        });
    }

    // Measure app load time
    window.addEventListener("load", () => {
      performanceMonitor.mark("app-loaded");
      performanceMonitor.measure("app-load-time", "app-init", "app-loaded");
      performanceMonitor.report();
    });
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, width: '100%', minHeight: '100vh' }}>
      <AppProviders>
        <AppContent layoutState={layoutState} />
      </AppProviders>
    </div>
  );
};

interface AppContentProps {
  layoutState: LayoutState;
}

// Separate component to use hooks that depend on context
const AppContent = ({ layoutState }: AppContentProps) => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Global keyboard shortcuts
  const globalShortcuts = {
    'g h': () => navigate('/'),
    'g p': () => navigate('/profile'),
    'g m': () => navigate('/messages'),
    'g n': () => navigate('/notifications'),
    '?': () => setShowShortcutsHelp(true),
    't': () => toggleTheme(),
    '/': (e: React.KeyboardEvent | KeyboardEvent) => {
      e.preventDefault();
      (document.querySelector('input[type="text"]') as HTMLInputElement)?.focus();
    }
  };

  useKeyboardShortcuts(globalShortcuts, {
    enabled: !showShortcutsHelp,
    excludeInputs: true
  });

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link sr-only-focusable">
        Skip to main content
      </a>
      <AppRoutes props={layoutState} />
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </>
  );
};

export default App;
