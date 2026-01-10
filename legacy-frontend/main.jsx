import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App.jsx";
import { ThemeProvider } from "@/core/context/ThemeContext";
import "./index.css";
import "./i18n"; // Initialize i18n

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Note: StrictMode temporarily disabled to fix Agora double-mount issues in development
// TODO: Re-enable in production or find a better solution for Agora cleanup
root.render(
  // <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  // </React.StrictMode>
);
