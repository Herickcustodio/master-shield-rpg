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
   ========================================================================== */
import { $ } from "./dom.js";
import { CHAVES, lerLocalStorageJSON } from "./storage.js";
import { estado } from "./state.js";
import { CORES_HEROI, IMAGENS_HEROI, CONDICOES } from "./constantes.js";
import { coletaneaMonstros } from "./monstros.js";
import { adicionarHistorico, renderizarItemHistorico, limparHistorico } from "./historico.js";
import { initDados } from "./dados.js";

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

/** Preenche um elemento de avatar com a imagem escolhida do herói, ou a inicial do nome como fallback */
function preencherAvatar(elemento, nome, imagemBase) {
  elemento.innerHTML = "";
  if (imagemBase) {
    const img = document.createElement("img");
    img.className = "avatar-img";
    img.src = `img/herois/${imagemBase}_white.png`;
    img.alt = nome || "";
    elemento.appendChild(img);
  } else {
    elemento.textContent = (nome || "?").trim().charAt(0).toUpperCase() || "?";
  }
}

/** Resolve a imagem escolhida de um combatente da iniciativa (só heróis têm) */
function obterImagemCriatura(criatura) {
  if (!criatura.idHeroi) return null;
  const h = estado.partyHerois.find(h => h.id === criatura.idHeroi);
  return h?.imagem || null;
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
   2. PERSISTÊNCIA
   ========================================================================== */
function salvarIniciativaNoCofre() {
  localStorage.setItem(CHAVES.iniciativa, JSON.stringify(estado.listaDeIniciativa));
}

function salvarHeroisNoCofre() {
  localStorage.setItem(CHAVES.party, JSON.stringify(estado.partyHerois));
}

function salvarESincronizar() {
  salvarIniciativaNoCofre();
  salvarHeroisNoCofre();
  localStorage.setItem(CHAVES.turnoAtivo,  estado.turnoAtivo);
  localStorage.setItem(CHAVES.turnoAtual,  estado.turnoAtual);
  localStorage.setItem(CHAVES.efeitos,     JSON.stringify(estado.efeitosTemporarios));
  atualizarIniciativa();
  renderizarStatusGrupo();
  atualizarPainelTurno();
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
   MODAL DE DURAÇÃO DE CONDIÇÃO
   ========================================================================== */
let _condicaoCtx = null; // { criaturaId, condicaoId }

function abrirModalCondicaoDuracao(criaturaId, condicaoId) {
  const criatura = estado.listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;

  const cond     = CONDICOES.find(c => c.id === condicaoId);
  const jaAtiva  = (criatura.condicoes || []).find(c => c.id === condicaoId);

  // Se já está ativa, remove direto sem abrir modal
  if (jaAtiva) {
    removerCondicao(criaturaId, condicaoId);
    return;
  }

  _condicaoCtx = { criaturaId, condicaoId };
  $("modal-condicao-titulo").textContent = `${cond.emoji} ${cond.label} — ${criatura.nome}`;
  $("condicao-turnos").value = "1";
  $("modal-condicao-duracao").classList.remove("oculto");
  $("condicao-turnos").focus();
}

function fecharModalCondicaoDuracao() {
  $("modal-condicao-duracao").classList.add("oculto");
  _condicaoCtx = null;

  // Se o popover de condições do turno estava aberto (e só escondido para dar
  // lugar a este modal), reexibe ele já atualizado para escolher outra condição.
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

function confirmarCondicao() {
  if (!_condicaoCtx) return;
  const { criaturaId, condicaoId } = _condicaoCtx;
  const criatura = estado.listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;
  if (!criatura.condicoes) criatura.condicoes = [];

  const turnosVal = $("condicao-turnos").value.trim();
  const turnos    = turnosVal !== "" ? parseInt(turnosVal) || 1 : null; // null = indefinido
  const cond      = CONDICOES.find(c => c.id === condicaoId);

  criatura.condicoes.push({ id: condicaoId, turnos });

  const duracaoTxt = turnos ? `${turnos} turno${turnos > 1 ? "s" : ""}` : "indefinido";
  adicionarHistorico(`${cond.emoji} ${criatura.nome} recebeu: ${cond.label} (${duracaoTxt})`, "condicao");

  fecharModalCondicaoDuracao();
  salvarESincronizar();
}

function removerCondicao(criaturaId, condicaoId) {
  const criatura = estado.listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;
  const cond = CONDICOES.find(c => c.id === condicaoId);
  criatura.condicoes = (criatura.condicoes || []).filter(c => c.id !== condicaoId);
  adicionarHistorico(`✅ ${criatura.nome} se recuperou de: ${cond.label}`, "sucesso");
  salvarESincronizar();
}

/** Decrementa turnos de condições ao virar turno. Por padrão processa todos os combatentes;
 *  passe uma sublista (ex.: [criaturaAtiva]) para decrementar só quem está com o turno ativo. */
function decrementarCondicoes(criaturas = estado.listaDeIniciativa) {
  criaturas.forEach(criatura => {
    if (!criatura.condicoes) return;
    const expiradas = [];
    criatura.condicoes = criatura.condicoes.map(c => {
      if (c.turnos === null) return c; // indefinido, não decrementa
      const novas = c.turnos - 1;
      if (novas <= 0) { expiradas.push(c.id); return null; }
      if (novas === 1) {
        const cond = CONDICOES.find(x => x.id === c.id);
        adicionarHistorico(`⚠️ ${criatura.nome}: "${cond?.label}" expira no próximo turno!`);
      }
      return { ...c, turnos: novas };
    }).filter(Boolean);

    expiradas.forEach(id => {
      const cond = CONDICOES.find(x => x.id === id);
      adicionarHistorico(`⏰ ${criatura.nome}: condição "${cond?.label}" expirou!`, "falha");
    });
  });
}

/** Alterna uma condição — agora abre modal para definir duração */
function toggleCondicao(id, condicaoId) {
  abrirModalCondicaoDuracao(id, condicaoId);
}

/** Alterna o estado de morte do combatente sem removê-lo da lista */
function marcarMorto(id) {
  const criatura = estado.listaDeIniciativa.find(c => c.id === id);
  if (!criatura) return;

  if (criatura.morto) {
    criatura.morto      = false;
    criatura.nocauteado = false; // limpa nocaute também ao reviver
    adicionarHistorico(`💚 ${criatura.nome} foi revivido!`, "sucesso");
  } else {
    if (!confirm(`Marcar "${criatura.nome}" como morto?`)) return;
    criatura.morto      = true;
    criatura.nocauteado = false;
    adicionarHistorico(`☠️ ${criatura.nome} morreu!`, "falha");
  }

  salvarESincronizar();
}

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

/** Renderiza uma lista de combatentes com checkbox (usada em Área, Acerto e Dano) */
function renderizarListaAlvos(containerId, { preSelecionados = [], mostrarCA = false } = {}) {
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

function selecionarTodosAlvos(containerId, selecionar) {
  document.querySelectorAll(`#${containerId} .area-alvo-cb`).forEach(cb => cb.checked = selecionar);
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
function processarHPZero(criatura) {
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

let _modalDanoCuraIds  = [];
let _modalDanoCuraTipo = null;

/* ==========================================================================
   MODAL DE ACERTO
   ========================================================================== */
let _acertoAtacanteId = null;

function abrirModalAcerto(atacanteId) {
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

function abrirModalDanoCura(ids, tipo, atacantePreId = null) {
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
function calcularCorHP(hpAtual, hpMax) {
  if (hpMax <= 0) return "#888";
  const pct = hpAtual / hpMax;
  if (pct > 0.5) return "#2ecc71";  // verde
  if (pct > 0.25) return "#f39c12"; // amarelo
  return "#e63946";                  // vermelho
}

/** Resolve a CA de um combatente da iniciativa (herói, monstro custom ou da coletânea) */
function obterCACriatura(criatura) {
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
   10. MODAIS
   ========================================================================== */
function configurarModal(btnId, modalId, fecharId) {
  const botao = $(btnId);
  const modal = $(modalId);
  const fechar = $(fecharId);
  botao.addEventListener("click",  () => modal.classList.remove("oculto"));
  fechar.addEventListener("click", () => modal.classList.add("oculto"));
  window.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("oculto"); });
}

/* ==========================================================================
   CONFIGURAÇÕES
   ========================================================================== */
let config = lerLocalStorageJSON(CHAVES.config, {
  campanhaNome: "",
  mestreNome:   "",
  dadoAcerto:   20,
  etapaAcerto:  true,
  autoMorte:    true,
  expiracaoCondicao: "rodada", // "rodada" = fim da rodada | "turno" = no turno do personagem
});

function abrirModalConfig() {
  $("config-campanha-nome").value      = config.campanhaNome;
  $("config-mestre-nome").value        = config.mestreNome;
  $("config-dado-acerto").value        = config.dadoAcerto;
  $("config-expiracao-condicao").value = config.expiracaoCondicao;
  $("config-etapa-acerto").checked     = config.etapaAcerto;
  $("config-auto-morte").checked       = config.autoMorte;
  $("modal-config").classList.remove("oculto");
}

function salvarConfig() {
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

function aplicarConfig() {
  const spanCampanha = $("header-campanha");
  if (spanCampanha) spanCampanha.textContent = config.campanhaNome || "";
  const spanMestre = $("header-mestre");
  if (spanMestre) spanMestre.textContent = config.mestreNome ? `Mestre: ${config.mestreNome}` : "";
  const selAcerto = $("acerto-tipo");
  if (selAcerto) selAcerto.value = config.dadoAcerto;
}

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
      config             = dados.config             || config;
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

  $("btn-config").addEventListener("click", abrirModalConfig);
  $("fechar-config").addEventListener("click", () => $("modal-config").classList.add("oculto"));
  window.addEventListener("click", (e) => { if (e.target === $("modal-config")) $("modal-config").classList.add("oculto"); });
  $("btn-salvar-config").addEventListener("click", salvarConfig);
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

  $("fechar-condicao-duracao").addEventListener("click", fecharModalCondicaoDuracao);
  $("btn-confirmar-condicao").addEventListener("click", confirmarCondicao);
  window.addEventListener("click", (e) => { if (e.target === $("modal-condicao-duracao")) fecharModalCondicaoDuracao(); });
  $("modal-condicao-duracao").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarCondicao(); });

  $("fechar-acerto").addEventListener("click", fecharModalAcerto);
  $("btn-rolar-acerto").addEventListener("click", rolarAcerto);
  $("btn-acerto-aplicar-dano").addEventListener("click", irParaDano);
  $("btn-acerto-pular").addEventListener("click", irParaDano);
  $("btn-acerto-alvo-todos").addEventListener("click", () => selecionarTodosAlvos("acerto-alvos-lista", true));
  $("btn-acerto-alvo-nenhum").addEventListener("click", () => selecionarTodosAlvos("acerto-alvos-lista", false));
  window.addEventListener("click", (e) => { if (e.target === $("modal-acerto")) fecharModalAcerto(); });

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