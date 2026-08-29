/* ==========================================================================
   TURNO — avanço/retrocesso da iniciativa, o painel do combatente ativo,
   suas ações (ataque, cura, condição, morte) e o popover de condições.
   ========================================================================== */
import { $ } from "./dom.js";
import { estado } from "./state.js";
import { config } from "./config.js";
import { CORES_HEROI, CONDICOES } from "./constantes.js";
import { adicionarHistorico } from "./historico.js";
import { salvarESincronizar } from "./sync.js";
import { decrementarCondicoes, toggleCondicao, aoFecharModalCondicao } from "./condicoes.js";
import { abrirModalAcerto, abrirModalDanoCura } from "./dano.js";
import { calcularCorHP, preencherAvatar, obterImagemCriatura, obterCACriatura } from "./ui.js";

// Popover de condições do painel de turno — fica aberto entre seleções para
// permitir marcar várias condições seguidas (só fecha ao clicar fora dele).
let _popoverCondicaoTurno = null;

/* ==========================================================================
   AVANÇO / RETROCESSO DE TURNO
   ========================================================================== */
function proximoTurno() {
  if (estado.listaDeIniciativa.length === 0) return;

  const vivos = estado.listaDeIniciativa.filter(c => !c.morto);
  if (vivos.length === 0) return;

  // Avança e pula mortos
  let tentativas = 0;
  do {
    estado.turnoAtivo++;
    if (estado.turnoAtivo >= estado.listaDeIniciativa.length) {
      estado.turnoAtivo = 0;
      estado.turnoAtual++;
      adicionarHistorico(`🔄 Rodada ${estado.turnoAtual} iniciada!`, "turno");
      if (config.expiracaoCondicao !== "turno") decrementarCondicoes();
      estado.efeitosTemporarios = estado.efeitosTemporarios.map(e => ({ ...e, turnos: e.turnos - 1 }));
      estado.efeitosTemporarios.forEach(e => {
        if (e.turnos <= 0) adicionarHistorico(`⏰ Efeito expirado: "${e.nome}"`, "falha");
        else if (e.turnos === 1) adicionarHistorico(`⚠️ "${e.nome}" expira no próximo turno!`);
      });
      estado.efeitosTemporarios = estado.efeitosTemporarios.filter(e => e.turnos > 0);
    }
    tentativas++;
  } while (estado.listaDeIniciativa[estado.turnoAtivo]?.morto && tentativas < estado.listaDeIniciativa.length);

  // Modo "no turno do personagem": só a criatura cujo turno chegou tem suas condições decrementadas
  if (config.expiracaoCondicao === "turno") {
    const atual = estado.listaDeIniciativa[estado.turnoAtivo];
    if (atual && !atual.morto) decrementarCondicoes([atual]);
  }

  salvarESincronizar();
}

function turnoAnterior() {
  if (estado.listaDeIniciativa.length === 0) return;
  estado.turnoAtivo = (estado.turnoAtivo - 1 + estado.listaDeIniciativa.length) % estado.listaDeIniciativa.length;
  salvarESincronizar();
}

/* ==========================================================================
   AÇÕES DO COMBATENTE ATIVO
   ========================================================================== */
function abrirTurnoAcaoAtaque() {
  const atual = estado.listaDeIniciativa[estado.turnoAtivo];
  if (!atual) return;
  if (config.etapaAcerto) abrirModalAcerto(atual.id);
  else abrirModalDanoCura([], "dano", atual.id);
}

/** (Re)constrói as opções do popover, refletindo quais condições já estão ativas */
function renderizarOpcoesPopoverCondicao(popover, criatura) {
  popover.innerHTML = "";
  CONDICOES.forEach(cond => {
    const ativa = (criatura.condicoes || []).some(c => c.id === cond.id);
    const opcao = document.createElement("button");
    opcao.className = "condicao-opcao" + (ativa ? " condicao-opcao--ativa" : "");
    opcao.title     = cond.descricao;
    opcao.innerHTML = `<span class="cond-emoji">${cond.emoji}</span><span class="cond-label">${cond.label}</span>`;
    opcao.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCondicao(criatura.id, cond.id);
      // Se a condição já estava ativa, ela é removida na hora (sem modal) — só
      // atualiza a lista. Se abriu o modal de duração, escondemos o popover até
      // ele ser confirmado/fechado (veja fecharModalCondicaoDuracao).
      if ($("modal-condicao-duracao").classList.contains("oculto")) {
        renderizarOpcoesPopoverCondicao(popover, criatura);
      } else {
        popover.style.display = "none";
      }
    });
    popover.appendChild(opcao);
  });
}

