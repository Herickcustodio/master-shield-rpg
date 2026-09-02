/* ==========================================================================
   DANO / CURA — modal de acerto, modal de dano/cura (individual e em lote)
   e as versões em área. Todo HP zerado passa por processarHPZero().
   ========================================================================== */
import { $ } from "./dom.js";
import { estado } from "./state.js";
import { config } from "./config.js";
import { adicionarHistorico } from "./historico.js";
import { salvarESincronizar } from "./sync.js";
import { renderizarListaAlvos, selecionarTodosAlvos, obterCACriatura } from "./ui.js";
import { marcarMorto, aplicarCondicao } from "./condicoes.js";
import { CONDICOES } from "./constantes.js";

let _modalDanoCuraIds  = [];
let _modalDanoCuraTipo = null;
let _acertoAtacanteId  = null;
let _acertoCritico     = false; // último acerto rolado foi crítico? (leva o botão ×2 ao dano)
let _x2Ativo           = false; // botão "×2 crítico" ligado no modal de dano/cura?
let _formulaBaseModal  = "";    // fórmula da última rolagem do modal, sem o sufixo " ×2"

/* ==========================================================================
   DANO EM ÁREA
   ========================================================================== */
function abrirModalArea() {
  if (estado.listaDeIniciativa.length === 0) {
    alert("Não há combatentes no combate!");
    return;
  }

  // Reseta campos
  $("area-fonte").value        = "";
  $("area-nome-habilidade").value = "";
  $("area-qtd").value          = "1";
  $("area-tipo").value         = "8";
  $("area-modificador").value  = "0";
  $("area-valor-manual").value = "";
  $("area-resultado").textContent  = "—";
  $("area-resultado").className    = "modal-dano-valor modal-dano-valor--dano";
  $("area-formula").textContent    = "";

  popularFonteArea();
  renderizarAlvosArea();
  $("modal-area").classList.remove("oculto");
}

/** Sugestões da "Fonte do dano" — combatentes vivos; o campo aceita texto livre. */
function popularFonteArea() {
  const dl = $("area-fonte-lista");
  dl.innerHTML = "";
  estado.listaDeIniciativa.filter(c => !c.morto).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.nome;
    dl.appendChild(opt);
  });
}

function fecharModalArea() {
  $("modal-area").classList.add("oculto");
}

function renderizarAlvosArea() {
  renderizarListaAlvos("area-alvos-lista", {
    preSelecionados: estado.listaDeIniciativa.filter(c => !c.morto).map(c => c.id),
  });
}

