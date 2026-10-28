import { idiomaAtual } from "./i18n.js";

/* ==========================================================================
   DOM — atalhos usados em todo o app
   ========================================================================== */

/** Atalho para document.getElementById */
export const $ = (id) => document.getElementById(id);

/** Hora local, usada nos registros de histórico e rolagens */
export function horaAgora() {
  const locale = idiomaAtual() === "en" ? "en-US" : "pt-BR";
  return new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}
