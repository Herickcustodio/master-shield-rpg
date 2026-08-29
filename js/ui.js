/* ==========================================================================
   UI — helpers de interface compartilhados entre os painéis
   (modais genéricos, avatares, cor de HP e lista de alvos)
   ========================================================================== */
import { $ } from "./dom.js";
import { estado } from "./state.js";
import { CORES_HEROI } from "./constantes.js";
import { coletaneaMonstros } from "./monstros.js";

/** Liga um botão a um modal simples (abrir / fechar no X / fechar ao clicar fora) */
export function configurarModal(btnId, modalId, fecharId) {
  const botao  = $(btnId);
  const modal  = $(modalId);
  const fechar = $(fecharId);
  botao.addEventListener("click",  () => modal.classList.remove("oculto"));
  fechar.addEventListener("click", () => modal.classList.add("oculto"));
  window.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("oculto"); });
}

/** Cor da barra/indicador de HP conforme a fração de vida restante */
export function calcularCorHP(hpAtual, hpMax) {
  if (hpMax <= 0) return "#888";
  const pct = hpAtual / hpMax;
  if (pct > 0.5)  return "#2ecc71";  // verde
  if (pct > 0.25) return "#f39c12";  // amarelo
  return "#e63946";                   // vermelho
}

/** Preenche um elemento de avatar com a imagem escolhida do herói, ou a inicial do nome como fallback.
 *  `imagemBase` pode ser um id de preset (img/herois/<id>_white.png) ou uma foto do usuário (data URL). */
export function preencherAvatar(elemento, nome, imagemBase) {
  elemento.innerHTML = "";
  if (imagemBase) {
    const foto = imagemBase.startsWith("data:");
    const img = document.createElement("img");
    img.className = foto ? "avatar-img avatar-img--foto" : "avatar-img";
    img.src = foto ? imagemBase : `img/herois/${imagemBase}_white.png`;
    img.alt = nome || "";
    elemento.appendChild(img);
  } else {
    elemento.textContent = (nome || "?").trim().charAt(0).toUpperCase() || "?";
  }
}

/** Resolve a imagem escolhida de um combatente da iniciativa (só heróis têm) */
export function obterImagemCriatura(criatura) {
  if (!criatura.idHeroi) return null;
  const h = estado.partyHerois.find(h => h.id === criatura.idHeroi);
  return h?.imagem || null;
}

/** Resolve a CA de um combatente da iniciativa (herói, monstro custom ou da coletânea) */
export function obterCACriatura(criatura) {
  if (criatura.idHeroi) {
    const h = estado.partyHerois.find(h => h.id === criatura.idHeroi);
    return h?.ca ?? null;
  }
  if (criatura.idMonstroCustom) {
    const mc = estado.monstrosCustom.find(m => m.id === criatura.idMonstroCustom);
    if (mc) return mc.ca ?? null;
  }
  const m = coletaneaMonstros.find(m => m.nome === criatura.nomeBase);
  return m?.ca ?? null;
}

/** Renderiza uma lista de combatentes com checkbox (usada em Área, Acerto e Dano) */
export function renderizarListaAlvos(containerId, { preSelecionados = [], mostrarCA = false } = {}) {
  const lista = $(containerId);
  lista.innerHTML = "";
  const preSet = new Set(preSelecionados.map(String));

  estado.listaDeIniciativa.forEach(c => {
    const row = document.createElement("label");
    row.className = "area-alvo-row" + (c.morto ? " area-alvo-morto" : "");

    const cb = document.createElement("input");
    cb.type    = "checkbox";
    cb.value   = c.id;
    cb.checked = preSet.has(String(c.id));
    cb.className = "area-alvo-cb";

    const corHeroi = (() => {
      if (!c.idHeroi) return null;
      const h   = estado.partyHerois.find(h => h.id === c.idHeroi);
      const cor = h?.cor ? CORES_HEROI.find(x => x.id === h.cor) : null;
      return cor?.hex ?? null;
    })();

    const caValor = mostrarCA ? obterCACriatura(c) : null;

    const info = document.createElement("span");
    info.className = "area-alvo-info";
    if (corHeroi) info.style.borderLeftColor = corHeroi;
    info.innerHTML = `<span class="area-alvo-nome">${c.nome}</span><span class="area-alvo-hp">❤️ ${c.hpAtual}/${c.hpMax}${caValor !== null ? ` · 🛡️ CA ${caValor}` : ""}</span>`;

    row.appendChild(cb);
    row.appendChild(info);
    lista.appendChild(row);
  });
}

export function selecionarTodosAlvos(containerId, selecionar) {
  document.querySelectorAll(`#${containerId} .area-alvo-cb`).forEach(cb => cb.checked = selecionar);
}