function rolarDadoArea() {
  const qtd  = parseInt($("area-qtd").value)         || 1;
  const lados = parseInt($("area-tipo").value)        || 8;
  const mod   = parseInt($("area-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total = Math.max(0, soma + mod);

  $("area-resultado").textContent = total;
  const sinal = mod >= 0 ? "+" : "";
  $("area-formula").textContent = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;
  $("area-valor-manual").value  = total;
}

function confirmarDanoArea() {
  const valor = parseInt($("area-valor-manual").value);
  if (isNaN(valor) || valor < 0) {
    $("area-valor-manual").focus(); return;
  }

  const selecionados = [...document.querySelectorAll("#area-alvos-lista .area-alvo-cb:checked")].map(cb => cb.value);
  if (selecionados.length === 0) {
    alert("Selecione pelo menos um alvo!"); return;
  }

  const nomes = [];
  selecionados.forEach(id => {
    const c = estado.listaDeIniciativa.find(x => x.id == id);
    if (!c) return;
    const antes = c.hpAtual;
    c.hpAtual = Math.max(0, c.hpAtual - valor);
    nomes.push(`${c.nome} (${antes}→${c.hpAtual})`);
    if (c.hpAtual === 0 && !c.morto) processarHPZero(c);
  });

  const fonte          = $("area-fonte").value.trim();
  const nomeHabilidade = $("area-nome-habilidade").value.trim();

  let rotulo;
  if (fonte && nomeHabilidade) rotulo = `${fonte} — ${nomeHabilidade}`;
  else if (fonte)              rotulo = fonte;
  else if (nomeHabilidade)     rotulo = nomeHabilidade;
  else                         rotulo = "Dano em área";

  adicionarHistorico(`💥 ${rotulo} (${valor}): ${nomes.join(", ")}`, "falha");
  fecharModalArea();
  salvarESincronizar();
}

/* ==========================================================================
   CURA EM ÁREA
   ========================================================================== */
function abrirModalCuraArea() {
  if (estado.listaDeIniciativa.length === 0) {
    alert("Não há combatentes no combate!");
    return;
  }

  // Curador — sugere todos os combatentes vivos (heróis e monstros); começa
  // vazio para não filtrar o datalist, e aceita texto livre ("Fonte sagrada"…)
  const dl = $("cura-area-curador-lista");
  dl.innerHTML = "";
  estado.listaDeIniciativa.filter(c => !c.morto).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.nome;
    dl.appendChild(opt);
  });
  $("cura-area-curador").value = "";

  $("cura-area-qtd").value          = "1";
  $("cura-area-tipo").value         = "8";
  $("cura-area-modificador").value  = "0";
  $("cura-area-valor-manual").value = "";
  $("cura-area-resultado").textContent = "—";
  $("cura-area-formula").textContent   = "";

  renderizarListaAlvos("cura-area-alvos-lista", {
    preSelecionados: estado.listaDeIniciativa.filter(c => !c.morto).map(c => c.id),
  });

  $("modal-cura-area").classList.remove("oculto");
}

function fecharModalCuraArea() {
  $("modal-cura-area").classList.add("oculto");
}

