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
import { marcarMorto } from "./condicoes.js";

let _modalDanoCuraIds  = [];
let _modalDanoCuraTipo = null;
let _acertoAtacanteId  = null;

/* ==========================================================================
   DANO EM ÁREA
   ========================================================================== */
function abrirModalArea() {
  if (estado.listaDeIniciativa.length === 0) {
    alert("Não há combatentes no combate!");
    return;
  }

  // Reseta campos
  $("area-nome-habilidade").value = "";
  $("area-qtd").value          = "1";
  $("area-tipo").value         = "8";
  $("area-modificador").value  = "0";
  $("area-valor-manual").value = "";
  $("area-resultado").textContent  = "—";
  $("area-resultado").className    = "modal-dano-valor modal-dano-valor--dano";
  $("area-formula").textContent    = "";

  renderizarAlvosArea();
  $("modal-area").classList.remove("oculto");
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

  const nomeHabilidade = $("area-nome-habilidade").value.trim();
  const rotulo = nomeHabilidade || "Dano em área";
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

  // Curador — pré-seleciona o ativo do turno, mas pode ser trocado
  const sel   = $("cura-area-curador");
  sel.innerHTML = "";
  const ativo = estado.listaDeIniciativa[estado.turnoAtivo];
  estado.listaDeIniciativa.filter(c => !c.morto).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nome;
    if (ativo && c.id === ativo.id) opt.selected = true;
    sel.appendChild(opt);
  });

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

  const sel       = $("cura-area-curador");
  const curadorId = sel ? sel.value : null;
  const curador   = curadorId ? estado.listaDeIniciativa.find(c => c.id == curadorId) : null;

  const nomes = [];
  selecionados.forEach(c => {
    const antes = c.hpAtual;
    c.hpAtual = Math.min(c.hpMax, c.hpAtual + valor);
    nomes.push(`${c.nome} (${antes}→${c.hpAtual})`);
    if (c.nocauteado && c.hpAtual > 0) {
      c.nocauteado = false;
      adicionarHistorico(`💪 ${c.nome} se recuperou do nocaute!`, "sucesso");
    }
  });

  const prefixo = curador ? `${curador.nome} curou` : "Cura em área";
  adicionarHistorico(`💚 ${prefixo} (${valor}): ${nomes.join(", ")}`, "sucesso");

  fecharModalCuraArea();
  salvarESincronizar();
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
  fecharModalAcerto();
  abrirModalDanoCura(idsAlvos, "dano", atacanteId);
}

/* ==========================================================================
   MODAL DE DANO / CURA
   ========================================================================== */
export function abrirModalDanoCura(ids, tipo, atacantePreId = null) {
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
  $("btn-confirmar-dano").textContent   = isDano ? "⚔️ Aplicar Dano" : "💊 Aplicar Cura";
  $("btn-confirmar-dano").className     = isDano ? "btn-confirmar btn-confirmar-dano" : "btn-confirmar btn-confirmar-cura";

  const tituloEl  = $("modal-dano-titulo");
  const hpAtualEl = $("modal-dano-hp-atual");
  const alvosWrap = $("modal-dano-alvos-wrap");

  if (isDano) {
    tituloEl.textContent    = "⚔️ Dano";
    hpAtualEl.style.display = "none";
    alvosWrap.style.display = "block";
    // Alvo(s) já escolhidos na etapa de acerto vêm pré-selecionados; pode-se ajustar aqui
    renderizarListaAlvos("modal-dano-alvos-lista", { preSelecionados: idsArr, mostrarCA: true });
  } else {
    const criatura = estado.listaDeIniciativa.find(c => c.id === idsArr[0]);
    tituloEl.textContent    = `💊 Cura — ${criatura.nome}`;
    hpAtualEl.textContent   = `HP atual: ${criatura.hpAtual} / ${criatura.hpMax}`;
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
    const criatura = estado.listaDeIniciativa.find(c => c.id === idsArr[0]);
    btnMortoModal.style.display = "block";
    btnMortoModal.textContent   = criatura.morto ? "💚 Reviver" : "☠️ Marcar como Morto";
    btnMortoModal.className     = criatura.morto ? "btn-morto-modal btn-morto-modal--reviver" : "btn-morto-modal";
  }

  const aviso = $("modal-dano-aviso");
  if (aviso) aviso.style.display = isDano ? "none" : "block";

  $("modal-dano-cura").classList.remove("oculto");
  $("modal-dano-modificador").focus();
}

