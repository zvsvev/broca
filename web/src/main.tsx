import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/layout.css";

import { Shell } from "./App";
import { HowItWorksProvider } from "./components/HowItWorks";
import { ToastProvider } from "./components/Toast";
import { DataProvider } from "./lib/store";
import { WalletProvider } from "./lib/wallet";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <DataProvider>
          <ToastProvider>
            <HowItWorksProvider>
              <Shell />
            </HowItWorksProvider>
          </ToastProvider>
        </DataProvider>
      </WalletProvider>
    </BrowserRouter>
  </StrictMode>,
);