function rolarDadoCuraArea() {
  const qtd   = parseInt($("cura-area-qtd").value)         || 1;
  const lados = parseInt($("cura-area-tipo").value)        || 8;
  const mod   = parseInt($("cura-area-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total = Math.max(0, soma + mod);

  $("cura-area-resultado").textContent = total;
  const sinal = mod >= 0 ? "+" : "";
  $("cura-area-formula").textContent = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;
  $("cura-area-valor-manual").value   = total;
}

function confirmarCuraArea() {
  const valor = parseInt($("cura-area-valor-manual").value);
  if (isNaN(valor) || valor < 0) {
    $("cura-area-valor-manual").focus(); return;
  }

  const selecionados = [...document.querySelectorAll("#cura-area-alvos-lista .area-alvo-cb:checked")]
    .map(cb => estado.listaDeIniciativa.find(c => c.id == cb.value))
    .filter(Boolean);
  if (selecionados.length === 0) {
    alert("Selecione pelo menos um alvo!"); return;
  }

  const nomes = [];
  selecionados.forEach(c => {
    const antes = c.hpAtual;
    c.hpAtual = Math.min(c.hpMax, c.hpAtual + valor);
    nomes.push(`${c.nome} (${antes}→${c.hpAtual})`);
    reviverSeCurada(c);
  });

  const curador = $("cura-area-curador").value.trim();
  const prefixo = curador ? `${curador} curou` : "Cura em área";
  adicionarHistorico(`💚 ${prefixo} (${valor}): ${nomes.join(", ")}`, "sucesso");

  fecharModalCuraArea();
  salvarESincronizar();
}

/** Oposto de processarHPZero: quando uma cura devolve HP, tira do nocaute e
 *  ressuscita quem estava marcado como morto (herói ou monstro). */
function reviverSeCurada(criatura) {
  if (criatura.hpAtual <= 0) return;
  if (criatura.nocauteado) {
    criatura.nocauteado = false;
    adicionarHistorico(`💪 ${criatura.nome} se recuperou do nocaute!`, "sucesso");
  }
  if (criatura.morto) {
    criatura.morto = false;
    adicionarHistorico(`💚 ${criatura.nome} voltou à vida com a cura!`, "sucesso");
  }
}

/** Processa HP zerado: monstro morre, herói fica nocauteado */
export function processarHPZero(criatura) {
  const ehHeroi = !!criatura.idHeroi;
  if (ehHeroi) {
    criatura.nocauteado = true;
    adicionarHistorico(`😵 ${criatura.nome} está nocauteado! (0 HP)`, "falha");
  } else if (config.autoMorte) {
    criatura.morto = true;
    adicionarHistorico(`☠️ ${criatura.nome} morreu!`, "falha");
  } else {
    adicionarHistorico(`💀 ${criatura.nome} chegou a 0 HP!`, "falha");
  }
}

/* ==========================================================================
   MODAL DE ACERTO
   ========================================================================== */
export function abrirModalAcerto(atacanteId) {
  const atacante = estado.listaDeIniciativa.find(c => c.id === atacanteId);
  if (!atacante) return;

  _acertoAtacanteId = atacanteId;
  _acertoCritico    = false;

  $("modal-acerto-titulo").textContent = `🎯 Acerto — ${atacante.nome}`;
  $("acerto-atacante-info").innerHTML  = `⚔️ Atacante: <strong>${atacante.nome}</strong>`;

  // Lista de alvos — nada pré-selecionado, o mestre escolhe quem é atacado
  renderizarListaAlvos("acerto-alvos-lista", { mostrarCA: true });

  // Reseta campos
  $("acerto-qtd").value         = "1";
  $("acerto-tipo").value        = "20";
  $("acerto-modificador").value = "0";
  $("acerto-resultado-wrap").style.display  = "none";
  $("acerto-resultado-display").innerHTML   = "";
  $("acerto-resultado-alvos").innerHTML     = "";

  $("modal-acerto").classList.remove("oculto");
  $("acerto-modificador").focus();
}

function fecharModalAcerto() {
  $("modal-acerto").classList.add("oculto");
  _acertoAtacanteId = null;
}

/* _acertoCritico é lido em irParaDano() antes de fechar o modal — não é
   zerado aqui de propósito; o próximo abrirModalAcerto() reseta. */

function alvosSelecionadosAcerto() {
  return [...document.querySelectorAll("#acerto-alvos-lista .area-alvo-cb:checked")]
    .map(cb => estado.listaDeIniciativa.find(c => c.id == cb.value))
    .filter(Boolean);
}

function rolarAcerto() {
  const qtd   = parseInt($("acerto-qtd").value)         || 1;
  const lados = parseInt($("acerto-tipo").value)        || 20;
  const mod   = parseInt($("acerto-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total   = soma + mod;
  const sinal   = mod >= 0 ? "+" : "";
  const formula = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;

  const critico      = lados === 20 && qtd === 1 && rolagens[0] === 20;
  const falhaCritica = lados === 20 && qtd === 1 && rolagens[0] === 1;
  _acertoCritico = critico;

  const wrap        = $("acerto-resultado-wrap");
  const display      = $("acerto-resultado-display");
  const alvosDisplay = $("acerto-resultado-alvos");
  wrap.style.display = "block";

  let badgeGeral = "";
  if (critico)           badgeGeral = `<span class="acerto-badge acerto-badge--critico">⚔️ Crítico!</span>`;
  else if (falhaCritica) badgeGeral = `<span class="acerto-badge acerto-badge--falha">💀 Falha Crítica!</span>`;

  display.innerHTML = `
    <div class="acerto-total ${critico ? "acerto-total--critico" : falhaCritica ? "acerto-total--falha" : ""}">${total}</div>
    <div class="acerto-formula">${formula}</div>
    ${badgeGeral}
  `;

  const atacante     = estado.listaDeIniciativa.find(c => c.id === _acertoAtacanteId);
  const nomeAtacante = atacante?.nome ?? "?";
  const alvos        = alvosSelecionadosAcerto();

  alvosDisplay.innerHTML = "";
  const logAlvos = [];

  if (alvos.length === 0) {
    alvosDisplay.innerHTML = `<p class="acerto-sem-alvo">Selecione ao menos um alvo para comparar com a CA.</p>`;
  }

  alvos.forEach(alvo => {
    const ca      = obterCACriatura(alvo);
    const acertou = critico ? true : falhaCritica ? false : (ca !== null ? total >= ca : null);

    let badgeAlvo;
    if (critico)                badgeAlvo = `<span class="acerto-badge acerto-badge--critico">Crítico!</span>`;
    else if (falhaCritica)      badgeAlvo = `<span class="acerto-badge acerto-badge--falha">Falha!</span>`;
    else if (acertou === true)  badgeAlvo = `<span class="acerto-badge acerto-badge--acertou">Acertou!</span>`;
    else if (acertou === false) badgeAlvo = `<span class="acerto-badge acerto-badge--errou">Errou!</span>`;
    else                        badgeAlvo = `<span class="acerto-badge">CA desconhecida</span>`;

    const linha = document.createElement("div");
    linha.className = "acerto-alvo-resultado";
    linha.innerHTML = `<span class="acerto-alvo-nome">${alvo.nome}${ca !== null ? ` (CA ${ca})` : ""}</span>${badgeAlvo}`;
    alvosDisplay.appendChild(linha);

    logAlvos.push(`${alvo.nome}${acertou === true ? " — Acertou!" : acertou === false ? " — Errou!" : ""}`);
  });

  const sufixoAlvos = logAlvos.length ? ` contra ${logAlvos.join(", ")}` : "";
  const logTipo = critico ? "sucesso" : falhaCritica ? "falha" : "";
  adicionarHistorico(`🎯 ${nomeAtacante} rolou acerto${sufixoAlvos}: ${total} ${formula}`, logTipo);
}

function irParaDano() {
  const idsAlvos   = alvosSelecionadosAcerto().map(c => c.id);
  const atacanteId = _acertoAtacanteId;
  const critico    = _acertoCritico;
  fecharModalAcerto();
  abrirModalDanoCura(idsAlvos, "dano", atacanteId, critico);
}

/* ==========================================================================
   MODAL DE DANO / CURA
   ========================================================================== */
export function abrirModalDanoCura(ids, tipo, atacantePreId = null, critico = false) {
  const idsArr = (Array.isArray(ids) ? ids : [ids]).filter(id => id !== null && id !== undefined);
  const isDano = tipo === "dano";

  if (!isDano && !estado.listaDeIniciativa.find(c => c.id === idsArr[0])) return;

  _modalDanoCuraIds  = idsArr;
  _modalDanoCuraTipo = tipo;

  $("modal-dano-resultado").textContent = "—";
  $("modal-dano-resultado").className   = "modal-dano-valor";
  $("modal-dano-formula-txt").textContent = "";
  $("modal-dano-modificador").value     = "0";
  $("modal-dano-manual").value          = "";
  $("modal-dano-qtd").value             = "1";
  $("modal-dano-tipo").value            = "20";

  // Botão "×2 crítico" — toggle manual; começa desligado a cada abertura.
  // A classe --critico é só um realce indicando que o acerto foi crítico.
  _x2Ativo          = false;
  _formulaBaseModal = "";
  $("btn-dano-critico").classList.toggle("btn-dano-critico--critico", !!critico);
  atualizarBotaoX2();

  $("btn-confirmar-dano").textContent   = isDano ? "⚔️ Aplicar Dano" : "💊 Aplicar Cura";
  $("btn-confirmar-dano").className     = isDano ? "btn-confirmar btn-confirmar-dano" : "btn-confirmar btn-confirmar-cura";

  const tituloEl  = $("modal-dano-titulo");
  const hpAtualEl = $("modal-dano-hp-atual");
  const alvosWrap = $("modal-dano-alvos-wrap");

  const curaAlvoWrap = $("modal-dano-cura-alvo-wrap");
  if (isDano) {
    tituloEl.textContent    = "⚔️ Dano";
    hpAtualEl.style.display = "none";
    alvosWrap.style.display = "block";
    curaAlvoWrap.style.display = "none";
    // Alvo(s) já escolhidos na etapa de acerto vêm pré-selecionados; pode-se ajustar aqui
    renderizarListaAlvos("modal-dano-alvos-lista", { preSelecionados: idsArr, mostrarCA: true });
  } else {
    // Cura de 1 alvo — quem curar é escolhível (vários alvos → Cura em Área)
    const selAlvo = $("modal-dano-cura-alvo");
    selAlvo.innerHTML = "";
    estado.listaDeIniciativa.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.morto ? `☠️ ${c.nome}` : c.nome;
      if (c.id === idsArr[0]) opt.selected = true;
      selAlvo.appendChild(opt);
    });
    curaAlvoWrap.style.display = "block";
    hpAtualEl.style.display = "block";
    alvosWrap.style.display = "none";
  }

  // Seletor de atacante — por padrão o ativo do turno, mas pode ser trocado
  // (ex.: o alvo tomou um ataque de oportunidade de outro combatente)
  const atacanteWrap = $("modal-dano-atacante-wrap");
  if (isDano) {
    atacanteWrap.style.display = "block";
    const sel = $("modal-dano-atacante");
    sel.innerHTML = "";
    const ativo = estado.listaDeIniciativa[estado.turnoAtivo];
    estado.listaDeIniciativa.filter(c => !c.morto).forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nome;
      const preSelecionar = atacantePreId ? c.id == atacantePreId : (ativo && c.id === ativo.id);
      if (preSelecionar) opt.selected = true;
      sel.appendChild(opt);
    });
  } else {
    atacanteWrap.style.display = "none";
  }

  // Extras do ataque (nome do golpe + condição no acerto) — só no modo dano
  $("modal-dano-extras").style.display = isDano ? "block" : "none";
  $("modal-dano-nome-ataque").value = "";
  $("modal-dano-condicao").value = "";
  $("modal-dano-condicao-turnos").value = "";
  $("modal-dano-condicao-turnos-wrap").style.display = "none";

  // Prévia
  const previa = $("modal-dano-previa");
  previa.style.display = "none";
  previa.innerHTML = "";

  const btnMortoModal = $("btn-morto-modal");
  if (isDano) {
    const unico = idsArr.length === 1 ? estado.listaDeIniciativa.find(c => c.id === idsArr[0]) : null;
    btnMortoModal.style.display = unico ? "block" : "none";
    if (unico) {
      btnMortoModal.textContent = unico.morto ? "💚 Reviver" : "☠️ Marcar como Morto";
      btnMortoModal.className   = unico.morto ? "btn-morto-modal btn-morto-modal--reviver" : "btn-morto-modal";
    }
  } else {
    btnMortoModal.style.display = "block";
  }

  const aviso = $("modal-dano-aviso");
  if (aviso) aviso.style.display = isDano ? "none" : "block";

  // Título, HP atual, botão de morte e prévia do modo cura acompanham o alvo escolhido
  if (!isDano) sincronizarAlvoCura();

  $("modal-dano-cura").classList.remove("oculto");
  $("modal-dano-modificador").focus();
}

