/* ==========================================================================
   DADOS — rolador principal, ações rápidas, modal de evento e últimas rolagens
   ========================================================================== */
import { $, horaAgora } from "./dom.js";
import { CHAVES } from "./storage.js";
import { estado } from "./state.js";
import { adicionarHistorico } from "./historico.js";

export function selecionarDado(lados) {
  estado.dadoSelecionado = lados;
  document.querySelectorAll(".botoes-dados button").forEach(b => {
    b.classList.toggle("selecionado", Number(b.dataset.dado) === lados);
  });
}

function rolarDadoSelecionado() {
  rolarDado(estado.dadoSelecionado);
}

function rolarAcaoRapida(nomeAcao, emoji, modificador, tipoHistorico) {
  const rolagem = Math.floor(Math.random() * 20) + 1;
  const total   = rolagem + modificador;
  document.querySelector("#resultado-dado .valor").textContent = total;

  const formulaCurta = `1d20${modificador ? (modificador > 0 ? " + " + modificador : " - " + Math.abs(modificador)) : ""}`;
  registrarUltimaRolagem(formulaCurta, total, nomeAcao);

  const textoBase = `1d20: [${rolagem}] + ${modificador} = ${total}`;
  if (rolagem === 20) adicionarHistorico(`${emoji} ${nomeAcao}: SUCESSO CRÍTICO! ${textoBase}`, "sucesso");
  else if (rolagem === 1) adicionarHistorico(`${emoji} ${nomeAcao}: FALHA CRÍTICA! ${textoBase}`, "falha");
  else adicionarHistorico(`${emoji} ${nomeAcao}: ${textoBase}`, tipoHistorico);
}

/* ==========================================================================
   MODAL MODIFICADOR DE AÇÃO RÁPIDA
   ========================================================================== */
let _acaoRapidaCtx = null; // { nomeAcao, emoji, tipoHistorico }

function abrirModalAcaoRapida(nomeAcao, emoji, tipoHistorico) {
  _acaoRapidaCtx = { nomeAcao, emoji, tipoHistorico };
  $("modal-acao-rapida-titulo").textContent = `${emoji} ${nomeAcao}`;
  $("acao-rapida-modificador").value = "0";
  $("modal-acao-rapida").classList.remove("oculto");
  $("acao-rapida-modificador").focus();
  $("acao-rapida-modificador").select();
}

function fecharModalAcaoRapida() {
  $("modal-acao-rapida").classList.add("oculto");
  _acaoRapidaCtx = null;
}

function confirmarAcaoRapida() {
  if (!_acaoRapidaCtx) return;
  const { nomeAcao, emoji, tipoHistorico } = _acaoRapidaCtx;
  const modificador = parseInt($("acao-rapida-modificador").value) || 0;
  rolarAcaoRapida(nomeAcao, emoji, modificador, tipoHistorico);
  fecharModalAcaoRapida();
}

function abrirModalEvento() {
  const sel = $("evento-personagem");
  sel.innerHTML = "";

  const nomes = new Set();
  estado.partyHerois.forEach(h => nomes.add(h.nome));
  estado.listaDeIniciativa.forEach(c => nomes.add(c.nome));

  if (nomes.size === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Nenhum personagem disponível";
    sel.appendChild(opt);
  } else {
    [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR")).forEach(nome => {
      const opt = document.createElement("option");
      opt.value = nome;
      opt.textContent = nome;
      sel.appendChild(opt);
    });
  }

  $("evento-acao").value = "";
  $("evento-qtd").value = "1";
  $("evento-tipo").value = "20";
  $("evento-modificador").value = "0";

  atualizarPreviaEvento();
  $("modal-evento").classList.remove("oculto");
  $("evento-acao").focus();
}

function fecharModalEvento() {
  $("modal-evento").classList.add("oculto");
}

function atualizarPreviaEvento(resultado = null) {
  const personagem = $("evento-personagem").value || "Alguém";
  const acao       = $("evento-acao").value.trim();
  const previa     = $("evento-previa");

  let html = `<span class="previa-ataque">${personagem}${acao ? " " + acao : ""}</span>`;
  if (resultado !== null) html += `<span class="previa-evento-resultado">${resultado}</span>`;
  previa.innerHTML = html;
}

