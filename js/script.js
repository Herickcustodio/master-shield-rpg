/* ==========================================================================
   MASTER SHIELD RPG — script principal
   Migração em andamento para módulos ES. Já extraídos:
     js/dom.js        → $, horaAgora
     js/storage.js    → CHAVES, lerLocalStorageJSON, lerLocalStorageNumero
     js/state.js      → estado (estado mutável compartilhado)
     js/constantes.js → CORES_HEROI, IMAGENS_HEROI, CONDICOES
     js/monstros.js   → coletaneaMonstros
     js/historico.js  → adicionarHistorico, renderizarItemHistorico, limparHistorico
     js/dados.js      → rolador de dados, ações rápidas, evento
     js/ui.js         → helpers de interface compartilhados
     js/sync.js       → salvarESincronizar + registro de renderizadores
     js/config.js     → objeto config + modal de Configurações
     js/condicoes.js  → condições dos combatentes + morte/reviver
     js/dano.js       → modais de acerto, dano/cura e dano/cura em área
   ========================================================================== */
import { $ } from "./dom.js";
import { CHAVES, lerLocalStorageJSON } from "./storage.js";
import { estado } from "./state.js";
import { CORES_HEROI, IMAGENS_HEROI, CONDICOES } from "./constantes.js";
import { coletaneaMonstros } from "./monstros.js";
import { adicionarHistorico, renderizarItemHistorico, limparHistorico } from "./historico.js";
import { initDados } from "./dados.js";
import {
  configurarModal, calcularCorHP, preencherAvatar, obterImagemCriatura, obterCACriatura,
} from "./ui.js";
import { aoSincronizar, salvarESincronizar } from "./sync.js";
import { config, aplicarConfig, initConfig } from "./config.js";
import {
  decrementarCondicoes, toggleCondicao, aoFecharModalCondicao, initCondicoes,
} from "./condicoes.js";
import { abrirModalAcerto, abrirModalDanoCura, initDano } from "./dano.js";

let _corSelecionada = null;
let _imagemSelecionada = null;

/** Preenche o quadradinho de pré-visualização no modal de Novo/Editar Herói */
function atualizarPreviewImagemHeroi() {
  const preview = $("heroi-imagem-preview");
  if (!preview) return;
  if (_imagemSelecionada) {
    preview.innerHTML = `<img src="img/herois/${_imagemSelecionada}_white.png" alt="">`;
  } else {
    preview.innerHTML = "";
    preview.textContent = "✕";
  }
}

function abrirModalEscolherImagem() {
  renderizarSeletorImagens();
  $("modal-escolher-imagem").classList.remove("oculto");
}

function fecharModalEscolherImagem() {
  $("modal-escolher-imagem").classList.add("oculto");
}

function renderizarSeletorImagens() {
  const container = $("heroi-imagens");
  if (!container) return;
  container.innerHTML = "";

  const btnNenhuma = document.createElement("button");
  btnNenhuma.type      = "button";
  btnNenhuma.title     = "Sem imagem (usa a inicial do nome)";
  btnNenhuma.className = "imagem-heroi-btn imagem-heroi-btn--nenhuma"
    + (!_imagemSelecionada ? " imagem-heroi-btn--selecionada" : "");
  btnNenhuma.textContent = "✕";
  btnNenhuma.addEventListener("click", () => {
    _imagemSelecionada = null;
    atualizarPreviewImagemHeroi();
    fecharModalEscolherImagem();
  });
  container.appendChild(btnNenhuma);

  IMAGENS_HEROI.forEach(img => {
    const btn = document.createElement("button");
    btn.type      = "button";
    btn.title     = img.label;
    btn.className = "imagem-heroi-btn"
      + (_imagemSelecionada === img.id ? " imagem-heroi-btn--selecionada" : "");
    btn.innerHTML = `<img src="img/herois/${img.id}_white.png" alt="${img.label}">`;
    btn.addEventListener("click", () => {
      _imagemSelecionada = img.id;
      atualizarPreviewImagemHeroi();
      fecharModalEscolherImagem();
    });
    container.appendChild(btn);
  });
}

