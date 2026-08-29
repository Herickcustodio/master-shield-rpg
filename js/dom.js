/* ==========================================================================
   DOM — atalhos usados em todo o app
   ========================================================================== */

/** Atalho para document.getElementById */
export const $ = (id) => document.getElementById(id);

/** Hora atual no formato HH:MM (pt-BR), usada nos registros de histórico/rolagens */
export function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