function rolarEvento() {
  const qtd   = parseInt($("evento-qtd").value)         || 1;
  const lados = parseInt($("evento-tipo").value)        || 20;
  const mod   = parseInt($("evento-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total = soma + mod;

  atualizarPreviaEvento(total);

  const personagem = $("evento-personagem").value || "Alguém";
  const acao       = $("evento-acao").value.trim();
  const sinal      = mod >= 0 ? "+" : "";
  const formula    = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;

  const formulaCurta = `${qtd}d${lados}${mod ? (mod > 0 ? " + " + mod : " - " + Math.abs(mod)) : ""}`;
  registrarUltimaRolagem(formulaCurta, total, `Evento: ${personagem}${acao ? " " + acao : ""}`);

  adicionarHistorico(`📜 ${personagem}${acao ? " " + acao : ""} e rolou ${total} ${formula}`);
}

function rolarDado(lados) {
  const modificador = parseInt($("modificador").value) || 0;
  const quantidade  = parseInt($("quantidade").value)  || 1;
  let somaDados = 0;
  const rolagens = [];

  for (let i = 0; i < quantidade; i++) {
    const rolagem = Math.floor(Math.random() * lados) + 1;
    somaDados += rolagem;
    rolagens.push(rolagem);
  }

  const total     = somaDados + modificador;
  const textoBase = `Rolou ${quantidade}d${lados}: [${rolagens.join(", ")}] + ${modificador} = ${total}`;
  document.querySelector("#resultado-dado .valor").textContent = total;

  const formulaCurta = `${quantidade}d${lados}${modificador ? (modificador > 0 ? " + " + modificador : " - " + Math.abs(modificador)) : ""}`;
  registrarUltimaRolagem(formulaCurta, total);

  if (lados === 20 && quantidade === 1) {
    if (rolagens[0] === 20) adicionarHistorico(`⚔️ SUCESSO CRÍTICO! ${textoBase}`, "sucesso");
    else if (rolagens[0] === 1) adicionarHistorico(`💀 FALHA CRÍTICA! ${textoBase}`, "falha");
    else adicionarHistorico(textoBase);
  } else {
    adicionarHistorico(textoBase);
  }
}

function registrarUltimaRolagem(formula, total, label = "") {
  estado.ultimasRolagens.unshift({ formula, total, hora: horaAgora(), label });
  estado.ultimasRolagens = estado.ultimasRolagens.slice(0, 3);
  localStorage.setItem(CHAVES.ultimasRolagens, JSON.stringify(estado.ultimasRolagens));
  renderizarUltimasRolagens();
}

export function renderizarUltimasRolagens() {
  const lista = $("lista-ultimas-rolagens");
  if (!lista) return;
  lista.innerHTML = "";

  if (estado.ultimasRolagens.length === 0) {
    lista.innerHTML = `<p class="efeitos-vazio">Nenhuma rolagem ainda.</p>`;
    return;
  }

  estado.ultimasRolagens.forEach(r => {
    const item = document.createElement("div");
    item.className = "ultima-rolagem-item";
    item.innerHTML = `
      <span class="ultima-rolagem-formula">${r.label ? `${r.label} (${r.formula})` : r.formula}</span>
      <span class="ultima-rolagem-total">Resultado: ${r.total}</span>
      <span class="ultima-rolagem-hora">${r.hora || ""}</span>
    `;
    lista.appendChild(item);
  });
}

/** Liga os controles de Dados / Ações Rápidas / Evento. Chamado no boot pelo main. */
export function initDados() {
  document.querySelectorAll(".botoes-dados button").forEach(btn => {
    btn.addEventListener("click", () => selecionarDado(Number(btn.dataset.dado)));
  });
  $("btn-rolar-dado").addEventListener("click", rolarDadoSelecionado);
  selecionarDado(estado.dadoSelecionado);
  renderizarUltimasRolagens();

  $("btn-rapido-iniciativa").addEventListener("click", () => abrirModalAcaoRapida("Iniciativa", "🎲", "acao-iniciativa"));
  $("btn-rapido-pericia").addEventListener("click", () => abrirModalAcaoRapida("Teste de Perícia", "🎯", "acao-pericia"));
  $("btn-rapido-resistencia").addEventListener("click", () => abrirModalAcaoRapida("Teste de Resistência", "🛡️", "acao-resistencia"));
  $("fechar-acao-rapida").addEventListener("click", fecharModalAcaoRapida);
  $("btn-confirmar-acao-rapida").addEventListener("click", confirmarAcaoRapida);
  window.addEventListener("click", (e) => { if (e.target === $("modal-acao-rapida")) fecharModalAcaoRapida(); });
  $("modal-acao-rapida").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarAcaoRapida(); });

  $("btn-rapido-evento").addEventListener("click", abrirModalEvento);
  $("fechar-evento").addEventListener("click", fecharModalEvento);
  $("btn-rolar-evento").addEventListener("click", rolarEvento);
  $("evento-personagem").addEventListener("change", () => atualizarPreviaEvento());
  $("evento-acao").addEventListener("input", () => atualizarPreviaEvento());
  window.addEventListener("click", (e) => { if (e.target === $("modal-evento")) fecharModalEvento(); });
}