function renderizarSeletorCores(idEdicao = null) {
  const container = $("heroi-cores");
  if (!container) return;
  container.innerHTML = "";

  // Bloqueia cores de outros heróis (não do que está sendo editado)
  const coresUsadas = estado.partyHerois
    .filter(h => h.id !== idEdicao)
    .map(h => h.cor).filter(Boolean);

  CORES_HEROI.forEach(cor => {
    const usada = coresUsadas.includes(cor.id);
    const btn   = document.createElement("button");
    btn.type      = "button";
    btn.title     = usada ? `${cor.label} (em uso)` : cor.label;
    btn.className = "cor-heroi-btn"
      + (usada              ? " cor-heroi-btn--usada"      : "")
      + (_corSelecionada === cor.id ? " cor-heroi-btn--selecionada" : "");
    btn.style.background = cor.hex;
    btn.disabled = usada;
    btn.addEventListener("click", () => {
      _corSelecionada = cor.id;
      renderizarSeletorCores(idEdicao);
    });
    container.appendChild(btn);
  });
}

/* ==========================================================================
   3. MODAL DE NOVO HERÓI
   ========================================================================== */
/** Aplica a EXP acumulada ao nível, subindo de nível (podendo subir mais de um) quando a EXP bate a meta definida pelo mestre */
function aplicarExpENivel(nivelInicial, expInicial, expMeta) {
  let nivel = nivelInicial;
  let exp   = expInicial;
  let subiuNivel = false;
  while (expMeta > 0 && exp >= expMeta) {
    exp -= expMeta;
    nivel++;
    subiuNivel = true;
  }
  return { nivel, exp, subiuNivel };
}

function abrirModalHeroi(idEdicao = null) {
  // Se idEdicao não for uma string (ex: for o objeto de evento de clique), reseta para null
  if (typeof idEdicao !== "string") idEdicao = null;
  const heroi = idEdicao ? estado.partyHerois.find(h => h.id === idEdicao) : null;

  $("modal-heroi-titulo").textContent    = heroi ? "Editar Herói" : "Novo Herói";
  $("btn-confirmar-heroi").textContent   = heroi ? "Salvar Alterações" : "Criar Herói";
  $("heroi-id-edicao").value             = idEdicao || "";
  $("heroi-nome").value   = heroi ? heroi.nome   : "";
  $("heroi-classe").value = heroi ? heroi.classe : "";
  $("heroi-nivel").value  = heroi ? heroi.nivel  : "1";
  $("heroi-hp").value     = heroi ? heroi.hpMax  : "10";
  $("heroi-ca").value     = heroi ? heroi.ca     : "10";
  $("heroi-exp").value      = heroi ? (heroi.exp || 0) : "0";
  $("heroi-exp-meta").value = heroi ? (heroi.expMeta || 1000) : "1000";

  // Seletor de cores — em edição permite trocar, mas bloqueia cores de OUTROS heróis
  const coresUsadas = estado.partyHerois
    .filter(h => h.id !== idEdicao)
    .map(h => h.cor).filter(Boolean);
  const primeiraLivre = CORES_HEROI.find(c => !coresUsadas.includes(c.id));
  _corSelecionada = heroi?.cor || (primeiraLivre ? primeiraLivre.id : null);

  _imagemSelecionada = heroi?.imagem || null;

  renderizarSeletorCores(idEdicao);
  atualizarPreviewImagemHeroi();
  $("modal-heroi").classList.remove("oculto");
  $("heroi-nome").focus();
}

function fecharModalHeroi() {
  $("modal-heroi").classList.add("oculto");
}