/** Reflete no modal de cura o alvo escolhido no seletor "Quem curar". */
function sincronizarAlvoCura() {
  const criatura = estado.listaDeIniciativa.find(c => c.id == $("modal-dano-cura-alvo").value);
  if (!criatura) return;
  _modalDanoCuraIds = [criatura.id];

  $("modal-dano-titulo").textContent   = `💊 Cura — ${criatura.nome}`;
  $("modal-dano-hp-atual").textContent = `HP atual: ${criatura.hpAtual} / ${criatura.hpMax}`;

  const btnMorto = $("btn-morto-modal");
  btnMorto.textContent = criatura.morto ? "💚 Reviver" : "☠️ Marcar como Morto";
  btnMorto.className   = criatura.morto ? "btn-morto-modal btn-morto-modal--reviver" : "btn-morto-modal";

  atualizarPrevia();
}

function fecharModalDanoCura() {
  $("modal-dano-cura").classList.add("oculto");
  _modalDanoCuraIds  = [];
  _modalDanoCuraTipo = null;
  _x2Ativo           = false;
  _formulaBaseModal  = "";
}

function alvosSelecionadosDano() {
  return [...document.querySelectorAll("#modal-dano-alvos-lista .area-alvo-cb:checked")]
    .map(cb => estado.listaDeIniciativa.find(c => c.id == cb.value))
    .filter(Boolean);
}

