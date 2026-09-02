/* ==========================================================================
   MASTER SHIELD RPG — ponto de entrada
   Orquestra o boot: registra os renderizadores de sincronização, liga cada
   painel (init*) e restaura histórico, anotações e tema. Toda a lógica vive
   nos módulos:
     dom, storage, state, constantes, monstros  → base
     historico, dados                            → registro de sessão e rolador
     ui, sync                                    → helpers e re-render central
     config                                      → preferências da mesa
     herois, combate, turno, condicoes, dano     → painéis de jogo
   ========================================================================== */
import { $ } from "./dom.js";
import { CHAVES, lerLocalStorageJSON } from "./storage.js";
import { estado } from "./state.js";
import { renderizarItemHistorico, initHistorico } from "./historico.js";
import { initDados } from "./dados.js";
import { configurarModal } from "./ui.js";
import { aoSincronizar, salvarESincronizar } from "./sync.js";
import { config, aplicarConfig, initConfig } from "./config.js";
import { initCondicoes } from "./condicoes.js";
import { initDano } from "./dano.js";
import { renderizarStatusGrupo, initHerois } from "./herois.js";
import { atualizarIniciativa, renderizarColetanea, initCombate } from "./combate.js";
import { atualizarPainelTurno, initTurno } from "./turno.js";

function atualizarBtnTema() {
  const isLight = document.body.classList.contains("tema-light");
  const btn = $("btn-tema");
  if (!btn) return;
  btn.innerHTML = isLight
    ? `<i data-lucide="moon"></i> Modo Dark`
    : `<i data-lucide="sun"></i> Modo Light`;
  if (window.lucide) window.lucide.createIcons();
}

/* ==========================================================================
   SESSÃO — exportar / importar / limpar tudo
   ========================================================================== */
function exportarSessao() {
  const dados = {
    versao: "1.0",
    data: new Date().toLocaleString("pt-BR"),
    campanha: config.campanhaNome,
    mestre: config.mestreNome,
    config,
    listaDeIniciativa:  estado.listaDeIniciativa,
    partyHerois:        estado.partyHerois,
    monstrosCustom:     estado.monstrosCustom,
    efeitosTemporarios: estado.efeitosTemporarios,
    turnoAtual:         estado.turnoAtual,
    turnoAtivo:         estado.turnoAtivo,
    historico: lerLocalStorageJSON(CHAVES.historico, []),
    anotacoes: localStorage.getItem(CHAVES.anotacoes) || "",
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = config.campanhaNome
    ? `rpg-${config.campanhaNome.replace(/\s+/g, "-")}.json`
    : `rpg-sessao-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarSessao(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!confirm(`Importar sessão "${dados.campanha || "sem nome"}" de ${dados.data}?\nIsso substituirá os dados atuais.`)) return;
      estado.listaDeIniciativa  = dados.listaDeIniciativa  || [];
      estado.partyHerois        = dados.partyHerois        || [];
      estado.monstrosCustom     = dados.monstrosCustom     || [];
      estado.efeitosTemporarios = dados.efeitosTemporarios || [];
      estado.turnoAtual         = dados.turnoAtual         || dados.rodadaAtual || 1;
      estado.turnoAtivo         = dados.turnoAtivo         || 0;
      Object.assign(config, dados.config || {});
      localStorage.setItem(CHAVES.historico, JSON.stringify(dados.historico || []));
      localStorage.setItem(CHAVES.anotacoes, dados.anotacoes || "");
      localStorage.setItem(CHAVES.config,    JSON.stringify(config));
      const area = $("campo-anotacoes");
      if (area) area.value = dados.anotacoes || "";
      $("log-historico").innerHTML = "";
      (dados.historico || []).forEach(h => renderizarItemHistorico(h.texto, h.tipo, h.hora, h.cor));
      aplicarConfig();
      salvarESincronizar();
      renderizarColetanea();
      $("modal-config").classList.add("oculto");
      alert("Sessão importada com sucesso!");
    } catch {
      alert("Arquivo inválido.");
    }
  };
  reader.readAsText(file);
}

function limparTodosDados() {
  if (!confirm("Isso apagará TODOS os dados. Tem certeza?")) return;
  if (!confirm("Segunda confirmação: não pode ser desfeito!")) return;
  localStorage.clear();
  location.reload();
}

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
  // Painéis re-renderizados a cada salvarESincronizar()
  aoSincronizar(atualizarIniciativa);
  aoSincronizar(renderizarStatusGrupo);
  aoSincronizar(atualizarPainelTurno);

  renderizarColetanea();

  configurarModal("btn-sobre", "modal-sobre", "fechar-sobre");
  configurarModal("btn-ajuda", "modal-ajuda", "fechar-ajuda");

  // Abas Dados / Anotações
  document.querySelectorAll(".mini-navbar__btn").forEach(botao => {
    botao.addEventListener("click", () => {
      const tab = botao.dataset.tab;
      document.querySelectorAll(".mini-navbar__btn").forEach(btn => {
        const ativo = btn === botao;
        btn.classList.toggle("mini-navbar__btn--active", ativo);
        btn.setAttribute("aria-selected", String(ativo));
      });
      document.querySelectorAll(".tab-panel").forEach(painel => {
        painel.classList.toggle("tab-panel--active", painel.id === `tab-${tab}`);
      });
    });
  });

  // Configurações + sessão
  initConfig();
  $("btn-exportar-sessao").addEventListener("click", exportarSessao);
  $("btn-limpar-tudo").addEventListener("click", limparTodosDados);
  const fileImportar = $("input-importar-sessao");
  if (fileImportar) fileImportar.addEventListener("change", (e) => importarSessao(e.target.files[0]));

  // Painéis
  initHerois();
  initCombate();
  initCondicoes();
  initDano();
  initTurno();
  initDados();

  initHistorico();

  // Render inicial
  atualizarIniciativa();
  renderizarStatusGrupo();
  atualizarPainelTurno();
  aplicarConfig();

  // Histórico salvo
  const historicoSalvo = lerLocalStorageJSON(CHAVES.historico, []);
  historicoSalvo.forEach(e => renderizarItemHistorico(e.texto, e.tipo, e.hora, e.cor));

  // Anotações
  const areaAnotacoes = $("campo-anotacoes");
  if (areaAnotacoes) {
    areaAnotacoes.value = localStorage.getItem(CHAVES.anotacoes) || "";
    areaAnotacoes.addEventListener("input", () => localStorage.setItem(CHAVES.anotacoes, areaAnotacoes.value));
  }

  // Tema
  const temaAtual = localStorage.getItem(CHAVES.tema) || "dark";
  if (temaAtual === "light") document.body.classList.add("tema-light");
  atualizarBtnTema();
  $("btn-tema").addEventListener("click", () => {
    document.body.classList.toggle("tema-light");
    const novoTema = document.body.classList.contains("tema-light") ? "light" : "dark";
    localStorage.setItem(CHAVES.tema, novoTema);
    atualizarBtnTema();
  });
};