function confirmarNovoHeroi() {
  const nome     = $("heroi-nome").value.trim();
  if (!nome) { $("heroi-nome").focus(); return; }

  const idEdicao = $("heroi-id-edicao").value;

  if (idEdicao) {
    // EDIÇÃO
    const heroi = estado.partyHerois.find(h => h.id === idEdicao);
    if (!heroi) return;

    const hpMaxAnterior = heroi.hpMax;
    const nivelInformado = parseInt($("heroi-nivel").value) || 1;
    const expInformada   = parseInt($("heroi-exp").value) || 0;
    const expMeta        = parseInt($("heroi-exp-meta").value) || 1000;
    const { nivel, exp, subiuNivel } = aplicarExpENivel(nivelInformado, expInformada, expMeta);

    heroi.nome    = nome;
    heroi.classe  = $("heroi-classe").value.trim() || "Aventureiro";
    heroi.nivel   = nivel;
    heroi.exp     = exp;
    heroi.expMeta = expMeta;
    heroi.hpMax   = parseInt($("heroi-hp").value) || 10;
    heroi.ca      = parseInt($("heroi-ca").value) || 10;
    heroi.cor     = _corSelecionada;
    heroi.imagem  = _imagemSelecionada || "";

    // Atualiza nome e hpMax na iniciativa também, já que são copiados ao entrar em combate
    const naIni = estado.listaDeIniciativa.find(c => c.idHeroi === idEdicao);
    if (naIni) {
      naIni.nome = heroi.nome;
      if (heroi.hpMax !== hpMaxAnterior) naIni.hpMax = heroi.hpMax;
    }

    adicionarHistorico(`✏️ ${heroi.nome} foi editado.`);
    if (subiuNivel) adicionarHistorico(`📈 ${heroi.nome} subiu para o nível ${nivel}!`);
  } else {
    // CRIAÇÃO
    const nivelInformado = parseInt($("heroi-nivel").value) || 1;
    const expInformada   = parseInt($("heroi-exp").value) || 0;
    const expMeta        = parseInt($("heroi-exp-meta").value) || 1000;
    const { nivel, exp } = aplicarExpENivel(nivelInformado, expInformada, expMeta);

    estado.partyHerois.push({
      id:      "h_" + Date.now(),
      nome,
      classe:  $("heroi-classe").value.trim() || "Aventureiro",
      nivel,
      exp,
      expMeta,
      hpMax:   parseInt($("heroi-hp").value) || 10,
      ca:      parseInt($("heroi-ca").value) || 10,
      cor:     _corSelecionada,
      imagem:  _imagemSelecionada || ""
    });
  }

  fecharModalHeroi();
  salvarESincronizar();
}

/* ==========================================================================
   3a. MODAL DE EXP DO HERÓI
   ========================================================================== */
let _idHeroiExpAtual = null;

function abrirModalExpHeroi(idHeroi) {
  const heroi = estado.partyHerois.find(h => h.id === idHeroi);
  if (!heroi) return;

  _idHeroiExpAtual = idHeroi;
  const expMeta = heroi.expMeta || 1000;

  const pctExp = Math.max(0, Math.min(100, ((heroi.exp || 0) / expMeta) * 100));

  $("modal-exp-heroi-titulo").textContent = `EXP — ${heroi.nome}`;
  $("exp-heroi-nivel").textContent = `Nível atual: ${heroi.nivel}`;
  $("exp-heroi-atual").textContent = `EXP atual: ${heroi.exp || 0} / ${expMeta}`;
  $("exp-heroi-barra-fill").style.width = `${pctExp}%`;
  $("exp-heroi-adicionar").value = "";
  $("exp-heroi-meta").value = expMeta;

  $("modal-exp-heroi").classList.remove("oculto");
  $("exp-heroi-adicionar").focus();
}

function fecharModalExpHeroi() {
  $("modal-exp-heroi").classList.add("oculto");
  _idHeroiExpAtual = null;
}

function confirmarExpHeroi() {
  const heroi = estado.partyHerois.find(h => h.id === _idHeroiExpAtual);
  if (!heroi) { fecharModalExpHeroi(); return; }

  const valorAdicionado = parseInt($("exp-heroi-adicionar").value) || 0;
  const metaAntiga = heroi.expMeta || 1000;
  const novaMeta   = parseInt($("exp-heroi-meta").value) || metaAntiga;
  const { nivel, exp, subiuNivel } = aplicarExpENivel(heroi.nivel, (heroi.exp || 0) + valorAdicionado, metaAntiga);

  heroi.nivel    = nivel;
  heroi.exp      = exp;
  heroi.expMeta  = novaMeta;

  if (valorAdicionado) adicionarHistorico(`✨ ${heroi.nome} ganhou ${valorAdicionado} de EXP!`, "exp");
  if (subiuNivel) adicionarHistorico(`📈 ${heroi.nome} subiu para o nível ${nivel}!`);

  fecharModalExpHeroi();
  salvarESincronizar();
}

/* ==========================================================================
   3b. MODAL DE NOVO MONSTRO CUSTOMIZADO
   ========================================================================== */