/** Valor digitado/rolado, sem o ×2. NaN se vazio ou negativo. */
function valorBaseModal() {
  const v = parseInt($("modal-dano-manual").value);
  return (isNaN(v) || v < 0) ? NaN : v;
}

/** Valor que será realmente aplicado (dobrado se o ×2 estiver ligado). */
function valorEfetivoModal() {
  const b = valorBaseModal();
  return isNaN(b) ? NaN : (_x2Ativo ? b * 2 : b);
}

/** Espelha o número grande + a fórmula conforme a base e o toggle ×2. */
function refletirResultadoModal() {
  const ef   = valorEfetivoModal();
  const disp = $("modal-dano-resultado");
  disp.textContent = isNaN(ef) ? "—" : ef;
  disp.className   = "modal-dano-valor " + (_modalDanoCuraTipo === "dano" ? "modal-dano-valor--dano" : "modal-dano-valor--cura");
  const sufixoX2 = (_x2Ativo && !isNaN(ef)) ? (_formulaBaseModal ? " ×2" : "×2 crítico") : "";
  $("modal-dano-formula-txt").textContent = _formulaBaseModal + sufixoX2;
}

/** Reflete no botão ×2 o estado ligado/desligado. */
function atualizarBotaoX2() {
  const btn = $("btn-dano-critico");
  btn.classList.toggle("btn-dano-critico--ativo", _x2Ativo);
  btn.setAttribute("aria-pressed", String(_x2Ativo));
  btn.textContent = _x2Ativo ? "×2 crítico ✓" : "×2 crítico";
}

