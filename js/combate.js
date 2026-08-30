/* ==========================================================================
   COMBATE — coletânea de monstros, monstros customizados, lançamento de
   iniciativa (herói e monstro) e a renderização do painel de iniciativa.
   ========================================================================== */
import { $ } from "./dom.js";
import { CHAVES } from "./storage.js";
import { estado } from "./state.js";
import { CORES_HEROI, CONDICOES } from "./constantes.js";
import { coletaneaMonstros } from "./monstros.js";
import { adicionarHistorico } from "./historico.js";
import { salvarESincronizar } from "./sync.js";
import {
  calcularCorHP, preencherAvatar, obterImagemCriatura, obterCACriatura, redimensionarImagem,
} from "./ui.js";
import { alternarMortoNocaute } from "./turno.js";

// Contexto completo do modal de iniciativa (herói ou monstro)
let _contextoIniciativa = null;

// Imagem escolhida no modal de "Criar Monstro" (data URL ou null)
let _monstroImagemSel = null;

/* ==========================================================================
   MONSTRO CUSTOMIZADO + COLETÂNEA
   ========================================================================== */
function abrirModalMonstro() {
  $("monstro-nome").value = "";
  $("monstro-hp").value   = "10";
  $("monstro-nd").value   = "";
  _monstroImagemSel = null;
  atualizarPreviewImagemMonstro();
  $("modal-monstro").classList.remove("oculto");
  $("monstro-nome").focus();
}

/** Prévia da imagem no modal de Criar Monstro (sempre uma foto enviada pelo usuário) */
function atualizarPreviewImagemMonstro() {
  const preview = $("monstro-imagem-preview");
  if (!preview) return;
  preview.innerHTML = "";
  if (_monstroImagemSel) {
    const img = document.createElement("img");
    img.className = "foto";
    img.alt = "";
    img.src = _monstroImagemSel;
    preview.appendChild(img);
  } else {
    preview.textContent = "✕";
  }
}

function abrirModalMonstrosLista() {
  const modal = $("modal-monstros-lista");
  const busca = $("busca-monstros");
  if (modal) modal.classList.remove("oculto");
  if (busca) {
    renderizarColetanea(busca.value || "");
    setTimeout(() => busca.focus(), 0);
  }
}

function fecharModalMonstrosLista() {
  const modal = $("modal-monstros-lista");
  if (modal) modal.classList.add("oculto");
}

function fecharModalMonstro() {
  $("modal-monstro").classList.add("oculto");
}

function confirmarNovoMonstro() {
  const nome = $("monstro-nome").value.trim();
  if (!nome) { $("monstro-nome").focus(); return; }

  const novoMonstro = {
    id:      "mc_" + Date.now(),
    nome,
    vidaMax: parseInt($("monstro-hp").value) || 10,
    ca:      $("monstro-nd").value.trim() || "?",
    imagem:  _monstroImagemSel || "",
    custom:  true
  };

  estado.monstrosCustom.push(novoMonstro);
  localStorage.setItem(CHAVES.monstrosCustom, JSON.stringify(estado.monstrosCustom));
  fecharModalMonstro();

  const inputBusca = $("busca-monstros");
  renderizarColetanea(inputBusca ? inputBusca.value : "");
}

function deletarMonstroCustom(id) {
  if (!confirm("Deseja remover este monstro da coletânea?")) return;
  estado.monstrosCustom = estado.monstrosCustom.filter(m => m.id !== id);
  localStorage.setItem(CHAVES.monstrosCustom, JSON.stringify(estado.monstrosCustom));

  const inputBusca = $("busca-monstros");
  renderizarColetanea(inputBusca ? inputBusca.value : "");
}

/* ==========================================================================
   MODAL DE INICIATIVA
   ========================================================================== */
function adicionarIniciativaDeMonstro(monstro) {
  // Monta o nome já com a letra (A, B, C…) antes de abrir o modal
  const quantidadeExistente = estado.listaDeIniciativa.filter(c => c.nomeBase === monstro.nome).length;
  const letra = String.fromCharCode(65 + quantidadeExistente);
  const nomeCompleto = `${monstro.nome} ${letra}`;

  _contextoIniciativa = {
    tipo:        "monstro",
    monstro,
    nomeCompleto
  };

  abrirModalIniciativa(`Combate — ${nomeCompleto}`);
}