function abrirModalMonstro() {
  $("monstro-nome").value = "";
  $("monstro-hp").value   = "10";
  $("monstro-nd").value   = "";
  $("modal-monstro").classList.remove("oculto");
  $("monstro-nome").focus();
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

// Contexto completo do modal (herói ou monstro)
let _contextoIniciativa = null;

function lancarIniciativaHeroi(idHeroi) {
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

function removerHeroi(idHeroi) {
  if (!confirm("Deseja realmente remover este herói da party?")) return;
  estado.partyHerois       = estado.partyHerois.filter(h => h.id !== idHeroi);
  estado.listaDeIniciativa = estado.listaDeIniciativa.filter(c => c.idHeroi !== idHeroi);
  salvarESincronizar();
}

function sincronizarVidaTudo(idHeroi, novoValor) {
  const itemIni = estado.listaDeIniciativa.find(c => c.idHeroi === idHeroi);
  if (itemIni) itemIni.hpAtual = parseInt(novoValor) || 0;
  salvarESincronizar();
}

/* ==========================================================================
   CONDIÇÕES — reexibição do popover do painel de turno
   ========================================================================== */
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
   BOTÕES DE AÇÃO DO PAINEL DE TURNO
   ========================================================================== */
function abrirTurnoAcaoAtaque() {
  const atual = estado.listaDeIniciativa[estado.turnoAtivo];
  if (!atual) return;
  if (config.etapaAcerto) abrirModalAcerto(atual.id);
  else abrirModalDanoCura([], "dano", atual.id);
}

// Popover de condições do painel de turno — fica aberto entre seleções para
// permitir marcar várias condições seguidas (só fecha ao clicar fora dele).
let _popoverCondicaoTurno = null;

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

function abrirTurnoAcaoCura() {
  const atual = estado.listaDeIniciativa[estado.turnoAtivo];
  if (!atual) return;
  abrirModalDanoCura([atual.id], "cura");
}

/** Botão de morte/nocaute: herói vai a nocauteado, monstro vai a morto. Clicar de novo reverte. */
function alternarMortoNocaute(id) {
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

function atualizarPainelTurno() {
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

/* ==========================================================================
   6. RENDERIZAÇÃO — INICIATIVA
   ========================================================================== */
function atualizarIniciativa() {
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
   7. RENDERIZAÇÃO — STATUS DO GRUPO
   ========================================================================== */
function renderizarStatusGrupo() {
  const container = $("conteudo-status-grupo");
  if (!container) return;
  container.innerHTML = "";

  estado.partyHerois.forEach(heroi => {
    const naIni    = estado.listaDeIniciativa.find(c => c.idHeroi === heroi.id);
    const hpAtual  = naIni ? naIni.hpAtual : heroi.hpMax;
    const valorIni = naIni ? naIni.valor    : "-";
    const pctHP    = heroi.hpMax > 0 ? (hpAtual / heroi.hpMax) * 100 : 0;
    const corHP    = calcularCorHP(hpAtual, heroi.hpMax);

    const card = document.createElement("div");
    card.className = "card-heroi";
    let corHeroiHex = null;
    if (heroi.cor) {
      const cor = CORES_HEROI.find(c => c.id === heroi.cor);
      if (cor) {
        corHeroiHex = cor.hex;
        card.style.borderLeftColor = cor.hex;
      }
    }

    // Corpo: avatar (imagem do herói) + coluna com o restante das informações
    const corpo = document.createElement("div");
    corpo.className = "card-heroi-corpo";

    const expMeta = heroi.expMeta || 1000;
    const pctExp  = Math.max(0, Math.min(100, ((heroi.exp || 0) / expMeta) * 100));

    const avatarAnel = document.createElement("div");
    avatarAnel.className = "card-heroi-avatar-anel";
    avatarAnel.style.setProperty("--pct-exp", pctExp);
    avatarAnel.title = `EXP: ${heroi.exp || 0} / ${expMeta}`;

    const avatar = document.createElement("div");
    avatar.className = "card-heroi-avatar";
    preencherAvatar(avatar, heroi.nome, heroi.imagem);
    avatarAnel.appendChild(avatar);

    const avatarCol = document.createElement("div");
    avatarCol.className = "card-heroi-avatar-col";

    const btnExp = document.createElement("button");
    btnExp.textContent = "+ EXP";
    btnExp.className   = "btn-exp-heroi";
    btnExp.title       = "Adicionar EXP";
    btnExp.addEventListener("click", () => abrirModalExpHeroi(heroi.id));

    avatarCol.appendChild(avatarAnel);
    avatarCol.appendChild(btnExp);

    const info = document.createElement("div");
    info.className = "card-heroi-info";

    // Topo: nome + iniciativa + botão remover
    const topo = document.createElement("div");
    topo.className = "card-heroi-topo";

    const nomeSpan = document.createElement("span");
    nomeSpan.className   = "card-heroi-nome";
    nomeSpan.textContent = heroi.nome;
    if (corHeroiHex) nomeSpan.style.color = corHeroiHex;

    const btnIni = document.createElement("button");
    btnIni.textContent = naIni ? `Ini: ${valorIni}` : "+ Iniciativa";
    btnIni.className   = "btn-ini-heroi";
    btnIni.title       = naIni ? "Atualizar iniciativa" : "Lançar iniciativa";
    btnIni.addEventListener("click", () => lancarIniciativaHeroi(heroi.id));

    const btnRemover = document.createElement("button");
    btnRemover.textContent = "✕";
    btnRemover.className   = "btn-remover-heroi";
    btnRemover.title       = "Remover herói";
    btnRemover.addEventListener("click", () => removerHeroi(heroi.id));

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "✏️";
    btnEditar.className   = "btn-editar-heroi";
    btnEditar.title       = "Editar herói";
    btnEditar.addEventListener("click", () => abrirModalHeroi(heroi.id));

    topo.appendChild(nomeSpan);
    topo.appendChild(btnIni);
    topo.appendChild(btnEditar);
    topo.appendChild(btnRemover);

    // Subtítulo
    const sub = document.createElement("div");
    sub.className   = "card-heroi-sub";
    sub.textContent = `Nvl ${heroi.nivel} | ${heroi.classe}${heroi.ca ? ` | CA ${heroi.ca}` : ""}`;

    // Barra de HP
    const barraWrap = document.createElement("div");
    barraWrap.className = "barra-hp-wrap";
    const barraFill = document.createElement("div");
    barraFill.className        = "barra-hp-fill";
    barraFill.style.width      = `${Math.max(0, Math.min(100, pctHP))}%`;
    barraFill.style.background = corHP;
    barraWrap.appendChild(barraFill);

    // Rodapé: HP Temp (− input +)
    const rodape = document.createElement("div");
    rodape.className = "card-heroi-rodape";

    const divHP = document.createElement("div");
    divHP.className = "card-heroi-hp";

    const labelHP = document.createElement("label");
    labelHP.textContent = "HP Temp:";

    const btnMenos = document.createElement("button");
    btnMenos.textContent = "−";
    btnMenos.className   = "btn-hp-step";
    btnMenos.addEventListener("click", () => {
      inputHP.value = (parseInt(inputHP.value) || 0) - 1;
      sincronizarVidaTudo(heroi.id, inputHP.value);
    });

    const inputHP = document.createElement("input");
    inputHP.type  = "number";
    inputHP.value = hpAtual;
    inputHP.addEventListener("input", () => sincronizarVidaTudo(heroi.id, inputHP.value));

    const btnMais = document.createElement("button");
    btnMais.textContent = "+";
    btnMais.className   = "btn-hp-step";
    btnMais.addEventListener("click", () => {
      inputHP.value = (parseInt(inputHP.value) || 0) + 1;
      sincronizarVidaTudo(heroi.id, inputHP.value);
    });

    divHP.appendChild(labelHP);
    divHP.appendChild(btnMenos);
    divHP.appendChild(inputHP);
    divHP.appendChild(btnMais);

    rodape.appendChild(divHP);

    info.appendChild(topo);
    info.appendChild(sub);
    info.appendChild(barraWrap);
    info.appendChild(rodape);

    corpo.appendChild(avatarCol);
    corpo.appendChild(info);
    card.appendChild(corpo);
    container.appendChild(card);
  });
}

/* ==========================================================================
   8. RENDERIZAÇÃO — COLETÂNEA DE MONSTROS
   ========================================================================== */
function renderizarColetanea(filtro = "") {
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

    item.appendChild(info);
    item.appendChild(acoes);
    container.appendChild(item);
  });
}

/* ==========================================================================
   9. DADOS E HISTÓRICO
   ========================================================================== */
function limparIniciativa() {
  if (!confirm("Deseja realmente limpar todo o combate?")) return;
  estado.listaDeIniciativa  = [];
  estado.turnoAtivo         = 0;
  estado.turnoAtual         = 1;
  estado.efeitosTemporarios = [];
  adicionarHistorico("🏳️ Combate encerrado!");
  salvarESincronizar();
}

function atualizarBtnTema() {
  const isLight = document.body.classList.contains("tema-light");
  const btn = $("btn-tema");
  if (btn) btn.textContent = isLight ? "🌙 Modo Dark" : "☀️ Modo Light";
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
      (dados.historico || []).forEach(h => renderizarItemHistorico(h.texto, h.tipo, h.hora));
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
   11. INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
  // Painéis re-renderizados a cada salvarESincronizar()
  aoSincronizar(atualizarIniciativa);
  aoSincronizar(renderizarStatusGrupo);
  aoSincronizar(atualizarPainelTurno);

  renderizarColetanea();

  const inputBusca = $("busca-monstros");
  if (inputBusca) inputBusca.addEventListener("input", () => renderizarColetanea(inputBusca.value));

  configurarModal("btn-sobre", "modal-sobre", "fechar-sobre");
  configurarModal("btn-ajuda", "modal-ajuda", "fechar-ajuda");

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

  const btnNovoHeroiStatus = $("btn-novo-heroi-status");
  if (btnNovoHeroiStatus) btnNovoHeroiStatus.addEventListener("click", () => abrirModalHeroi());

  initConfig();
  $("btn-exportar-sessao").addEventListener("click", exportarSessao);
  $("btn-limpar-tudo").addEventListener("click", limparTodosDados);
  const fileImportar = $("input-importar-sessao");
  if (fileImportar) fileImportar.addEventListener("change", (e) => importarSessao(e.target.files[0]));

  $("fechar-iniciativa").addEventListener("click", fecharModalIniciativa);
  $("btn-rolar-ini").addEventListener("click", rolarIniciativaModal);
  $("btn-confirmar-ini").addEventListener("click", confirmarIniciativaModal);
  window.addEventListener("click", (e) => { if (e.target === $("modal-iniciativa")) fecharModalIniciativa(); });
  $("modal-iniciativa").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarIniciativaModal(); });

  $("fechar-heroi").addEventListener("click", fecharModalHeroi);
  $("btn-confirmar-heroi").addEventListener("click", confirmarNovoHeroi);
  window.addEventListener("click", (e) => { if (e.target === $("modal-heroi")) fecharModalHeroi(); });
  $("modal-heroi").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoHeroi(); });

  $("btn-escolher-imagem-heroi").addEventListener("click", abrirModalEscolherImagem);
  $("fechar-escolher-imagem").addEventListener("click", fecharModalEscolherImagem);
  window.addEventListener("click", (e) => { if (e.target === $("modal-escolher-imagem")) fecharModalEscolherImagem(); });

  $("fechar-exp-heroi").addEventListener("click", fecharModalExpHeroi);
  $("btn-confirmar-exp-heroi").addEventListener("click", confirmarExpHeroi);
  window.addEventListener("click", (e) => { if (e.target === $("modal-exp-heroi")) fecharModalExpHeroi(); });
  $("modal-exp-heroi").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarExpHeroi(); });

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

  initCondicoes();
  aoFecharModalCondicao(reexibirPopoverCondicao);
  initDano();

  $("btn-turno-anterior").addEventListener("click", turnoAnterior);
  $("btn-proximo-turno").addEventListener("click", proximoTurno);

  $("btn-encerrar-combate").addEventListener("click", limparIniciativa);
  $("btn-limpar-historico").addEventListener("click", limparHistorico);

  initDados();

  // Botões de ação do painel de turno
  const btnTurnoAtaque = $("btn-turno-ataque");
  const btnTurnoCondicao = $("btn-turno-condicao");
  const btnTurnoCura = $("btn-turno-cura");

  if (btnTurnoAtaque) btnTurnoAtaque.addEventListener("click", abrirTurnoAcaoAtaque);
  if (btnTurnoCondicao) btnTurnoCondicao.addEventListener("click", abrirTurnoAcaoCondicao);
  if (btnTurnoCura) btnTurnoCura.addEventListener("click", abrirTurnoAcaoCura);

  atualizarIniciativa();
  renderizarStatusGrupo();
  atualizarPainelTurno();
  aplicarConfig();

  const historicoSalvo = lerLocalStorageJSON(CHAVES.historico, []);
  historicoSalvo.forEach(e => renderizarItemHistorico(e.texto, e.tipo, e.hora));

  const areaAnotacoes = $("campo-anotacoes");
  if (areaAnotacoes) {
    areaAnotacoes.value = localStorage.getItem(CHAVES.anotacoes) || "";
    areaAnotacoes.addEventListener("input", () => localStorage.setItem(CHAVES.anotacoes, areaAnotacoes.value));
  }

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