function atualizarPrevia() {
  const valor  = valorEfetivoModal();
  const previa = $("modal-dano-previa");
  if (isNaN(valor)) { previa.style.display = "none"; return; }

  const isDano = _modalDanoCuraTipo === "dano";

  if (isDano) {
    const alvos = alvosSelecionadosDano();
    if (alvos.length === 0) { previa.style.display = "none"; return; }

    const sel        = $("modal-dano-atacante");
    const atacanteId = sel ? sel.value : null;
    const atacante   = atacanteId ? estado.listaDeIniciativa.find(c => c.id == atacanteId) : null;

    previa.innerHTML = alvos.map(criatura => {
      const hpFinal = Math.max(0, criatura.hpAtual - valor);
      const prefixo = atacante ? `${atacante.nome} → ${criatura.nome}` : criatura.nome;
      return `<div class="previa-dano-linha"><span class="previa-ataque">${prefixo}</span><span class="previa-dano">-${valor}</span><span class="previa-hp">${criatura.hpAtual} → ${hpFinal} HP</span></div>`;
    }).join("");
    previa.className = "modal-dano-previa modal-dano-previa--dano";
  } else {
    const criatura = estado.listaDeIniciativa.find(c => c.id === _modalDanoCuraIds[0]);
    if (!criatura) { previa.style.display = "none"; return; }
    const hpFinal = Math.min(criatura.hpMax, criatura.hpAtual + valor);
    previa.innerHTML = `<span class="previa-ataque">${criatura.nome}</span><span class="previa-cura">+${valor}</span><span class="previa-hp">${criatura.hpAtual} → ${hpFinal} HP</span>`;
    previa.className = "modal-dano-previa modal-dano-previa--cura";
  }

  previa.style.display = "flex";
}