function fecharModalDanoCura() {
  $("modal-dano-cura").classList.add("oculto");
  _modalDanoCuraIds  = [];
  _modalDanoCuraTipo = null;
}

function alvosSelecionadosDano() {
  return [...document.querySelectorAll("#modal-dano-alvos-lista .area-alvo-cb:checked")]
    .map(cb => estado.listaDeIniciativa.find(c => c.id == cb.value))
    .filter(Boolean);
}

function atualizarPrevia() {
  const valor  = parseInt($("modal-dano-manual").value);
  const previa = $("modal-dano-previa");
  if (isNaN(valor) || valor < 0) { previa.style.display = "none"; return; }

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

  const display = $("modal-dano-resultado");
  display.textContent = total;
  display.className   = "modal-dano-valor " + (_modalDanoCuraTipo === "dano" ? "modal-dano-valor--dano" : "modal-dano-valor--cura");

  const sinal = modificador >= 0 ? "+" : "";
  $("modal-dano-formula-txt").textContent = `(${quantidade}d${lados}: [${rolagens.join(", ")}] ${sinal}${modificador})`;
  $("modal-dano-manual").value = total;
  atualizarPrevia();
}

function confirmarDanoCura() {
  const valor = parseInt($("modal-dano-manual").value);
  if (isNaN(valor) || valor < 0) { $("modal-dano-manual").focus(); return; }

  const isDano = _modalDanoCuraTipo === "dano";

  if (isDano) {
    const alvos = alvosSelecionadosDano();
    if (alvos.length === 0) return;

    const sel         = $("modal-dano-atacante");
    const atacanteId  = sel ? sel.value : null;
    const atacante    = atacanteId ? estado.listaDeIniciativa.find(c => c.id == atacanteId) : null;
    const nomeAtacante = atacante ? atacante.nome : null;

    alvos.forEach(criatura => {
      const hpAntes = criatura.hpAtual;
      criatura.hpAtual = Math.max(0, criatura.hpAtual - valor);

      const logTxt = nomeAtacante
        ? `⚔️ ${nomeAtacante} causou ${valor} de dano em ${criatura.nome}! (${hpAntes} → ${criatura.hpAtual} HP)`
        : `⚔️ ${criatura.nome} recebeu ${valor} de dano (${hpAntes} → ${criatura.hpAtual} HP)`;
      adicionarHistorico(logTxt, "falha");
      if (criatura.hpAtual === 0 && !criatura.morto) processarHPZero(criatura);
    });
  } else {
    const criatura = estado.listaDeIniciativa.find(c => c.id === _modalDanoCuraIds[0]);
    if (!criatura) return;

    const hpAntes = criatura.hpAtual;
    criatura.hpAtual = Math.min(criatura.hpMax, criatura.hpAtual + valor);
    adicionarHistorico(`💊 ${criatura.nome} recuperou ${valor} de HP (${hpAntes} → ${criatura.hpAtual} HP)`, "sucesso");
    // Se estava nocauteado e recuperou HP, remove nocaute
    if (criatura.nocauteado && criatura.hpAtual > 0) {
      criatura.nocauteado = false;
      adicionarHistorico(`💪 ${criatura.nome} se recuperou do nocaute!`, "sucesso");
    }
  }

  fecharModalDanoCura();
  salvarESincronizar();
}

function mortoViaModal() {
  const id = _modalDanoCuraIds[0];
  fecharModalDanoCura();
  marcarMorto(id);
}

/** Liga os modais de acerto, dano/cura e dano/cura em área. Chamado no boot pelo main. */
export function initDano() {
  $("fechar-dano-cura").addEventListener("click", fecharModalDanoCura);
  $("btn-confirmar-dano").addEventListener("click", confirmarDanoCura);
  $("btn-morto-modal").addEventListener("click", mortoViaModal);
  $("btn-rolar-dano-modal").addEventListener("click", rolarDadoModal);
  $("modal-dano-manual").addEventListener("input", atualizarPrevia);
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
