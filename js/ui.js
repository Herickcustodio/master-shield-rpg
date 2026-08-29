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

/** true se o valor é uma foto enviada pelo usuário (data URL), não um id de preset */
export const ehFoto = (v) => typeof v === "string" && v.startsWith("data:");

/** Lê um arquivo de imagem, reduz para no máx. `max`px de lado e devolve uma data URL leve */
export function redimensionarImagem(file, max = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("não foi possível ler o arquivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("o arquivo não é uma imagem válida"));
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width  * escala));
        const h = Math.max(1, Math.round(img.height * escala));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        let out = canvas.toDataURL("image/webp", 0.82);
        if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", 0.85);
        resolve(out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
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
    const foto = ehFoto(imagemBase);
    const img = document.createElement("img");
    img.className = foto ? "avatar-img avatar-img--foto" : "avatar-img";
    img.src = foto ? imagemBase : `img/herois/${imagemBase}_white.png`;
    img.alt = nome || "";
    elemento.appendChild(img);
  } else {
    elemento.textContent = (nome || "?").trim().charAt(0).toUpperCase() || "?";
  }
}

/** Resolve a imagem de um combatente da iniciativa (herói ou monstro customizado) */
export function obterImagemCriatura(criatura) {
  if (criatura.idHeroi) {
    const h = estado.partyHerois.find(h => h.id === criatura.idHeroi);
    return h?.imagem || null;
  }
  if (criatura.idMonstroCustom) {
    const mc = estado.monstrosCustom.find(m => m.id === criatura.idMonstroCustom);
    return mc?.imagem || null;
  }
  return null;
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