function rolarDadoModal() {
  const quantidade  = parseInt($("modal-dano-qtd").value)  || 1;
  const lados       = parseInt($("modal-dano-tipo").value)  || 20;
  const modificador = parseInt($("modal-dano-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < quantidade; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r;
    rolagens.push(r);
  }
  const total = Math.max(0, soma + modificador);

  const sinal = modificador >= 0 ? "+" : "";
  _formulaBaseModal = `(${quantidade}d${lados}: [${rolagens.join(", ")}] ${sinal}${modificador})`;
  $("modal-dano-manual").value = total;   // guarda sempre a base; o ×2 é aplicado ao exibir/confirmar
  refletirResultadoModal();
  atualizarPrevia();
}

/** Liga/desliga a duplicação do valor (acerto/cura crítico). Nunca automático. */
function alternarX2() {
  if (isNaN(valorBaseModal())) { $("modal-dano-manual").focus(); return; }
  _x2Ativo = !_x2Ativo;
  atualizarBotaoX2();
  refletirResultadoModal();
  atualizarPrevia();
}

function confirmarDanoCura() {
  const valor = valorEfetivoModal();
  if (isNaN(valor)) { $("modal-dano-manual").focus(); return; }

  const isDano = _modalDanoCuraTipo === "dano";

  if (isDano) {
    const alvos = alvosSelecionadosDano();
    if (alvos.length === 0) return;

    const sel         = $("modal-dano-atacante");
    const atacanteId  = sel ? sel.value : null;
    const atacante    = atacanteId ? estado.listaDeIniciativa.find(c => c.id == atacanteId) : null;
    const nomeAtacante = atacante ? atacante.nome : null;

    const nomeAtaque  = $("modal-dano-nome-ataque").value.trim();

    const condId        = $("modal-dano-condicao").value;
    const condTurnosVal = $("modal-dano-condicao-turnos").value.trim();
    const condTurnos    = condTurnosVal !== "" ? parseInt(condTurnosVal) || 1 : null;

    alvos.forEach(criatura => {
      const hpAntes = criatura.hpAtual;
      criatura.hpAtual = Math.max(0, criatura.hpAtual - valor);

      let logTxt;
      if (nomeAtacante && nomeAtaque)
        logTxt = `⚔️ ${nomeAtacante} usou ${nomeAtaque} e causou ${valor} de dano em ${criatura.nome}! (${hpAntes} → ${criatura.hpAtual} HP)`;
      else if (nomeAtacante)
        logTxt = `⚔️ ${nomeAtacante} causou ${valor} de dano em ${criatura.nome}! (${hpAntes} → ${criatura.hpAtual} HP)`;
      else if (nomeAtaque)
        logTxt = `⚔️ ${criatura.nome} recebeu ${valor} de dano (${nomeAtaque}) (${hpAntes} → ${criatura.hpAtual} HP)`;
      else
        logTxt = `⚔️ ${criatura.nome} recebeu ${valor} de dano (${hpAntes} → ${criatura.hpAtual} HP)`;
      adicionarHistorico(logTxt, "falha");
      if (criatura.hpAtual === 0 && !criatura.morto) processarHPZero(criatura);
    });

    // Condição aplicada junto com o golpe (ex.: golpe de escudo → atordoado)
    if (condId) {
      alvos.forEach(criatura => {
        if (!criatura.morto) aplicarCondicao(criatura.id, condId, condTurnos);
      });
    }
  } else {
    const criatura = estado.listaDeIniciativa.find(c => c.id === _modalDanoCuraIds[0]);
    if (!criatura) return;

    const hpAntes = criatura.hpAtual;
    criatura.hpAtual = Math.min(criatura.hpMax, criatura.hpAtual + valor);
    adicionarHistorico(`💊 ${criatura.nome} recuperou ${valor} de HP (${hpAntes} → ${criatura.hpAtual} HP)`, "sucesso");
    reviverSeCurada(criatura);
  }

  fecharModalDanoCura();
  salvarESincronizar();
}

function mortoViaModal() {
  const id = _modalDanoCuraIds[0];
  fecharModalDanoCura();
  marcarMorto(id);
}

/** Preenche o select de condição do modal de dano a partir de CONDICOES. */
function popularSelectCondicoes() {
  const sel = $("modal-dano-condicao");
  sel.innerHTML = '<option value="">— Nenhuma —</option>';
  CONDICOES.forEach(cond => {
    const opt = document.createElement("option");
    opt.value = cond.id;
    opt.textContent = `${cond.emoji} ${cond.label}`;
    sel.appendChild(opt);
  });
}

/** Liga os modais de acerto, dano/cura e dano/cura em área. Chamado no boot pelo main. */
export function initDano() {
  $("fechar-dano-cura").addEventListener("click", fecharModalDanoCura);
  $("btn-confirmar-dano").addEventListener("click", confirmarDanoCura);
  $("btn-morto-modal").addEventListener("click", mortoViaModal);
  $("btn-rolar-dano-modal").addEventListener("click", rolarDadoModal);
  $("btn-dano-critico").addEventListener("click", alternarX2);
  $("modal-dano-manual").addEventListener("input", () => {
    _formulaBaseModal = "";        // valor digitado à mão não tem fórmula de dado
    refletirResultadoModal();
    atualizarPrevia();
  });

  popularSelectCondicoes();
  $("modal-dano-condicao").addEventListener("change", () => {
    $("modal-dano-condicao-turnos-wrap").style.display = $("modal-dano-condicao").value ? "block" : "none";
  });
  $("modal-dano-cura-alvo").addEventListener("change", sincronizarAlvoCura);
  $("modal-dano-atacante").addEventListener("change", atualizarPrevia);
  $("modal-dano-alvos-lista").addEventListener("change", atualizarPrevia);
  $("btn-dano-alvo-todos").addEventListener("click", () => { selecionarTodosAlvos("modal-dano-alvos-lista", true); atualizarPrevia(); });
  $("btn-dano-alvo-nenhum").addEventListener("click", () => { selecionarTodosAlvos("modal-dano-alvos-lista", false); atualizarPrevia(); });
  window.addEventListener("click", (e) => { if (e.target === $("modal-dano-cura")) fecharModalDanoCura(); });
  $("modal-dano-cura").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarDanoCura(); });

  $("btn-abrir-area").addEventListener("click", abrirModalArea);
  $("fechar-area").addEventListener("click", fecharModalArea);
  $("btn-rolar-area").addEventListener("click", rolarDadoArea);
  $("btn-confirmar-area").addEventListener("click", confirmarDanoArea);
  $("btn-area-todos").addEventListener("click", () => selecionarTodosAlvos("area-alvos-lista", true));
  $("btn-area-nenhum").addEventListener("click", () => selecionarTodosAlvos("area-alvos-lista", false));
  window.addEventListener("click", (e) => { if (e.target === $("modal-area")) fecharModalArea(); });

  $("btn-abrir-cura-area").addEventListener("click", abrirModalCuraArea);
  $("fechar-cura-area").addEventListener("click", fecharModalCuraArea);
  $("btn-rolar-cura-area").addEventListener("click", rolarDadoCuraArea);
  $("btn-confirmar-cura-area").addEventListener("click", confirmarCuraArea);
  $("btn-cura-area-todos").addEventListener("click", () => selecionarTodosAlvos("cura-area-alvos-lista", true));
  $("btn-cura-area-nenhum").addEventListener("click", () => selecionarTodosAlvos("cura-area-alvos-lista", false));
  window.addEventListener("click", (e) => { if (e.target === $("modal-cura-area")) fecharModalCuraArea(); });

  $("fechar-acerto").addEventListener("click", fecharModalAcerto);
  $("btn-rolar-acerto").addEventListener("click", rolarAcerto);
  $("btn-acerto-aplicar-dano").addEventListener("click", irParaDano);
  $("btn-acerto-pular").addEventListener("click", irParaDano);
  $("btn-acerto-alvo-todos").addEventListener("click", () => selecionarTodosAlvos("acerto-alvos-lista", true));
  $("btn-acerto-alvo-nenhum").addEventListener("click", () => selecionarTodosAlvos("acerto-alvos-lista", false));
  window.addEventListener("click", (e) => { if (e.target === $("modal-acerto")) fecharModalAcerto(); });
}
