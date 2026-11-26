import { hasPendingOidcHandshake } from "@/shared/api/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DemoProvider } from "./DemoProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AppRouter } from "./router";
import { PwaControls } from "./pwa/PwaControls";
import { PwaProvider } from "./pwa/PwaProvider";
import { session } from "@/features/identity/data/session";
import "./styles.css";
import "./consolidation.css";
import "./islands.css";
import "./appearance/experience.css";
import "./presentation.css";

// The adapter consumes/removes protocol parameters before constructing the router.
if (
  location.pathname === "/auth/callback" &&
  !hasPendingOidcHandshake(new URLSearchParams(location.search).get("state"))
)
  await session.initialize();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <DemoProvider>
        <PwaProvider>
          <PwaControls />
          <AppRouter />
        </PwaProvider>
      </DemoProvider>
    </ThemeProvider>
  </StrictMode>,
);