export function lancarIniciativaHeroi(idHeroi) {
  const heroiBase = estado.partyHerois.find(h => h.id === idHeroi);
  if (!heroiBase) return;

  _contextoIniciativa = {
    tipo:   "heroi",
    idHeroi
  };

  abrirModalIniciativa(`Combate — ${heroiBase.nome}`);
}

function abrirModalIniciativa(titulo) {
  $("modal-iniciativa-titulo").textContent = titulo;
  $("ini-modificador").value = "0";
  $("ini-valor-manual").value = "";
  $("ini-resultado-display").classList.add("oculto");

  const valorDisplay = $("ini-dado-valor");
  valorDisplay.textContent = "—";
  valorDisplay.className   = "ini-dado-valor";

  $("modal-iniciativa").classList.remove("oculto");
  $("ini-modificador").focus();
}

function fecharModalIniciativa() {
  $("modal-iniciativa").classList.add("oculto");
  _contextoIniciativa = null;
}

function rolarIniciativaModal() {
  const modificador    = parseInt($("ini-modificador").value) || 0;
  const dado           = Math.floor(Math.random() * 20) + 1;
  const total          = dado + modificador;
  const valorDisplay   = $("ini-dado-valor");
  const formulaDisplay = $("ini-formula");

  valorDisplay.textContent = total;
  valorDisplay.className   = "ini-dado-valor";
  if (dado === 20) valorDisplay.classList.add("critico");
  if (dado === 1)  valorDisplay.classList.add("falha");

  const sinal = modificador >= 0 ? "+" : "";
  formulaDisplay.textContent = `(d20: ${dado} ${sinal}${modificador})`;
  $("ini-resultado-display").classList.remove("oculto");
  $("ini-valor-manual").value = total;
}

function confirmarIniciativaModal() {
  const valor = parseInt($("ini-valor-manual").value);
  if (isNaN(valor)) { $("ini-valor-manual").focus(); return; }

  const ctx = _contextoIniciativa;
  if (!ctx) return;

  if (ctx.tipo === "heroi") {
    const heroiBase = estado.partyHerois.find(h => h.id === ctx.idHeroi);
    if (!heroiBase) return;

    const entradaAnterior = estado.listaDeIniciativa.find(c => c.idHeroi === ctx.idHeroi);
    const condicoes = entradaAnterior ? entradaAnterior.condicoes : [];
    const jaEstava  = !!entradaAnterior;

    estado.listaDeIniciativa = estado.listaDeIniciativa.filter(c => c.idHeroi !== ctx.idHeroi);
    estado.listaDeIniciativa.push({
      id:       Date.now(),
      idHeroi:  ctx.idHeroi,
      nome:     heroiBase.nome,
      valor,
      hpAtual:  heroiBase.hpMax,
      hpMax:    heroiBase.hpMax,
      condicoes
    });

    const caTxt = heroiBase.ca ? ` | CA: ${heroiBase.ca}` : "";
    if (jaEstava) adicionarHistorico(`🔄 ${heroiBase.nome} atualizou iniciativa para ${valor}`);
    else          adicionarHistorico(`🦸 ${heroiBase.nome} entrou no combate! (Ini: ${valor} | HP: ${heroiBase.hpMax}${caTxt})`);

  } else if (ctx.tipo === "monstro") {
    const entradaMonstro = {
      id:        Date.now(),
      nomeBase:  ctx.monstro.nome,
      nome:      ctx.nomeCompleto,
      valor,
      hpAtual:   ctx.monstro.vidaMax,
      hpMax:     ctx.monstro.vidaMax,
      condicoes: []
    };
    if (ctx.monstro.custom && ctx.monstro.id) {
      entradaMonstro.idMonstroCustom = ctx.monstro.id;
    }
    estado.listaDeIniciativa.push(entradaMonstro);

    const caTxt = ctx.monstro.ca ? ` | CA: ${ctx.monstro.ca}` : "";
    adicionarHistorico(`⚔️ ${ctx.nomeCompleto} entrou no combate! (Ini: ${valor} | HP: ${ctx.monstro.vidaMax}${caTxt})`);
  }

  fecharModalIniciativa();
  salvarESincronizar();
}

export function limparIniciativa() {
  if (!confirm("Deseja realmente limpar todo o combate?")) return;
  estado.listaDeIniciativa  = [];
  estado.turnoAtivo         = 0;
  estado.turnoAtual         = 1;
  estado.efeitosTemporarios = [];
  adicionarHistorico("🏳️ Combate encerrado!");
  salvarESincronizar();
}

