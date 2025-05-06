import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "@radix-ui/themes/styles.css";
import "./main.css";
import { Theme } from "@radix-ui/themes";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <Theme appearance="dark">
      <RouterProvider router={router} />
    </Theme>
  </StrictMode>
);
