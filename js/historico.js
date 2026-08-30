/* ==========================================================================
   HISTÓRICO DA SESSÃO — registro de eventos da mesa
   ========================================================================== */
import { $, horaAgora } from "./dom.js";
import { CHAVES, lerLocalStorageJSON } from "./storage.js";

export function adicionarHistorico(texto, tipo = "") {
  const historico = lerLocalStorageJSON(CHAVES.historico, []);
  const hora = horaAgora();
  historico.push({ texto, tipo, hora });
  localStorage.setItem(CHAVES.historico, JSON.stringify(historico));
  renderizarItemHistorico(texto, tipo, hora);
}

export function renderizarItemHistorico(texto, tipo, hora) {
  const log = $("log-historico");
  if (!log) return;
  const item       = document.createElement("div");
  item.className   = "log-item" + (tipo ? ` ${tipo}` : "");

  const texto_el = document.createElement("span");
  texto_el.className = "log-item-texto";
  texto_el.textContent = texto;
  item.appendChild(texto_el);

  if (hora) {
    const hora_el = document.createElement("span");
    hora_el.className = "log-item-hora";
    hora_el.textContent = hora;
    item.appendChild(hora_el);
  }

  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

export function limparHistorico() {
  if (!confirm("Deseja realmente limpar o histórico da sessão?")) return;
  localStorage.removeItem(CHAVES.historico);
  $("log-historico").innerHTML = "";
}

/** Liga o botão de limpar e o campo de anotação manual. Chamado no boot pelo main. */
export function initHistorico() {
  $("btn-limpar-historico").addEventListener("click", limparHistorico);

  const form = $("form-historico-nota");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("historico-nota-texto");
    const texto = input.value.trim();
    if (!texto) return;
    adicionarHistorico(`📝 ${texto}`, "nota");
    input.value = "";
    input.focus();
  });
}