/* ==========================================================================
   RENDERIZAÇÃO — PAINEL DE INICIATIVA
   ========================================================================== */
export function atualizarIniciativa() {
  estado.listaDeIniciativa.sort((a, b) => b.valor - a.valor);
  const container = $("lista-iniciativa-conteudo");
  if (!container) return;
  container.innerHTML = "";

  // Garante que estado.turnoAtivo não aponte para fora dos limites
  if (estado.listaDeIniciativa.length > 0 && estado.turnoAtivo >= estado.listaDeIniciativa.length) estado.turnoAtivo = 0;

  estado.listaDeIniciativa.forEach((personagem, index) => {
    const ativo      = index === estado.turnoAtivo && estado.listaDeIniciativa.length > 0;
    const condicoes  = personagem.condicoes || [];
    const pctHP      = personagem.hpMax > 0 ? (personagem.hpAtual / personagem.hpMax) * 100 : 0;
    const corHP      = calcularCorHP(personagem.hpAtual, personagem.hpMax);

    const item = document.createElement("div");
    item.className = "item-iniciativa"
      + (ativo                                        ? " item-iniciativa--ativo"      : "")
      + (personagem.morto                             ? " item-iniciativa--morto"      : "")
      + (personagem.nocauteado && !personagem.morto   ? " item-iniciativa--nocauteado" : "")
      + (!personagem.idHeroi                          ? " item-iniciativa--monstro"    : "");

    // Cor do herói na borda esquerda (e fundo suave quando ativo)
    let corHeroiHex = null;
    if (personagem.idHeroi) {
      const h   = estado.partyHerois.find(h => h.id === personagem.idHeroi);
      const cor = h?.cor ? CORES_HEROI.find(c => c.id === h.cor) : null;
      if (cor) {
        corHeroiHex = cor.hex;
        item.style.borderLeft = `4px solid ${cor.hex}`;
        if (ativo && !personagem.morto) {
          item.style.background = `${cor.hex}22`; // 22 = ~13% opacidade
          item.style.boxShadow  = `0 0 0 1px ${cor.hex}88`;
        }
      }
    }

    // Fundo vermelho quando morto
    if (personagem.morto) {
      item.style.background    = "#2a0a0a";
      item.style.borderLeft    = "4px solid #c0392b";
      item.style.boxShadow     = "0 0 0 1px #8b1a1a";
    }

    const caValor = obterCACriatura(personagem);

    const topo = document.createElement("div");
    topo.className = "item-ini-topo";

    const iniciativaTag = document.createElement("span");
    iniciativaTag.className = "item-ini-iniciativa";
    iniciativaTag.textContent = personagem.valor;

    topo.appendChild(iniciativaTag);

    const corpo = document.createElement("div");
    corpo.className = "item-ini-corpo";

    const avatar = document.createElement("div");
    avatar.className = "item-ini-avatar";
    preencherAvatar(avatar, personagem.nome, obterImagemCriatura(personagem));

    const dados = document.createElement("div");
    dados.className = "item-ini-dados";

    const nomeLinha = document.createElement("div");
    nomeLinha.className = "item-ini-nome-linha";

    const nome = document.createElement("div");
    nome.className = "item-iniciativa-nome";
    nome.textContent = (personagem.morto ? "☠️ " : "")
      + (personagem.nocauteado && !personagem.morto ? "😵 " : "")
      + personagem.nome;
    if (corHeroiHex && !personagem.morto && !personagem.nocauteado) nome.style.color = corHeroiHex;

    const estaCaidoCombate = personagem.morto || personagem.nocauteado;
    const btnMortoCombate = document.createElement("button");
    btnMortoCombate.type = "button";
    btnMortoCombate.className = "btn-turno-morto-icone btn-morto-item-ini";
    btnMortoCombate.title = estaCaidoCombate ? "Reviver" : "Marcar como Morto ou Nocautear";
    btnMortoCombate.textContent = estaCaidoCombate ? "💚" : "☠️";
    btnMortoCombate.addEventListener("click", (e) => {
      e.stopPropagation();
      alternarMortoNocaute(personagem.id);
    });

    nomeLinha.appendChild(nome);

    const caLinha = document.createElement("div");
    caLinha.className = "item-ini-info item-ini-ca-linha";
    const caTexto = document.createElement("span");
    caTexto.textContent = `CA ${caValor ?? "?"}`;
    caLinha.appendChild(caTexto);
    caLinha.appendChild(btnMortoCombate);

    const vidaLinha = document.createElement("div");
    vidaLinha.className = "item-ini-vida-row";
    const vidaLabel = document.createElement("span");
    vidaLabel.className = "item-ini-vida-label";
    vidaLabel.textContent = "❤️";
    const vidaValor = document.createElement("span");
    vidaValor.className = "item-ini-vida-valor";
    vidaValor.textContent = `${personagem.hpAtual}/${personagem.hpMax}`;
    vidaLinha.appendChild(vidaLabel);
    vidaLinha.appendChild(vidaValor);

    const barraWrap = document.createElement("div");
    barraWrap.className = "barra-hp-wrap barra-hp-wrap--mini";
    const barraFill = document.createElement("div");
    barraFill.className = "barra-hp-fill";
    barraFill.style.width = `${Math.max(0, Math.min(100, pctHP))}%`;
    barraFill.style.background = corHP;
    barraWrap.appendChild(barraFill);

    dados.appendChild(nomeLinha);
    dados.appendChild(caLinha);
    dados.appendChild(vidaLinha);
    dados.appendChild(barraWrap);

    corpo.appendChild(avatar);
    corpo.appendChild(dados);

    // Card resumido: só o ícone de cada condição (nome completo no title), com
    // um "+N" para o excedente — evita a barra de rolagem quando há muitas condições
    const MAX_CONDICOES_VISIVEIS = 4;
    const condTags = document.createElement("div");
    condTags.className = "item-ini-condicoes";
    const condsValidas = condicoes
      .map(condObj => CONDICOES.find(c => c.id === condObj.id))
      .filter(Boolean);

    condsValidas.slice(0, MAX_CONDICOES_VISIVEIS).forEach(cond => {
      const tag = document.createElement("span");
      tag.className = "item-ini-cond-tag item-ini-cond-tag--icone";
      tag.textContent = cond.emoji;
      tag.title = cond.label;
      condTags.appendChild(tag);
    });

    const condsRestantes = condsValidas.slice(MAX_CONDICOES_VISIVEIS);
    if (condsRestantes.length > 0) {
      const mais = document.createElement("span");
      mais.className = "item-ini-cond-tag item-ini-cond-tag--mais";
      mais.textContent = `+${condsRestantes.length}`;
      mais.title = condsRestantes.map(c => c.label).join(", ");
      condTags.appendChild(mais);
    }

    item.appendChild(topo);
    item.appendChild(corpo);
    if (condicoes.length > 0) item.appendChild(condTags);

    if (ativo) {
      const atualBadge = document.createElement("span");
      atualBadge.className = "item-ini-atual-badge";
      atualBadge.textContent = "ATUAL";
      item.appendChild(atualBadge);
    }

    if (index > 0) {
      const seta = document.createElement("span");
      seta.className = "seta-iniciativa";
      seta.textContent = "❯";
      container.appendChild(seta);
    }

    container.appendChild(item);
  });

  // Rola o painel até o combatente ativo ficar visível
  const itemAtivo = container.querySelector(".item-iniciativa--ativo");
  if (itemAtivo) {
    itemAtivo.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  renderizarOrdemIniciativa();
}

/** Faixa "Ordem da Iniciativa": um chip por combatente, clicável para pular o turno até ele */
function renderizarOrdemIniciativa() {
  const lista = $("ordem-iniciativa-lista");
  if (!lista) return;
  lista.innerHTML = "";

  estado.listaDeIniciativa.forEach((personagem, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "ordem-iniciativa-chip" + (index === estado.turnoAtivo ? " ordem-iniciativa-chip--ativa" : "");
    chip.textContent = personagem.valor;
    chip.title = personagem.nome;
    chip.addEventListener("click", () => {
      estado.turnoAtivo = index;
      salvarESincronizar();
    });
    lista.appendChild(chip);
  });
}

/* ==========================================================================
   RENDERIZAÇÃO — COLETÂNEA DE MONSTROS
   ========================================================================== */
export function renderizarColetanea(filtro = "") {
  const container = $("conteudo-monstros");
  if (!container) return;
  container.innerHTML = "";

  const termo = filtro.toLowerCase().trim();

  const listaCompleta = [
    ...estado.monstrosCustom,
    ...[...coletaneaMonstros].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  ];

  const lista = termo
    ? listaCompleta.filter(m => m.nome.toLowerCase().includes(termo))
    : listaCompleta;

  lista.forEach(monstro => {
    const item = document.createElement("div");
    item.className = "item-monstro" + (monstro.custom ? " item-monstro-custom" : "");

    // ── Linha de cima: miniatura (opcional) + info
    const topo = document.createElement("div");
    topo.className = "item-monstro-topo";

    // custom → imagem enviada pelo usuário · coletânea → icone fixo (img/monstros/)
    const imgMonstro = monstro.imagem || monstro.icone;
    if (imgMonstro) {
      const av = document.createElement("div");
      av.className = "item-monstro-avatar";
      preencherAvatar(av, monstro.nome, imgMonstro);
      topo.appendChild(av);
    }

    // ── Info: nome + stats em badges
    const info = document.createElement("div");
    info.className = "item-monstro-info";

    const nomeLinha = document.createElement("div");
    nomeLinha.className = "item-monstro-nome";
    nomeLinha.textContent = monstro.nome;
    if (monstro.custom) {
      const badge = document.createElement("span");
      badge.className   = "badge-custom";
      badge.textContent = "custom";
      nomeLinha.appendChild(badge);
    }

    const stats = document.createElement("div");
    stats.className = "item-monstro-stats";
    stats.innerHTML = `
      <span class="item-monstro-stat">
        <span class="item-monstro-stat-label">HP</span>
        <span class="item-monstro-stat-valor">${monstro.vidaMax}</span>
      </span>
      <span class="item-monstro-stat">
        <span class="item-monstro-stat-label">CA</span>
        <span class="item-monstro-stat-valor">${monstro.ca ?? monstro.nd ?? "?"}</span>
      </span>
    `;

    info.appendChild(nomeLinha);
    info.appendChild(stats);
    topo.appendChild(info);

    // ── Ações: adicionar + deletar (custom)
    const acoes = document.createElement("div");
    acoes.className = "item-monstro-acoes";

    const btnAdd = document.createElement("button");
    btnAdd.textContent = "+ Adicionar";
    btnAdd.className   = "btn-add-monstro";
    btnAdd.addEventListener("click", () => adicionarIniciativaDeMonstro(monstro));
    acoes.appendChild(btnAdd);

    if (monstro.custom) {
      const btnDel = document.createElement("button");
      btnDel.textContent = "✕";
      btnDel.className   = "btn-deletar-monstro";
      btnDel.title       = "Remover da coletânea";
      btnDel.addEventListener("click", () => deletarMonstroCustom(monstro.id));
      acoes.appendChild(btnDel);
    }

    item.appendChild(topo);
    item.appendChild(acoes);
    container.appendChild(item);
  });
}

/** Liga a coletânea de monstros e o modal de iniciativa. Chamado no boot pelo main. */
export function initCombate() {
  const inputBusca = $("busca-monstros");
  if (inputBusca) inputBusca.addEventListener("input", () => renderizarColetanea(inputBusca.value));

  $("btn-abrir-monstros").addEventListener("click", abrirModalMonstrosLista);
  $("fechar-monstros-lista").addEventListener("click", fecharModalMonstrosLista);
  window.addEventListener("click", (e) => {
    const modal = $("modal-monstros-lista");
    if (e.target === modal) fecharModalMonstrosLista();
  });

  $("btn-novo-monstro").addEventListener("click", abrirModalMonstro);
  $("fechar-monstro").addEventListener("click", fecharModalMonstro);
  $("btn-confirmar-monstro").addEventListener("click", confirmarNovoMonstro);
  window.addEventListener("click", (e) => { if (e.target === $("modal-monstro")) fecharModalMonstro(); });
  $("modal-monstro").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoMonstro(); });

  $("btn-escolher-imagem-monstro").addEventListener("click", () => $("monstro-imagem-arquivo").click());
  $("monstro-imagem-arquivo").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo depois
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Selecione um arquivo de imagem."); return; }
    try {
      _monstroImagemSel = await redimensionarImagem(file);
      atualizarPreviewImagemMonstro();
    } catch (err) {
      alert("Não foi possível carregar a imagem: " + err.message);
    }
  });

  $("fechar-iniciativa").addEventListener("click", fecharModalIniciativa);
  $("btn-rolar-ini").addEventListener("click", rolarIniciativaModal);
  $("btn-confirmar-ini").addEventListener("click", confirmarIniciativaModal);
  window.addEventListener("click", (e) => { if (e.target === $("modal-iniciativa")) fecharModalIniciativa(); });
  $("modal-iniciativa").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarIniciativaModal(); });

  $("btn-encerrar-combate").addEventListener("click", limparIniciativa);
}
