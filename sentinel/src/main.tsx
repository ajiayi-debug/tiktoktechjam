import { createRoot } from "@lynx-js/react";
import App from "./App.jsx";


const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");
createRoot(rootEl).render(<App />);