/** Gallery entry point (gallery.html). With `?screen=` renders only that screen inside the iframe. */
import { createRoot } from "react-dom/client";
import "../index.css";
import { SCREENS } from "./catalog";
import { Gallery } from "./Gallery";
import { mountScreen } from "./stage";

const params = new URLSearchParams(location.search);
const screenId = params.get("screen");

if (screenId) {
  void mountScreen(
    SCREENS.find((s) => s.id === screenId),
    params.get("theme") === "dark",
  );
} else {
  createRoot(document.getElementById("root") as HTMLElement).render(<Gallery />);
}
