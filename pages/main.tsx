import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import AdminPage from "../app/admin/page";
import "../app/globals.css";

const isAdmin = window.location.pathname.replace(/\/+$/, "").endsWith("/admin");
const Page = isAdmin ? AdminPage : Home;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
