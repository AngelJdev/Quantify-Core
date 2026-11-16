import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DemoProvider } from "./DemoProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AppRouter } from "./router";
import "./styles.css";
import "./consolidation.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <DemoProvider>
        <AppRouter />
      </DemoProvider>
    </ThemeProvider>
  </StrictMode>,
);