function abrirTurnoAcaoCondicao() {
  const atual = estado.listaDeIniciativa[estado.turnoAtivo];
  if (!atual) return;

  // Remove popover anterior se existir
  const popoverAnterior = $("turno-condicoes-popover");
  if (popoverAnterior) popoverAnterior.remove();

  // Cria popover de condições
  const popover = document.createElement("div");
  popover.id = "turno-condicoes-popover";
  popover.className = "condicao-popover";
  popover.style.position = "fixed";
  popover.style.zIndex = "1000";

  renderizarOpcoesPopoverCondicao(popover, atual);

  document.body.appendChild(popover);
  _popoverCondicaoTurno = popover;

  // Posiciona logo acima do botão, sem deixar vazar para fora da tela
  // (em telas de celular o botão pode estar perto da borda direita/topo)
  const btnCondicao = $("btn-turno-condicao");
  const rect = btnCondicao.getBoundingClientRect();
  const margem = 8;

  let left = Math.min(rect.left, window.innerWidth - popover.offsetWidth - margem);
  left = Math.max(margem, left);

  let top = rect.top - popover.offsetHeight - 6;
  if (top < margem) top = Math.min(rect.bottom + 6, window.innerHeight - popover.offsetHeight - margem);

  popover.style.left = left + "px";
  popover.style.top  = top + "px";

  // Fecha ao clicar fora (ignorando cliques dentro do modal de duração,
  // que faz parte do mesmo fluxo de seleção de condições)
  const fecharPopover = (e) => {
    const dentroDoModalDuracao = e.target.closest("#modal-condicao-duracao");
    if (!popover.contains(e.target) && e.target !== btnCondicao && !dentroDoModalDuracao) {
      popover.remove();
      if (_popoverCondicaoTurno === popover) _popoverCondicaoTurno = null;
      document.removeEventListener("click", fecharPopover);
    }
  };
  setTimeout(() => document.addEventListener("click", fecharPopover), 0);
}

// Reabre o popover de condições do turno depois que o modal de duração fecha
// (ele é só escondido durante a escolha da duração — ver condicoes.js).
function reexibirPopoverCondicao() {
  if (_popoverCondicaoTurno && document.body.contains(_popoverCondicaoTurno)) {
    const atual = estado.listaDeIniciativa[estado.turnoAtivo];
    if (atual) {
      renderizarOpcoesPopoverCondicao(_popoverCondicaoTurno, atual);
      _popoverCondicaoTurno.style.display = "";
    } else {
      _popoverCondicaoTurno.remove();
      _popoverCondicaoTurno = null;
    }
  }
}

function abrirTurnoAcaoCura() {
  const atual = estado.listaDeIniciativa[estado.turnoAtivo];
  if (!atual) return;
  abrirModalDanoCura([atual.id], "cura");
}

/** Botão de morte/nocaute: herói vai a nocauteado, monstro vai a morto. Clicar de novo reverte. */
export function alternarMortoNocaute(id) {
  const criatura = estado.listaDeIniciativa.find(c => c.id === id);
  if (!criatura) return;

  if (criatura.morto || criatura.nocauteado) {
    criatura.morto      = false;
    criatura.nocauteado = false;
    adicionarHistorico(`💚 ${criatura.nome} foi revivido!`, "sucesso");
  } else if (criatura.idHeroi) {
    if (!confirm(`Nocautear "${criatura.nome}"?`)) return;
    criatura.nocauteado = true;
    adicionarHistorico(`😵 ${criatura.nome} foi nocauteado!`, "falha");
  } else {
    if (!confirm(`Marcar "${criatura.nome}" como morto?`)) return;
    criatura.morto = true;
    adicionarHistorico(`☠️ ${criatura.nome} morreu!`, "falha");
  }

  salvarESincronizar();
}

/** Botão de morte/nocaute do combatente ativo no painel de turno */
function abrirTurnoAcaoMorto() {
  const atual = estado.listaDeIniciativa[estado.turnoAtivo];
  if (!atual) return;
  alternarMortoNocaute(atual.id);
}

/* ==========================================================================
   PAINEL DO COMBATENTE ATIVO
   ========================================================================== */
