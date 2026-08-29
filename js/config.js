/* ==========================================================================
   CONFIG — preferências da mesa (campanha, mestre e regras de combate)
   `config` é um objeto vivo: leia via config.x e mute as propriedades;
   nunca reatribua a referência (use Object.assign para carregar em lote).
   ========================================================================== */
import { $ } from "./dom.js";
import { CHAVES, lerLocalStorageJSON } from "./storage.js";

export const config = lerLocalStorageJSON(CHAVES.config, {
  campanhaNome: "",
  mestreNome:   "",
  dadoAcerto:   20,
  etapaAcerto:  true,
  autoMorte:    true,
  expiracaoCondicao: "rodada", // "rodada" = fim da rodada | "turno" = no turno do personagem
});

export function abrirModalConfig() {
  $("config-campanha-nome").value      = config.campanhaNome;
  $("config-mestre-nome").value        = config.mestreNome;
  $("config-dado-acerto").value        = config.dadoAcerto;
  $("config-expiracao-condicao").value = config.expiracaoCondicao;
  $("config-etapa-acerto").checked     = config.etapaAcerto;
  $("config-auto-morte").checked       = config.autoMorte;
  $("modal-config").classList.remove("oculto");
}

export function salvarConfig() {
  config.campanhaNome      = $("config-campanha-nome").value.trim();
  config.mestreNome        = $("config-mestre-nome").value.trim();
  config.dadoAcerto        = parseInt($("config-dado-acerto").value) || 20;
  config.expiracaoCondicao = $("config-expiracao-condicao").value === "turno" ? "turno" : "rodada";
  config.etapaAcerto       = $("config-etapa-acerto").checked;
  config.autoMorte         = $("config-auto-morte").checked;
  localStorage.setItem(CHAVES.config, JSON.stringify(config));
  aplicarConfig();
  $("modal-config").classList.add("oculto");
}

export function aplicarConfig() {
  const spanCampanha = $("header-campanha");
  if (spanCampanha) spanCampanha.textContent = config.campanhaNome || "";
  const spanMestre = $("header-mestre");
  if (spanMestre) spanMestre.textContent = config.mestreNome ? `Mestre: ${config.mestreNome}` : "";
  const selAcerto = $("acerto-tipo");
  if (selAcerto) selAcerto.value = config.dadoAcerto;
}

/** Liga o modal de Configurações. Chamado no boot pelo main. */
export function initConfig() {
  $("btn-config").addEventListener("click", abrirModalConfig);
  $("fechar-config").addEventListener("click", () => $("modal-config").classList.add("oculto"));
  window.addEventListener("click", (e) => { if (e.target === $("modal-config")) $("modal-config").classList.add("oculto"); });
  $("btn-salvar-config").addEventListener("click", salvarConfig);
}
