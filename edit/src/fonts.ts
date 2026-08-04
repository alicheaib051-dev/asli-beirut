import { FONT_CSS } from "./font-css";

/**
 * Installs the display faces. The bytes are inlined in font-css.ts, so this is
 * a synchronous style injection with nothing to await — no delayRender, and no
 * chance of a frame going out in a fallback face.
 */
let injected = false;

export const loadFonts = () => {
  if (injected || typeof document === "undefined") {
    return;
  }
  injected = true;
  const style = document.createElement("style");
  style.setAttribute("data-edit-fonts", "true");
  style.textContent = FONT_CSS;
  document.head.appendChild(style);
};

loadFonts();