export function atualizarPainelTurno() {
  const combateTurnoEl = $("combate-turno-num");
  const linhaEl = $("turno-ativo-linha");
  const cardEl  = $("turno-ativo-card");
  const condCardEl = $("turno-ativo-condicoes-card");
  const vazioEl = $("turno-vazio-msg");
  const acoesEl = $("turno-ativo-acoes");

  if (combateTurnoEl) combateTurnoEl.textContent = estado.turnoAtual;

  if (estado.listaDeIniciativa.length === 0) {
    if (linhaEl)    linhaEl.classList.add("oculto");
    if (cardEl)     cardEl.innerHTML = "";
    if (condCardEl) condCardEl.innerHTML = "";
    if (vazioEl) vazioEl.style.display = "block";
    if (acoesEl) { acoesEl.classList.add("oculto"); acoesEl.innerHTML = ""; }
    return;
  }

  if (linhaEl) linhaEl.classList.remove("oculto");
  if (vazioEl) vazioEl.style.display = "none";
  if (acoesEl) acoesEl.classList.remove("oculto");

  const atual = estado.listaDeIniciativa[estado.turnoAtivo];
  if (!atual) return;

  // Limpa o card ativo para reconstruí-lo idêntico ao painel de combate
  cardEl.innerHTML = "";

  // Coleta dados visuais (Cor e CA)
  const corHeroi = (() => {
    if (!atual.idHeroi) return null;
    const h = estado.partyHerois.find(h => h.id === atual.idHeroi);
    const cor = h?.cor ? CORES_HEROI.find(c => c.id === h.cor) : null;
    return cor?.hex ?? null;
  })();

  const caValor = obterCACriatura(atual);

  // Estilização da borda e classes de estado
  cardEl.className = "turno-ativo-card item-iniciativa item-iniciativa--ativo"
    + (atual.morto ? " item-iniciativa--morto" : "")
    + (atual.nocauteado && !atual.morto ? " item-iniciativa--nocauteado" : "")
    + (!atual.idHeroi ? " item-iniciativa--monstro" : "");

  if (corHeroi) {
    cardEl.style.borderLeft = `4px solid ${corHeroi}`;
    cardEl.style.background = `${corHeroi}22`;
  } else if (!atual.idHeroi) {
    cardEl.style.borderLeft = "4px solid #e63946";
    cardEl.style.background = "";
  } else {
    cardEl.style.borderLeft = "";
    cardEl.style.background = "";
  }

  if (atual.morto) {
    cardEl.style.background = "#2a0a0a";
    cardEl.style.borderLeft = "4px solid #c0392b";
  }

  // ── 1. Cabeçalho (Avatar + Nome + Indicador de Turno/Status)
  const cabecalho = document.createElement("div");
  cabecalho.className = "turno-ativo-cabecalho";

  const topoLinha = document.createElement("div");
  topoLinha.className = "turno-ativo-topo";

  const avatar = document.createElement("div");
  avatar.className = "turno-ativo-avatar";
  preencherAvatar(avatar, atual.nome, obterImagemCriatura(atual));
  if (corHeroi) avatar.style.borderColor = corHeroi;

  const infoCol = document.createElement("div");
  infoCol.className = "turno-ativo-info-col";

  const badge = document.createElement("span");
  badge.className = "turno-ativo-badge";
  badge.textContent = "TURNO ATUAL";

  const badgeLinha = document.createElement("div");
  badgeLinha.className = "turno-ativo-badge-linha";

  const estaCaido = atual.morto || atual.nocauteado;
  const btnMorto = document.createElement("button");
  btnMorto.id = "btn-turno-morto";
  btnMorto.type = "button";
  btnMorto.className = "btn-turno-morto-icone";
  btnMorto.title = estaCaido ? "Reviver" : "Marcar como Morto ou Nocautear";
  btnMorto.textContent = estaCaido ? "💚" : "☠️";
  btnMorto.addEventListener("click", abrirTurnoAcaoMorto);

  badgeLinha.appendChild(badge);
  badgeLinha.appendChild(btnMorto);

  const linhaInfo = document.createElement("div");
  linhaInfo.className = "turno-ativo-header";

  const nome = document.createElement("span");
  nome.className = "turno-ativo-nome";
  nome.textContent = (atual.morto ? "☠️ " : "")
    + (atual.nocauteado && !atual.morto ? "😵 " : "")
    + atual.nome;
  if (corHeroi) nome.style.color = corHeroi;
  else if (!atual.idHeroi) nome.style.color = "var(--red)";

  const dadosLado = document.createElement("div");
  dadosLado.className = "turno-ativo-detalhes";
  const caTexto = caValor !== null ? `CA ${caValor}` : "CA ?";
  const iniciativaTexto = `Ini: ${atual.valor}`;
  const detalheCA = document.createElement("span");
  detalheCA.className = "turno-ativo-ini";
  detalheCA.textContent = caTexto;
  const detalheIni = document.createElement("span");
  detalheIni.className = "turno-ativo-ini";
  detalheIni.textContent = iniciativaTexto;
  dadosLado.appendChild(detalheCA);
  dadosLado.appendChild(detalheIni);

  linhaInfo.appendChild(nome);
  linhaInfo.appendChild(dadosLado);

  infoCol.appendChild(badgeLinha);
  infoCol.appendChild(linhaInfo);

  topoLinha.appendChild(avatar);
  topoLinha.appendChild(infoCol);
  cabecalho.appendChild(topoLinha);

  // ── 2. HP e condições
  const stats = document.createElement("div");
  stats.className = "turno-ativo-status";

  const hpLinha = document.createElement("div");
  hpLinha.className = "turno-ativo-hp-row";
  const hpLabel = document.createElement("span");
  hpLabel.className = "turno-ativo-hp-label";
  hpLabel.textContent = "HP:";
  const hpValor = document.createElement("span");
  hpValor.className = "turno-ativo-hp-valor";
  hpValor.textContent = `${atual.hpAtual}/${atual.hpMax}`;
  hpLinha.appendChild(hpLabel);
  hpLinha.appendChild(hpValor);

  const pctHP = atual.hpMax > 0 ? (atual.hpAtual / atual.hpMax) * 100 : 0;
  const corHP = calcularCorHP(atual.hpAtual, atual.hpMax);

  const barraWrap = document.createElement("div");
  barraWrap.className = "barra-hp-wrap turno-ativo-barra";
  const barraFill = document.createElement("div");
  barraFill.className = "barra-hp-fill";
  barraFill.style.width = `${Math.max(0, Math.min(100, pctHP))}%`;
  barraFill.style.background = corHP;
  barraWrap.appendChild(barraFill);

  stats.appendChild(hpLinha);
  stats.appendChild(barraWrap);

  // ── 2.5. Card de condições, ao lado do card principal (mesmo estilo do painel de combate)
  if (condCardEl) {
    condCardEl.innerHTML = "";

    const tituloCond = document.createElement("div");
    tituloCond.className = "turno-cond-card-titulo";
    tituloCond.textContent = "🩺 Condições";
    condCardEl.appendChild(tituloCond);

    const condicoesDaCriatura = atual.condicoes || [];
    if (condicoesDaCriatura.length === 0) {
      const vazio = document.createElement("p");
      vazio.className = "efeitos-vazio";
      vazio.textContent = "Nenhuma condição ativa.";
      condCardEl.appendChild(vazio);
    } else {
      const tagsWrap = document.createElement("div");
      tagsWrap.className = "turno-cond-card-tags";
      condicoesDaCriatura.forEach(condObj => {
        const cond = CONDICOES.find(c => c.id === condObj.id);
        if (!cond) return;
        const tag = document.createElement("span");
        tag.className = "item-ini-cond-tag";
        const duracaoTxt = condObj.turnos !== null
          ? ` (${condObj.turnos} turno${condObj.turnos > 1 ? "s" : ""})`
          : "";
        tag.textContent = `${cond.emoji} ${cond.label}${duracaoTxt}`;
        tagsWrap.appendChild(tag);
      });
      condCardEl.appendChild(tagsWrap);
    }
  }

  // ── 3. Ações do combatente ativo no painel de turno (renderizadas fora do card)
  const divAcoesTurno = acoesEl;
  if (divAcoesTurno) divAcoesTurno.innerHTML = "";

  const btnAtaque = document.createElement("button");
  btnAtaque.id = "btn-turno-ataque";
  btnAtaque.type = "button";
  btnAtaque.className = "btn-turno-acao btn-turno-acao--ataque";
  btnAtaque.textContent = "⚔️ Ataque";
  btnAtaque.addEventListener("click", abrirTurnoAcaoAtaque);

  const btnCondicao = document.createElement("button");
  btnCondicao.id = "btn-turno-condicao";
  btnCondicao.type = "button";
  btnCondicao.className = "btn-turno-acao btn-turno-acao--condicao";
  btnCondicao.textContent = "🩺 Condição";
  btnCondicao.addEventListener("click", abrirTurnoAcaoCondicao);

  const btnCura = document.createElement("button");
  btnCura.id = "btn-turno-cura";
  btnCura.type = "button";
  btnCura.className = "btn-turno-acao btn-turno-acao--cura";
  btnCura.textContent = "💊 Cura";
  btnCura.addEventListener("click", abrirTurnoAcaoCura);

  divAcoesTurno.appendChild(btnAtaque);
  divAcoesTurno.appendChild(btnCura);
  divAcoesTurno.appendChild(btnCondicao);

  // Montagem final do card de turno ativo
  cardEl.appendChild(cabecalho);
  cardEl.appendChild(stats);
}

/** Liga os controles de turno. Chamado no boot pelo main. */
export function initTurno() {
  $("btn-turno-anterior").addEventListener("click", turnoAnterior);
  $("btn-proximo-turno").addEventListener("click", proximoTurno);
  aoFecharModalCondicao(reexibirPopoverCondicao);
}
