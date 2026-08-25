/* ==========================================================================
   1. ESTADO GLOBAL
   ========================================================================== */
function lerLocalStorageJSON(chave, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const valor = localStorage.getItem(chave);
    if (valor === null || valor === undefined || valor === "") return fallback;
    const parseado = JSON.parse(valor);
    return parseado ?? fallback;
  } catch (erro) {
    console.warn(`Dados inválidos em ${chave}. Usando fallback.`, erro);
    return fallback;
  }
}

function lerLocalStorageNumero(chave, fallback = 0) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const valor = localStorage.getItem(chave);
    if (valor === null || valor === undefined || valor === "") return fallback;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : fallback;
  } catch (erro) {
    console.warn(`Valor inválido em ${chave}. Usando fallback.`, erro);
    return fallback;
  }
}

let listaDeIniciativa  = lerLocalStorageJSON("iniciativaRPG", []);
let partyHerois        = lerLocalStorageJSON("partyHeroisRPG", []);
let turnoAtivo         = lerLocalStorageNumero("turnoAtivoRPG", 0);
let turnoAtual         = lerLocalStorageNumero("turnoAtualRPG", lerLocalStorageNumero("rodadaAtualRPG", 1));
let monstrosCustom     = lerLocalStorageJSON("monstrosCustomRPG", []);
let efeitosTemporarios = lerLocalStorageJSON("efeitosRPG", []);
let ultimasRolagens    = lerLocalStorageJSON("ultimasRolagensRPG", []);
let dadoSelecionado    = 20;

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// coletaneaMonstros é carregada pelo monstros.js

const CORES_HEROI = [
  { id: "azul",     hex: "#3b82f6", label: "Azul"     },
  { id: "verde",    hex: "#22c55e", label: "Verde"     },
  { id: "amarelo",  hex: "#eab308", label: "Amarelo"   },
  { id: "laranja",  hex: "#f97316", label: "Laranja"   },
  { id: "vermelho", hex: "#ef4444", label: "Vermelho"  },
  { id: "roxo",     hex: "#a855f7", label: "Roxo"      },
  { id: "rosa",     hex: "#ec4899", label: "Rosa"      },
  { id: "ciano",    hex: "#06b6d4", label: "Ciano"     },
  { id: "branco",   hex: "#e5e7eb", label: "Branco"    },
  { id: "ouro",     hex: "#d97706", label: "Ouro"      },
];

let _corSelecionada = null;

// Ícones disponíveis em img/herois/ (arquivo real é <id>_white.png / <id>_black.png)
const IMAGENS_HEROI = [
  { id: "barbarian",         label: "Bárbaro"        },
  { id: "dwarf-face",        label: "Anão"           },
  { id: "dwarf-helmet",      label: "Anão Guerreiro" },
  { id: "dwarf-king",        label: "Rei Anão"       },
  { id: "elf-helmet",        label: "Elfo Guerreiro" },
  { id: "woman-elf-face",    label: "Elfa"           },
  { id: "kenku-head",        label: "Kenku"          },
  { id: "orc-head",          label: "Orc"            },
  { id: "troll",             label: "Troll"          },
  { id: "ogre",              label: "Ogro"           },
  { id: "vampire-dracula",   label: "Vampiro"        },
  { id: "warlock-hood",      label: "Bruxo"          },
  { id: "wizard-face",       label: "Mago"           },
  { id: "witch-face",        label: "Bruxa"          },
  { id: "monk-face",         label: "Monge"          },
  { id: "nun-face",          label: "Clériga"        },
  { id: "cultist",           label: "Cultista"       },
  { id: "cowled",            label: "Encapuzado"     },
  { id: "executioner-hood",  label: "Carrasco"       },
  { id: "barbute",           label: "Elmo Barbuto"   },
  { id: "brutal-helm",       label: "Elmo Brutal"    },
  { id: "visored-helm",      label: "Elmo com Viseira" },
];

let _imagemSelecionada = null;

/** Preenche o quadradinho de pré-visualização no modal de Novo/Editar Herói */
function atualizarPreviewImagemHeroi() {
  const preview = document.getElementById("heroi-imagem-preview");
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
  document.getElementById("modal-escolher-imagem").classList.remove("oculto");
}

function fecharModalEscolherImagem() {
  document.getElementById("modal-escolher-imagem").classList.add("oculto");
}

function renderizarSeletorImagens() {
  const container = document.getElementById("heroi-imagens");
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
  const h = partyHerois.find(h => h.id === criatura.idHeroi);
  return h?.imagem || null;
}

function renderizarSeletorCores(idEdicao = null) {
  const container = document.getElementById("heroi-cores");
  if (!container) return;
  container.innerHTML = "";

  // Bloqueia cores de outros heróis (não do que está sendo editado)
  const coresUsadas = partyHerois
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

const CONDICOES = [
  { id: "agarrado",      emoji: "🤝", label: "Agarrado",      descricao: "Deslocamento vira 0. O efeito termina se quem agarrou ficar incapacitado ou o alvo escapar mecanicamente."        },
  { id: "amedrontado",   emoji: "😱", label: "Amedrontado",    descricao: "Desvantagem em ataques e testes enquanto a fonte do medo estiver visível. Não pode se aproximar dela."             },
  { id: "atordoado",     emoji: "💫", label: "Atordoado",      descricao: "Incapacitado, não pode se mover, fala balbuciante. Ataques contra ele têm vantagem."                              },
  { id: "caido",         emoji: "🛡️", label: "Caído",          descricao: "Só pode rastejar. Ataques próprios com desvantagem. Ataques corpo a corpo contra si com vantagem, distância com desvantagem." },
  { id: "cego",          emoji: "🙈", label: "Cego",           descricao: "Falha em testes que dependem de visão. Ataques próprios com desvantagem, ataques contra si com vantagem."          },
  { id: "enfeiticado",   emoji: "💜", label: "Enfeitiçado",    descricao: "Não pode atacar o encantador. O encantador tem vantagem em interações sociais com o alvo."                         },
  { id: "envenenado",    emoji: "🤢", label: "Envenenado",     descricao: "Desvantagem em jogadas de ataque e testes de habilidade."                                                          },
  { id: "impedido",      emoji: "⛓️", label: "Impedido",       descricao: "Deslocamento vira 0. Ataques contra si com vantagem, próprios com desvantagem. Desvantagem em saves de Destreza."  },
  { id: "incapacitado",  emoji: "🚫", label: "Incapacitado",   descricao: "Não pode realizar ações, ações bônus ou reações."                                                                  },
  { id: "invisivel",     emoji: "👻", label: "Invisível",      descricao: "Impossível de ver sem sentidos especiais. Ataques próprios com vantagem, ataques contra si com desvantagem."       },
  { id: "paralisado",    emoji: "❄️", label: "Paralisado",     descricao: "Incapacitado, não se move nem fala. Falha automática em saves de For/Des. Acertos adjacentes são críticos."        },
  { id: "petrificado",   emoji: "🗿", label: "Petrificado",    descricao: "Transformado em pedra. Incapacitado, peso ×10, resistente a todo dano."                                            },
  { id: "surdo",         emoji: "🔇", label: "Surdo",          descricao: "Não pode ouvir. Falha automática em testes baseados em audição."                                                   },
  { id: "exaustao",      emoji: "😮‍💨", label: "Exaustão",      descricao: "Condição cumulativa. Níveis crescentes afetam testes e velocidade, podendo levar à morte no nível máximo."        },
];

/* ==========================================================================
   2. PERSISTÊNCIA
   ========================================================================== */
function salvarIniciativaNoCofre() {
  localStorage.setItem("iniciativaRPG", JSON.stringify(listaDeIniciativa));
}

function salvarHeroisNoCofre() {
  localStorage.setItem("partyHeroisRPG", JSON.stringify(partyHerois));
}

function salvarESincronizar() {
  salvarIniciativaNoCofre();
  salvarHeroisNoCofre();
  localStorage.setItem("turnoAtivoRPG",  turnoAtivo);
  localStorage.setItem("turnoAtualRPG",  turnoAtual);
  localStorage.setItem("efeitosRPG",     JSON.stringify(efeitosTemporarios));
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
  const heroi = idEdicao ? partyHerois.find(h => h.id === idEdicao) : null;

  document.getElementById("modal-heroi-titulo").textContent    = heroi ? "Editar Herói" : "Novo Herói";
  document.getElementById("btn-confirmar-heroi").textContent   = heroi ? "Salvar Alterações" : "Criar Herói";
  document.getElementById("heroi-id-edicao").value             = idEdicao || "";
  document.getElementById("heroi-nome").value   = heroi ? heroi.nome   : "";
  document.getElementById("heroi-classe").value = heroi ? heroi.classe : "";
  document.getElementById("heroi-nivel").value  = heroi ? heroi.nivel  : "1";
  document.getElementById("heroi-hp").value     = heroi ? heroi.hpMax  : "10";
  document.getElementById("heroi-ca").value     = heroi ? heroi.ca     : "10";
  document.getElementById("heroi-exp").value      = heroi ? (heroi.exp || 0) : "0";
  document.getElementById("heroi-exp-meta").value = heroi ? (heroi.expMeta || 1000) : "1000";

  // Seletor de cores — em edição permite trocar, mas bloqueia cores de OUTROS heróis
  const coresUsadas = partyHerois
    .filter(h => h.id !== idEdicao)
    .map(h => h.cor).filter(Boolean);
  const primeiraLivre = CORES_HEROI.find(c => !coresUsadas.includes(c.id));
  _corSelecionada = heroi?.cor || (primeiraLivre ? primeiraLivre.id : null);

  _imagemSelecionada = heroi?.imagem || null;

  renderizarSeletorCores(idEdicao);
  atualizarPreviewImagemHeroi();
  document.getElementById("modal-heroi").classList.remove("oculto");
  document.getElementById("heroi-nome").focus();
}

function fecharModalHeroi() {
  document.getElementById("modal-heroi").classList.add("oculto");
}

function confirmarNovoHeroi() {
  const nome     = document.getElementById("heroi-nome").value.trim();
  if (!nome) { document.getElementById("heroi-nome").focus(); return; }

  const idEdicao = document.getElementById("heroi-id-edicao").value;

  if (idEdicao) {
    // EDIÇÃO
    const heroi = partyHerois.find(h => h.id === idEdicao);
    if (!heroi) return;

    const hpMaxAnterior = heroi.hpMax;
    const nivelInformado = parseInt(document.getElementById("heroi-nivel").value) || 1;
    const expInformada   = parseInt(document.getElementById("heroi-exp").value) || 0;
    const expMeta        = parseInt(document.getElementById("heroi-exp-meta").value) || 1000;
    const { nivel, exp, subiuNivel } = aplicarExpENivel(nivelInformado, expInformada, expMeta);

    heroi.nome    = nome;
    heroi.classe  = document.getElementById("heroi-classe").value.trim() || "Aventureiro";
    heroi.nivel   = nivel;
    heroi.exp     = exp;
    heroi.expMeta = expMeta;
    heroi.hpMax   = parseInt(document.getElementById("heroi-hp").value) || 10;
    heroi.ca      = parseInt(document.getElementById("heroi-ca").value) || 10;
    heroi.cor     = _corSelecionada;
    heroi.imagem  = _imagemSelecionada || "";

    // Atualiza hpMax na iniciativa também se mudou
    if (heroi.hpMax !== hpMaxAnterior) {
      const naIni = listaDeIniciativa.find(c => c.idHeroi === idEdicao);
      if (naIni) naIni.hpMax = heroi.hpMax;
    }

    adicionarHistorico(`✏️ ${heroi.nome} foi editado.`);
    if (subiuNivel) adicionarHistorico(`📈 ${heroi.nome} subiu para o nível ${nivel}!`);
  } else {
    // CRIAÇÃO
    const nivelInformado = parseInt(document.getElementById("heroi-nivel").value) || 1;
    const expInformada   = parseInt(document.getElementById("heroi-exp").value) || 0;
    const expMeta        = parseInt(document.getElementById("heroi-exp-meta").value) || 1000;
    const { nivel, exp } = aplicarExpENivel(nivelInformado, expInformada, expMeta);

    partyHerois.push({
      id:      "h_" + Date.now(),
      nome,
      classe:  document.getElementById("heroi-classe").value.trim() || "Aventureiro",
      nivel,
      exp,
      expMeta,
      hpMax:   parseInt(document.getElementById("heroi-hp").value) || 10,
      ca:      parseInt(document.getElementById("heroi-ca").value) || 10,
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
  const heroi = partyHerois.find(h => h.id === idHeroi);
  if (!heroi) return;

  _idHeroiExpAtual = idHeroi;
  const expMeta = heroi.expMeta || 1000;

  const pctExp = Math.max(0, Math.min(100, ((heroi.exp || 0) / expMeta) * 100));

  document.getElementById("modal-exp-heroi-titulo").textContent = `EXP — ${heroi.nome}`;
  document.getElementById("exp-heroi-nivel").textContent = `Nível atual: ${heroi.nivel}`;
  document.getElementById("exp-heroi-atual").textContent = `EXP atual: ${heroi.exp || 0} / ${expMeta}`;
  document.getElementById("exp-heroi-barra-fill").style.width = `${pctExp}%`;
  document.getElementById("exp-heroi-adicionar").value = "";
  document.getElementById("exp-heroi-meta").value = expMeta;

  document.getElementById("modal-exp-heroi").classList.remove("oculto");
  document.getElementById("exp-heroi-adicionar").focus();
}

function fecharModalExpHeroi() {
  document.getElementById("modal-exp-heroi").classList.add("oculto");
  _idHeroiExpAtual = null;
}

function confirmarExpHeroi() {
  const heroi = partyHerois.find(h => h.id === _idHeroiExpAtual);
  if (!heroi) { fecharModalExpHeroi(); return; }

  const valorAdicionado = parseInt(document.getElementById("exp-heroi-adicionar").value) || 0;
  const metaAntiga = heroi.expMeta || 1000;
  const novaMeta   = parseInt(document.getElementById("exp-heroi-meta").value) || metaAntiga;
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
  document.getElementById("monstro-nome").value = "";
  document.getElementById("monstro-hp").value   = "10";
  document.getElementById("monstro-nd").value   = "";
  document.getElementById("modal-monstro").classList.remove("oculto");
  document.getElementById("monstro-nome").focus();
}

function abrirModalMonstrosLista() {
  const modal = document.getElementById("modal-monstros-lista");
  const busca = document.getElementById("busca-monstros");
  if (modal) modal.classList.remove("oculto");
  if (busca) {
    renderizarColetanea(busca.value || "");
    setTimeout(() => busca.focus(), 0);
  }
}

function fecharModalMonstrosLista() {
  const modal = document.getElementById("modal-monstros-lista");
  if (modal) modal.classList.add("oculto");
}

function fecharModalMonstro() {
  document.getElementById("modal-monstro").classList.add("oculto");
}

function confirmarNovoMonstro() {
  const nome = document.getElementById("monstro-nome").value.trim();
  if (!nome) { document.getElementById("monstro-nome").focus(); return; }

  const novoMonstro = {
    id:      "mc_" + Date.now(),
    nome,
    vidaMax: parseInt(document.getElementById("monstro-hp").value) || 10,
    ca:      document.getElementById("monstro-nd").value.trim() || "?",
    custom:  true
  };

  monstrosCustom.push(novoMonstro);
  localStorage.setItem("monstrosCustomRPG", JSON.stringify(monstrosCustom));
  fecharModalMonstro();

  const inputBusca = document.getElementById("busca-monstros");
  renderizarColetanea(inputBusca ? inputBusca.value : "");
}

function deletarMonstroCustom(id) {
  if (!confirm("Deseja remover este monstro da coletânea?")) return;
  monstrosCustom = monstrosCustom.filter(m => m.id !== id);
  localStorage.setItem("monstrosCustomRPG", JSON.stringify(monstrosCustom));

  const inputBusca = document.getElementById("busca-monstros");
  renderizarColetanea(inputBusca ? inputBusca.value : "");
}


function adicionarIniciativaDeMonstro(monstro) {
  // Monta o nome já com a letra (A, B, C…) antes de abrir o modal
  const quantidadeExistente = listaDeIniciativa.filter(c => c.nomeBase === monstro.nome).length;
  const letra = String.fromCharCode(65 + quantidadeExistente);
  const nomeCompleto = `${monstro.nome} ${letra}`;

  _contextoIniciativa = {
    tipo:        "monstro",
    monstro,
    nomeCompleto
  };

  abrirModalIniciativa(`Combate — ${nomeCompleto}`);
}

let _idHeroiIniciativaAtual = null;
// Contexto completo do modal (herói ou monstro)
let _contextoIniciativa = null;

function lancarIniciativaHeroi(idHeroi) {
  const heroiBase = partyHerois.find(h => h.id === idHeroi);
  if (!heroiBase) return;

  _idHeroiIniciativaAtual = idHeroi;
  _contextoIniciativa = {
    tipo:   "heroi",
    idHeroi
  };

  abrirModalIniciativa(`Combate — ${heroiBase.nome}`);
}

function abrirModalIniciativa(titulo) {
  document.getElementById("modal-iniciativa-titulo").textContent = titulo;
  document.getElementById("ini-modificador").value = "0";
  document.getElementById("ini-valor-manual").value = "";
  document.getElementById("ini-resultado-display").classList.add("oculto");

  const valorDisplay = document.getElementById("ini-dado-valor");
  valorDisplay.textContent = "—";
  valorDisplay.className   = "ini-dado-valor";

  document.getElementById("modal-iniciativa").classList.remove("oculto");
  document.getElementById("ini-modificador").focus();
}

function fecharModalIniciativa() {
  document.getElementById("modal-iniciativa").classList.add("oculto");
  _idHeroiIniciativaAtual = null;
  _contextoIniciativa     = null;
}

function rolarIniciativaModal() {
  const modificador    = parseInt(document.getElementById("ini-modificador").value) || 0;
  const dado           = Math.floor(Math.random() * 20) + 1;
  const total          = dado + modificador;
  const valorDisplay   = document.getElementById("ini-dado-valor");
  const formulaDisplay = document.getElementById("ini-formula");

  valorDisplay.textContent = total;
  valorDisplay.className   = "ini-dado-valor";
  if (dado === 20) valorDisplay.classList.add("critico");
  if (dado === 1)  valorDisplay.classList.add("falha");

  const sinal = modificador >= 0 ? "+" : "";
  formulaDisplay.textContent = `(d20: ${dado} ${sinal}${modificador})`;
  document.getElementById("ini-resultado-display").classList.remove("oculto");
  document.getElementById("ini-valor-manual").value = total;
}

function confirmarIniciativaModal() {
  const valor = parseInt(document.getElementById("ini-valor-manual").value);
  if (isNaN(valor)) { document.getElementById("ini-valor-manual").focus(); return; }

  const ctx = _contextoIniciativa;
  if (!ctx) return;

  if (ctx.tipo === "heroi") {
    const heroiBase = partyHerois.find(h => h.id === ctx.idHeroi);
    if (!heroiBase) return;

    const entradaAnterior = listaDeIniciativa.find(c => c.idHeroi === ctx.idHeroi);
    const condicoes = entradaAnterior ? entradaAnterior.condicoes : [];
    const jaEstava  = !!entradaAnterior;

    listaDeIniciativa = listaDeIniciativa.filter(c => c.idHeroi !== ctx.idHeroi);
    listaDeIniciativa.push({
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
    listaDeIniciativa.push(entradaMonstro);

    const caTxt = ctx.monstro.ca ? ` | CA: ${ctx.monstro.ca}` : "";
    adicionarHistorico(`⚔️ ${ctx.nomeCompleto} entrou no combate! (Ini: ${valor} | HP: ${ctx.monstro.vidaMax}${caTxt})`);
  }

  fecharModalIniciativa();
  salvarESincronizar();
}

function removerHeroi(idHeroi) {
  if (!confirm("Deseja realmente remover este herói da party?")) return;
  partyHerois       = partyHerois.filter(h => h.id !== idHeroi);
  listaDeIniciativa = listaDeIniciativa.filter(c => c.idHeroi !== idHeroi);
  salvarESincronizar();
}

/** Remove um combatente individual da iniciativa (ex.: monstro morto) */
function removerDaIniciativa(id) {
  const idx = listaDeIniciativa.findIndex(c => c.id === id);
  if (idx === -1) return;
  listaDeIniciativa.splice(idx, 1);
  // Se o turno ativo estava depois do removido, recua um passo
  if (turnoAtivo >= listaDeIniciativa.length) turnoAtivo = 0;
  salvarESincronizar();
}

function sincronizarHP(id, novoValor) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
  if (!criatura) return;
  criatura.hpAtual = parseInt(novoValor) || 0;
  salvarESincronizar();
}

function sincronizarVidaTudo(idHeroi, novoValor) {
  const itemIni = listaDeIniciativa.find(c => c.idHeroi === idHeroi);
  if (itemIni) itemIni.hpAtual = parseInt(novoValor) || 0;
  salvarESincronizar();
}

/* ==========================================================================
   MODAL DE DURAÇÃO DE CONDIÇÃO
   ========================================================================== */
let _condicaoCtx = null; // { criaturaId, condicaoId }

function abrirModalCondicaoDuracao(criaturaId, condicaoId) {
  const criatura = listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;

  const cond     = CONDICOES.find(c => c.id === condicaoId);
  const jaAtiva  = (criatura.condicoes || []).find(c => c.id === condicaoId);

  // Se já está ativa, remove direto sem abrir modal
  if (jaAtiva) {
    removerCondicao(criaturaId, condicaoId);
    return;
  }

  _condicaoCtx = { criaturaId, condicaoId };
  document.getElementById("modal-condicao-titulo").textContent = `${cond.emoji} ${cond.label} — ${criatura.nome}`;
  document.getElementById("condicao-turnos").value = "1";
  document.getElementById("modal-condicao-duracao").classList.remove("oculto");
  document.getElementById("condicao-turnos").focus();
}

function fecharModalCondicaoDuracao() {
  document.getElementById("modal-condicao-duracao").classList.add("oculto");
  _condicaoCtx = null;

  // Se o popover de condições do turno estava aberto (e só escondido para dar
  // lugar a este modal), reexibe ele já atualizado para escolher outra condição.
  if (_popoverCondicaoTurno && document.body.contains(_popoverCondicaoTurno)) {
    const atual = listaDeIniciativa[turnoAtivo];
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
  const criatura = listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;
  if (!criatura.condicoes) criatura.condicoes = [];

  const turnosVal = document.getElementById("condicao-turnos").value.trim();
  const turnos    = turnosVal !== "" ? parseInt(turnosVal) || 1 : null; // null = indefinido
  const cond      = CONDICOES.find(c => c.id === condicaoId);

  criatura.condicoes.push({ id: condicaoId, turnos });

  const duracaoTxt = turnos ? `${turnos} turno${turnos > 1 ? "s" : ""}` : "indefinido";
  adicionarHistorico(`${cond.emoji} ${criatura.nome} recebeu: ${cond.label} (${duracaoTxt})`, "condicao");

  fecharModalCondicaoDuracao();
  salvarESincronizar();
}

function removerCondicao(criaturaId, condicaoId) {
  const criatura = listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;
  const cond = CONDICOES.find(c => c.id === condicaoId);
  criatura.condicoes = (criatura.condicoes || []).filter(c => c.id !== condicaoId);
  adicionarHistorico(`✅ ${criatura.nome} se recuperou de: ${cond.label}`, "sucesso");
  salvarESincronizar();
}

/** Decrementa turnos de condições ao virar turno */
function decrementarCondicoes() {
  listaDeIniciativa.forEach(criatura => {
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
  const criatura = listaDeIniciativa.find(c => c.id === id);
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
  if (listaDeIniciativa.length === 0) {
    alert("Não há combatentes no combate!");
    return;
  }

  // Reseta campos
  document.getElementById("area-nome-habilidade").value = "";
  document.getElementById("area-qtd").value          = "1";
  document.getElementById("area-tipo").value         = "8";
  document.getElementById("area-modificador").value  = "0";
  document.getElementById("area-valor-manual").value = "";
  document.getElementById("area-resultado").textContent  = "—";
  document.getElementById("area-resultado").className    = "modal-dano-valor modal-dano-valor--dano";
  document.getElementById("area-formula").textContent    = "";

  renderizarAlvosArea();
  document.getElementById("modal-area").classList.remove("oculto");
}

function fecharModalArea() {
  document.getElementById("modal-area").classList.add("oculto");
}

/** Renderiza uma lista de combatentes com checkbox (usada em Área, Acerto e Dano) */
function renderizarListaAlvos(containerId, { preSelecionados = [], mostrarCA = false } = {}) {
  const lista = document.getElementById(containerId);
  lista.innerHTML = "";
  const preSet = new Set(preSelecionados.map(String));

  listaDeIniciativa.forEach(c => {
    const row = document.createElement("label");
    row.className = "area-alvo-row" + (c.morto ? " area-alvo-morto" : "");

    const cb = document.createElement("input");
    cb.type    = "checkbox";
    cb.value   = c.id;
    cb.checked = preSet.has(String(c.id));
    cb.className = "area-alvo-cb";

    const corHeroi = (() => {
      if (!c.idHeroi) return null;
      const h   = partyHerois.find(h => h.id === c.idHeroi);
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
    preSelecionados: listaDeIniciativa.filter(c => !c.morto).map(c => c.id),
  });
}

function rolarDadoArea() {
  const qtd  = parseInt(document.getElementById("area-qtd").value)         || 1;
  const lados = parseInt(document.getElementById("area-tipo").value)        || 8;
  const mod   = parseInt(document.getElementById("area-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total = Math.max(0, soma + mod);

  document.getElementById("area-resultado").textContent = total;
  const sinal = mod >= 0 ? "+" : "";
  document.getElementById("area-formula").textContent = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;
  document.getElementById("area-valor-manual").value  = total;
}

function confirmarDanoArea() {
  const valor = parseInt(document.getElementById("area-valor-manual").value);
  if (isNaN(valor) || valor < 0) {
    document.getElementById("area-valor-manual").focus(); return;
  }

  const selecionados = [...document.querySelectorAll("#area-alvos-lista .area-alvo-cb:checked")].map(cb => cb.value);
  if (selecionados.length === 0) {
    alert("Selecione pelo menos um alvo!"); return;
  }

  const nomes = [];
  selecionados.forEach(id => {
    const c = listaDeIniciativa.find(x => x.id == id);
    if (!c) return;
    const antes = c.hpAtual;
    c.hpAtual = Math.max(0, c.hpAtual - valor);
    nomes.push(`${c.nome} (${antes}→${c.hpAtual})`);
    if (c.hpAtual === 0 && !c.morto) processarHPZero(c);
  });

  const nomeHabilidade = document.getElementById("area-nome-habilidade").value.trim();
  const rotulo = nomeHabilidade || "Dano em área";
  adicionarHistorico(`💥 ${rotulo} (${valor}): ${nomes.join(", ")}`, "falha");
  fecharModalArea();
  salvarESincronizar();
}

/* ==========================================================================
   CURA EM ÁREA
   ========================================================================== */
function abrirModalCuraArea() {
  if (listaDeIniciativa.length === 0) {
    alert("Não há combatentes no combate!");
    return;
  }

  // Curador — pré-seleciona o ativo do turno, mas pode ser trocado
  const sel   = document.getElementById("cura-area-curador");
  sel.innerHTML = "";
  const ativo = listaDeIniciativa[turnoAtivo];
  listaDeIniciativa.filter(c => !c.morto).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nome;
    if (ativo && c.id === ativo.id) opt.selected = true;
    sel.appendChild(opt);
  });

  document.getElementById("cura-area-qtd").value          = "1";
  document.getElementById("cura-area-tipo").value         = "8";
  document.getElementById("cura-area-modificador").value  = "0";
  document.getElementById("cura-area-valor-manual").value = "";
  document.getElementById("cura-area-resultado").textContent = "—";
  document.getElementById("cura-area-formula").textContent   = "";

  renderizarListaAlvos("cura-area-alvos-lista", {
    preSelecionados: listaDeIniciativa.filter(c => !c.morto).map(c => c.id),
  });

  document.getElementById("modal-cura-area").classList.remove("oculto");
}

function fecharModalCuraArea() {
  document.getElementById("modal-cura-area").classList.add("oculto");
}

function rolarDadoCuraArea() {
  const qtd   = parseInt(document.getElementById("cura-area-qtd").value)         || 1;
  const lados = parseInt(document.getElementById("cura-area-tipo").value)        || 8;
  const mod   = parseInt(document.getElementById("cura-area-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total = Math.max(0, soma + mod);

  document.getElementById("cura-area-resultado").textContent = total;
  const sinal = mod >= 0 ? "+" : "";
  document.getElementById("cura-area-formula").textContent = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;
  document.getElementById("cura-area-valor-manual").value   = total;
}

function confirmarCuraArea() {
  const valor = parseInt(document.getElementById("cura-area-valor-manual").value);
  if (isNaN(valor) || valor < 0) {
    document.getElementById("cura-area-valor-manual").focus(); return;
  }

  const selecionados = [...document.querySelectorAll("#cura-area-alvos-lista .area-alvo-cb:checked")]
    .map(cb => listaDeIniciativa.find(c => c.id == cb.value))
    .filter(Boolean);
  if (selecionados.length === 0) {
    alert("Selecione pelo menos um alvo!"); return;
  }

  const sel       = document.getElementById("cura-area-curador");
  const curadorId = sel ? sel.value : null;
  const curador   = curadorId ? listaDeIniciativa.find(c => c.id == curadorId) : null;

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
  const atacante = listaDeIniciativa.find(c => c.id === atacanteId);
  if (!atacante) return;

  _acertoAtacanteId = atacanteId;

  document.getElementById("modal-acerto-titulo").textContent = `🎯 Acerto — ${atacante.nome}`;
  document.getElementById("acerto-atacante-info").innerHTML  = `⚔️ Atacante: <strong>${atacante.nome}</strong>`;

  // Lista de alvos — nada pré-selecionado, o mestre escolhe quem é atacado
  renderizarListaAlvos("acerto-alvos-lista", { mostrarCA: true });

  // Reseta campos
  document.getElementById("acerto-qtd").value         = "1";
  document.getElementById("acerto-tipo").value        = "20";
  document.getElementById("acerto-modificador").value = "0";
  document.getElementById("acerto-resultado-wrap").style.display  = "none";
  document.getElementById("acerto-resultado-display").innerHTML   = "";
  document.getElementById("acerto-resultado-alvos").innerHTML     = "";

  document.getElementById("modal-acerto").classList.remove("oculto");
  document.getElementById("acerto-modificador").focus();
}

function fecharModalAcerto() {
  document.getElementById("modal-acerto").classList.add("oculto");
  _acertoAtacanteId = null;
}

function alvosSelecionadosAcerto() {
  return [...document.querySelectorAll("#acerto-alvos-lista .area-alvo-cb:checked")]
    .map(cb => listaDeIniciativa.find(c => c.id == cb.value))
    .filter(Boolean);
}

function rolarAcerto() {
  const qtd   = parseInt(document.getElementById("acerto-qtd").value)         || 1;
  const lados = parseInt(document.getElementById("acerto-tipo").value)        || 20;
  const mod   = parseInt(document.getElementById("acerto-modificador").value) || 0;

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

  const wrap        = document.getElementById("acerto-resultado-wrap");
  const display      = document.getElementById("acerto-resultado-display");
  const alvosDisplay = document.getElementById("acerto-resultado-alvos");
  wrap.style.display = "block";

  let badgeGeral = "";
  if (critico)           badgeGeral = `<span class="acerto-badge acerto-badge--critico">⚔️ Crítico!</span>`;
  else if (falhaCritica) badgeGeral = `<span class="acerto-badge acerto-badge--falha">💀 Falha Crítica!</span>`;

  display.innerHTML = `
    <div class="acerto-total ${critico ? "acerto-total--critico" : falhaCritica ? "acerto-total--falha" : ""}">${total}</div>
    <div class="acerto-formula">${formula}</div>
    ${badgeGeral}
  `;

  const atacante     = listaDeIniciativa.find(c => c.id === _acertoAtacanteId);
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

  if (!isDano && !listaDeIniciativa.find(c => c.id === idsArr[0])) return;

  _modalDanoCuraIds  = idsArr;
  _modalDanoCuraTipo = tipo;

  document.getElementById("modal-dano-resultado").textContent = "—";
  document.getElementById("modal-dano-resultado").className   = "modal-dano-valor";
  document.getElementById("modal-dano-formula-txt").textContent = "";
  document.getElementById("modal-dano-modificador").value     = "0";
  document.getElementById("modal-dano-manual").value          = "";
  document.getElementById("modal-dano-qtd").value             = "1";
  document.getElementById("modal-dano-tipo").value            = "20";
  document.getElementById("btn-confirmar-dano").textContent   = isDano ? "⚔️ Aplicar Dano" : "💊 Aplicar Cura";
  document.getElementById("btn-confirmar-dano").className     = isDano ? "btn-confirmar btn-confirmar-dano" : "btn-confirmar btn-confirmar-cura";

  const tituloEl  = document.getElementById("modal-dano-titulo");
  const hpAtualEl = document.getElementById("modal-dano-hp-atual");
  const alvosWrap = document.getElementById("modal-dano-alvos-wrap");

  if (isDano) {
    tituloEl.textContent    = "⚔️ Dano";
    hpAtualEl.style.display = "none";
    alvosWrap.style.display = "block";
    // Alvo(s) já escolhidos na etapa de acerto vêm pré-selecionados; pode-se ajustar aqui
    renderizarListaAlvos("modal-dano-alvos-lista", { preSelecionados: idsArr, mostrarCA: true });
  } else {
    const criatura = listaDeIniciativa.find(c => c.id === idsArr[0]);
    tituloEl.textContent    = `💊 Cura — ${criatura.nome}`;
    hpAtualEl.textContent   = `HP atual: ${criatura.hpAtual} / ${criatura.hpMax}`;
    hpAtualEl.style.display = "block";
    alvosWrap.style.display = "none";
  }

  // Seletor de atacante — por padrão o ativo do turno, mas pode ser trocado
  // (ex.: o alvo tomou um ataque de oportunidade de outro combatente)
  const atacanteWrap = document.getElementById("modal-dano-atacante-wrap");
  if (isDano) {
    atacanteWrap.style.display = "block";
    const sel = document.getElementById("modal-dano-atacante");
    sel.innerHTML = "";
    const ativo = listaDeIniciativa[turnoAtivo];
    listaDeIniciativa.filter(c => !c.morto).forEach(c => {
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
  const previa = document.getElementById("modal-dano-previa");
  previa.style.display = "none";
  previa.innerHTML = "";

  const btnMortoModal = document.getElementById("btn-morto-modal");
  if (isDano) {
    const unico = idsArr.length === 1 ? listaDeIniciativa.find(c => c.id === idsArr[0]) : null;
    btnMortoModal.style.display = unico ? "block" : "none";
    if (unico) {
      btnMortoModal.textContent = unico.morto ? "💚 Reviver" : "☠️ Marcar como Morto";
      btnMortoModal.className   = unico.morto ? "btn-morto-modal btn-morto-modal--reviver" : "btn-morto-modal";
    }
  } else {
    const criatura = listaDeIniciativa.find(c => c.id === idsArr[0]);
    btnMortoModal.style.display = "block";
    btnMortoModal.textContent   = criatura.morto ? "💚 Reviver" : "☠️ Marcar como Morto";
    btnMortoModal.className     = criatura.morto ? "btn-morto-modal btn-morto-modal--reviver" : "btn-morto-modal";
  }

  const aviso = document.getElementById("modal-dano-aviso");
  if (aviso) aviso.style.display = isDano ? "none" : "block";

  document.getElementById("modal-dano-cura").classList.remove("oculto");
  document.getElementById("modal-dano-modificador").focus();
}

function fecharModalDanoCura() {
  document.getElementById("modal-dano-cura").classList.add("oculto");
  _modalDanoCuraIds  = [];
  _modalDanoCuraTipo = null;
}

function alvosSelecionadosDano() {
  return [...document.querySelectorAll("#modal-dano-alvos-lista .area-alvo-cb:checked")]
    .map(cb => listaDeIniciativa.find(c => c.id == cb.value))
    .filter(Boolean);
}

function atualizarPrevia() {
  const valor  = parseInt(document.getElementById("modal-dano-manual").value);
  const previa = document.getElementById("modal-dano-previa");
  if (isNaN(valor) || valor < 0) { previa.style.display = "none"; return; }

  const isDano = _modalDanoCuraTipo === "dano";

  if (isDano) {
    const alvos = alvosSelecionadosDano();
    if (alvos.length === 0) { previa.style.display = "none"; return; }

    const sel        = document.getElementById("modal-dano-atacante");
    const atacanteId = sel ? sel.value : null;
    const atacante   = atacanteId ? listaDeIniciativa.find(c => c.id == atacanteId) : null;

    previa.innerHTML = alvos.map(criatura => {
      const hpFinal = Math.max(0, criatura.hpAtual - valor);
      const prefixo = atacante ? `${atacante.nome} → ${criatura.nome}` : criatura.nome;
      return `<div class="previa-dano-linha"><span class="previa-ataque">${prefixo}</span><span class="previa-dano">-${valor}</span><span class="previa-hp">${criatura.hpAtual} → ${hpFinal} HP</span></div>`;
    }).join("");
    previa.className = "modal-dano-previa modal-dano-previa--dano";
  } else {
    const criatura = listaDeIniciativa.find(c => c.id === _modalDanoCuraIds[0]);
    if (!criatura) { previa.style.display = "none"; return; }
    const hpFinal = Math.min(criatura.hpMax, criatura.hpAtual + valor);
    previa.innerHTML = `<span class="previa-ataque">${criatura.nome}</span><span class="previa-cura">+${valor}</span><span class="previa-hp">${criatura.hpAtual} → ${hpFinal} HP</span>`;
    previa.className = "modal-dano-previa modal-dano-previa--cura";
  }

  previa.style.display = "flex";
}

function rolarDadoModal() {
  const quantidade  = parseInt(document.getElementById("modal-dano-qtd").value)  || 1;
  const lados       = parseInt(document.getElementById("modal-dano-tipo").value)  || 20;
  const modificador = parseInt(document.getElementById("modal-dano-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < quantidade; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r;
    rolagens.push(r);
  }
  const total = Math.max(0, soma + modificador);

  const display = document.getElementById("modal-dano-resultado");
  display.textContent = total;
  display.className   = "modal-dano-valor " + (_modalDanoCuraTipo === "dano" ? "modal-dano-valor--dano" : "modal-dano-valor--cura");

  const sinal = modificador >= 0 ? "+" : "";
  document.getElementById("modal-dano-formula-txt").textContent = `(${quantidade}d${lados}: [${rolagens.join(", ")}] ${sinal}${modificador})`;
  document.getElementById("modal-dano-manual").value = total;
  atualizarPrevia();
}

function confirmarDanoCura() {
  const valor = parseInt(document.getElementById("modal-dano-manual").value);
  if (isNaN(valor) || valor < 0) { document.getElementById("modal-dano-manual").focus(); return; }

  const isDano = _modalDanoCuraTipo === "dano";

  if (isDano) {
    const alvos = alvosSelecionadosDano();
    if (alvos.length === 0) return;

    const sel         = document.getElementById("modal-dano-atacante");
    const atacanteId  = sel ? sel.value : null;
    const atacante    = atacanteId ? listaDeIniciativa.find(c => c.id == atacanteId) : null;
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
    const criatura = listaDeIniciativa.find(c => c.id === _modalDanoCuraIds[0]);
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

/* ==========================================================================
   5b. RASTREADOR DE EFEITOS TEMPORÁRIOS
   ========================================================================== */
function abrirFormEfeito() {
  document.getElementById("turno-efeito-form").classList.remove("oculto");
  document.getElementById("efeito-nome").value   = "";
  document.getElementById("efeito-turnos").value = "1";
  document.getElementById("efeito-nome").focus();
}

function fecharFormEfeito() {
  document.getElementById("turno-efeito-form").classList.add("oculto");
}

function confirmarEfeito() {
  const nome   = document.getElementById("efeito-nome").value.trim();
  const turnos = parseInt(document.getElementById("efeito-turnos").value) || 1;
  if (!nome) { document.getElementById("efeito-nome").focus(); return; }

  efeitosTemporarios.push({ id: "ef_" + Date.now(), nome, turnos });
  adicionarHistorico(`⏳ Efeito adicionado: "${nome}" (${turnos} turno${turnos > 1 ? "s" : ""})`);
  fecharFormEfeito();
  salvarESincronizar();
}

function removerEfeito(id) {
  const ef = efeitosTemporarios.find(e => e.id === id);
  if (ef) adicionarHistorico(`🗑️ Efeito removido: "${ef.nome}"`);
  efeitosTemporarios = efeitosTemporarios.filter(e => e.id !== id);
  salvarESincronizar();
}

function renderizarEfeitos() {
  const lista = document.getElementById("turno-efeitos-lista");
  if (!lista) return;
  lista.innerHTML = "";

  if (efeitosTemporarios.length === 0) {
    lista.innerHTML = `<p class="efeitos-vazio">Nenhum efeito ativo.</p>`;
    return;
  }

  efeitosTemporarios.forEach(ef => {
    const urgente = ef.turnos === 1;
    const item = document.createElement("div");
    item.className = "efeito-item" + (urgente ? " efeito-item--urgente" : "");

    const info = document.createElement("div");
    info.className = "efeito-info";

    const nome = document.createElement("span");
    nome.className   = "efeito-nome";
    nome.textContent = ef.nome;

    const turnos = document.createElement("span");
    turnos.className   = "efeito-turnos";
    turnos.textContent = `${ef.turnos} turno${ef.turnos > 1 ? "s" : ""}`;

    info.appendChild(nome);
    info.appendChild(turnos);

    const btnDel = document.createElement("button");
    btnDel.textContent = "✕";
    btnDel.className   = "efeito-btn-del";
    btnDel.title       = "Remover efeito";
    btnDel.addEventListener("click", () => removerEfeito(ef.id));

    item.appendChild(info);
    item.appendChild(btnDel);
    lista.appendChild(item);
  });
}


function proximoTurno() {
  if (listaDeIniciativa.length === 0) return;

  const vivos = listaDeIniciativa.filter(c => !c.morto);
  if (vivos.length === 0) return;

  // Avança e pula mortos
  let tentativas = 0;
  do {
    turnoAtivo++;
    if (turnoAtivo >= listaDeIniciativa.length) {
      turnoAtivo = 0;
      turnoAtual++;
      adicionarHistorico(`🔄 Turno ${turnoAtual} iniciado!`, "turno");
      decrementarCondicoes();
      efeitosTemporarios = efeitosTemporarios.map(e => ({ ...e, turnos: e.turnos - 1 }));
      efeitosTemporarios.forEach(e => {
        if (e.turnos <= 0) adicionarHistorico(`⏰ Efeito expirado: "${e.nome}"`, "falha");
        else if (e.turnos === 1) adicionarHistorico(`⚠️ "${e.nome}" expira no próximo turno!`);
      });
      efeitosTemporarios = efeitosTemporarios.filter(e => e.turnos > 0);
    }
    tentativas++;
  } while (listaDeIniciativa[turnoAtivo]?.morto && tentativas < listaDeIniciativa.length);

  salvarESincronizar();
}

function turnoAnterior() {
  if (listaDeIniciativa.length === 0) return;
  turnoAtivo = (turnoAtivo - 1 + listaDeIniciativa.length) % listaDeIniciativa.length;
  salvarESincronizar();
}

/* ==========================================================================
   BOTÕES DE AÇÃO DO PAINEL DE TURNO
   ========================================================================== */
function abrirTurnoAcaoAtaque() {
  const atual = listaDeIniciativa[turnoAtivo];
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
      if (document.getElementById("modal-condicao-duracao").classList.contains("oculto")) {
        renderizarOpcoesPopoverCondicao(popover, criatura);
      } else {
        popover.style.display = "none";
      }
    });
    popover.appendChild(opcao);
  });
}

function abrirTurnoAcaoCondicao() {
  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;

  // Remove popover anterior se existir
  const popoverAnterior = document.getElementById("turno-condicoes-popover");
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
  const btnCondicao = document.getElementById("btn-turno-condicao");
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
  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;
  abrirModalDanoCura([atual.id], "cura");
}

/** Botão de morte/nocaute: herói vai a nocauteado, monstro vai a morto. Clicar de novo reverte. */
function alternarMortoNocaute(id) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
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
  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;
  alternarMortoNocaute(atual.id);
}

function atualizarPainelTurno() {
  const combateTurnoEl = document.getElementById("combate-turno-num");
  const linhaEl = document.getElementById("turno-ativo-linha");
  const cardEl  = document.getElementById("turno-ativo-card");
  const condCardEl = document.getElementById("turno-ativo-condicoes-card");
  const vazioEl = document.getElementById("turno-vazio-msg");
  const acoesEl = document.getElementById("turno-ativo-acoes");

  if (combateTurnoEl) combateTurnoEl.textContent = turnoAtual;

  if (listaDeIniciativa.length === 0) {
    if (linhaEl)    linhaEl.classList.add("oculto");
    if (cardEl)     cardEl.innerHTML = "";
    if (condCardEl) condCardEl.innerHTML = "";
    if (vazioEl) vazioEl.style.display = "block";
    if (acoesEl) { acoesEl.classList.add("oculto"); acoesEl.innerHTML = ""; }
    renderizarCondicoesAtivas();
    return;
  }

  if (linhaEl) linhaEl.classList.remove("oculto");
  if (vazioEl) vazioEl.style.display = "none";
  if (acoesEl) acoesEl.classList.remove("oculto");

  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;

  // Limpa o card ativo para reconstruí-lo idêntico ao painel de combate
  cardEl.innerHTML = "";

  // Coleta dados visuais (Cor e CA)
  const corHeroi = (() => {
    if (!atual.idHeroi) return null;
    const h = partyHerois.find(h => h.id === atual.idHeroi);
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
  btnMorto.textContent = "☠️";
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

  renderizarCondicoesAtivas();
}

/** Lista todas as condições ativas de todos os combatentes no painel de turno */
function renderizarCondicoesAtivas() {
  const lista = document.getElementById("turno-efeitos-lista");
  if (!lista) return;
  lista.innerHTML = "";

  // Coleta todas as condições com turnos definidos de todos os combatentes
  const todasCondicoes = [];
  listaDeIniciativa.forEach(criatura => {
    (criatura.condicoes || []).forEach(condObj => {
      const cond = CONDICOES.find(c => c.id === condObj.id);
      if (cond) todasCondicoes.push({ criatura, condObj, cond });
    });
  });

  if (todasCondicoes.length === 0) {
    lista.innerHTML = `<p class="efeitos-vazio">Nenhuma condição ativa.</p>`;
    return;
  }

  todasCondicoes.forEach(({ criatura, condObj, cond }) => {
    const urgente = condObj.turnos === 1;
    const item    = document.createElement("div");
    item.className = "efeito-item" + (urgente ? " efeito-item--urgente" : "");

    const info = document.createElement("div");
    info.className = "efeito-info";

    const nomeCond = document.createElement("span");
    nomeCond.className   = "efeito-nome";
    nomeCond.textContent = `${cond.emoji} ${cond.label}`;

    const sub = document.createElement("span");
    sub.className = "efeito-turnos";
    sub.textContent = condObj.turnos !== null
      ? `${criatura.nome} · ${condObj.turnos} turno${condObj.turnos > 1 ? "s" : ""}`
      : `${criatura.nome} · indefinido`;

    info.appendChild(nomeCond);
    info.appendChild(sub);

    const btnDel = document.createElement("button");
    btnDel.textContent = "✕";
    btnDel.className   = "efeito-btn-del";
    btnDel.title       = "Remover condição";
    btnDel.addEventListener("click", () => removerCondicao(criatura.id, cond.id));

    item.appendChild(info);
    item.appendChild(btnDel);
    lista.appendChild(item);
  });
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
    const h = partyHerois.find(h => h.id === criatura.idHeroi);
    return h?.ca ?? null;
  }
  if (criatura.idMonstroCustom) {
    const mc = monstrosCustom.find(m => m.id === criatura.idMonstroCustom);
    if (mc) return mc.ca ?? null;
  }
  const m = coletaneaMonstros.find(m => m.nome === criatura.nomeBase);
  return m?.ca ?? null;
}

function atualizarIniciativa() {
  listaDeIniciativa.sort((a, b) => b.valor - a.valor);
  const container = document.getElementById("lista-iniciativa-conteudo");
  if (!container) return;
  container.innerHTML = "";

  // Garante que turnoAtivo não aponte para fora dos limites
  if (listaDeIniciativa.length > 0 && turnoAtivo >= listaDeIniciativa.length) turnoAtivo = 0;

  listaDeIniciativa.forEach((personagem, index) => {
    const ativo      = index === turnoAtivo && listaDeIniciativa.length > 0;
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
      const h   = partyHerois.find(h => h.id === personagem.idHeroi);
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
    btnMortoCombate.textContent = "☠️";
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
  const lista = document.getElementById("ordem-iniciativa-lista");
  if (!lista) return;
  lista.innerHTML = "";

  listaDeIniciativa.forEach((personagem, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "ordem-iniciativa-chip" + (index === turnoAtivo ? " ordem-iniciativa-chip--ativa" : "");
    chip.textContent = personagem.valor;
    chip.title = personagem.nome;
    chip.addEventListener("click", () => {
      turnoAtivo = index;
      salvarESincronizar();
    });
    lista.appendChild(chip);
  });
}

/* ==========================================================================
   7. RENDERIZAÇÃO — STATUS DO GRUPO
   ========================================================================== */
function renderizarStatusGrupo() {
  const container = document.getElementById("conteudo-status-grupo");
  if (!container) return;
  container.innerHTML = "";

  partyHerois.forEach(heroi => {
    const naIni    = listaDeIniciativa.find(c => c.idHeroi === heroi.id);
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
  const container = document.getElementById("conteudo-monstros");
  if (!container) return;
  container.innerHTML = "";

  const termo = filtro.toLowerCase().trim();

  const listaCompleta = [
    ...monstrosCustom,
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
  listaDeIniciativa  = [];
  turnoAtivo         = 0;
  turnoAtual         = 1;
  efeitosTemporarios = [];
  adicionarHistorico("🏳️ Combate encerrado!");
  salvarESincronizar();
}

function selecionarDado(lados) {
  dadoSelecionado = lados;
  document.querySelectorAll(".botoes-dados button").forEach(b => {
    b.classList.toggle("selecionado", Number(b.dataset.dado) === lados);
  });
}

function rolarDadoSelecionado() {
  rolarDado(dadoSelecionado);
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
  document.getElementById("modal-acao-rapida-titulo").textContent = `${emoji} ${nomeAcao}`;
  document.getElementById("acao-rapida-modificador").value = "0";
  document.getElementById("modal-acao-rapida").classList.remove("oculto");
  document.getElementById("acao-rapida-modificador").focus();
  document.getElementById("acao-rapida-modificador").select();
}

function fecharModalAcaoRapida() {
  document.getElementById("modal-acao-rapida").classList.add("oculto");
  _acaoRapidaCtx = null;
}

function confirmarAcaoRapida() {
  if (!_acaoRapidaCtx) return;
  const { nomeAcao, emoji, tipoHistorico } = _acaoRapidaCtx;
  const modificador = parseInt(document.getElementById("acao-rapida-modificador").value) || 0;
  rolarAcaoRapida(nomeAcao, emoji, modificador, tipoHistorico);
  fecharModalAcaoRapida();
}

function abrirModalEvento() {
  const sel = document.getElementById("evento-personagem");
  sel.innerHTML = "";

  const nomes = new Set();
  partyHerois.forEach(h => nomes.add(h.nome));
  listaDeIniciativa.forEach(c => nomes.add(c.nome));

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

  document.getElementById("evento-acao").value = "";
  document.getElementById("evento-qtd").value = "1";
  document.getElementById("evento-tipo").value = "20";
  document.getElementById("evento-modificador").value = "0";

  atualizarPreviaEvento();
  document.getElementById("modal-evento").classList.remove("oculto");
  document.getElementById("evento-acao").focus();
}

function fecharModalEvento() {
  document.getElementById("modal-evento").classList.add("oculto");
}

function atualizarPreviaEvento(resultado = null) {
  const personagem = document.getElementById("evento-personagem").value || "Alguém";
  const acao       = document.getElementById("evento-acao").value.trim();
  const previa     = document.getElementById("evento-previa");

  let html = `<span class="previa-ataque">${personagem}${acao ? " " + acao : ""}</span>`;
  if (resultado !== null) html += `<span class="previa-evento-resultado">${resultado}</span>`;
  previa.innerHTML = html;
}

function rolarEvento() {
  const qtd   = parseInt(document.getElementById("evento-qtd").value)         || 1;
  const lados = parseInt(document.getElementById("evento-tipo").value)        || 20;
  const mod   = parseInt(document.getElementById("evento-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total = soma + mod;

  atualizarPreviaEvento(total);

  const personagem = document.getElementById("evento-personagem").value || "Alguém";
  const acao       = document.getElementById("evento-acao").value.trim();
  const sinal      = mod >= 0 ? "+" : "";
  const formula    = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;

  const formulaCurta = `${qtd}d${lados}${mod ? (mod > 0 ? " + " + mod : " - " + Math.abs(mod)) : ""}`;
  registrarUltimaRolagem(formulaCurta, total, `Evento: ${personagem}${acao ? " " + acao : ""}`);

  adicionarHistorico(`📜 ${personagem}${acao ? " " + acao : ""} e rolou ${total} ${formula}`);
}

function rolarDado(lados) {
  const modificador = parseInt(document.getElementById("modificador").value) || 0;
  const quantidade  = parseInt(document.getElementById("quantidade").value)  || 1;
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
  ultimasRolagens.unshift({ formula, total, hora: horaAgora(), label });
  ultimasRolagens = ultimasRolagens.slice(0, 3);
  localStorage.setItem("ultimasRolagensRPG", JSON.stringify(ultimasRolagens));
  renderizarUltimasRolagens();
}

function renderizarUltimasRolagens() {
  const lista = document.getElementById("lista-ultimas-rolagens");
  if (!lista) return;
  lista.innerHTML = "";

  if (ultimasRolagens.length === 0) {
    lista.innerHTML = `<p class="efeitos-vazio">Nenhuma rolagem ainda.</p>`;
    return;
  }

  ultimasRolagens.forEach(r => {
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

function adicionarHistorico(texto, tipo = "") {
  const historico = lerLocalStorageJSON("historicoRPG", []);
  const hora = horaAgora();
  historico.push({ texto, tipo, hora });
  localStorage.setItem("historicoRPG", JSON.stringify(historico));
  renderizarItemHistorico(texto, tipo, hora);
}

function renderizarItemHistorico(texto, tipo, hora) {
  const log = document.getElementById("log-historico");
  if (!log) return;
  const item       = document.createElement("div");
  item.className   = "log-item" + (tipo ? ` ${tipo}` : "");

  const texto_el = document.createElement("span");
  texto_el.className = "log-item-texto";
  texto_el.textContent = texto;
  item.appendChild(texto_el);

  if (hora) {
    const hora_el = document.createElement("span");
    hora_el.className = "log-item-hora";
    hora_el.textContent = hora;
    item.appendChild(hora_el);
  }

  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function limparHistorico() {
  if (!confirm("Deseja realmente limpar o histórico da sessão?")) return;
  localStorage.removeItem("historicoRPG");
  document.getElementById("log-historico").innerHTML = "";
}

function atualizarBtnTema() {
  const isLight = document.body.classList.contains("tema-light");
  const btn = document.getElementById("btn-tema");
  if (btn) btn.textContent = isLight ? "🌙 Modo Dark" : "☀️ Modo Light";
}

/* ==========================================================================
   10. MODAIS
   ========================================================================== */
function configurarModal(btnId, modalId, fecharId) {
  const botao = document.getElementById(btnId);
  const modal = document.getElementById(modalId);
  const fechar = document.getElementById(fecharId);
  botao.addEventListener("click",  () => modal.classList.remove("oculto"));
  fechar.addEventListener("click", () => modal.classList.add("oculto"));
  window.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("oculto"); });
}

/* ==========================================================================
   CONFIGURAÇÕES
   ========================================================================== */
let config = lerLocalStorageJSON("configRPG", {
  campanhaNome: "",
  mestreNome:   "",
  dadoAcerto:   20,
  etapaAcerto:  true,
  autoMorte:    true,
});

function abrirModalConfig() {
  document.getElementById("config-campanha-nome").value  = config.campanhaNome;
  document.getElementById("config-mestre-nome").value    = config.mestreNome;
  document.getElementById("config-dado-acerto").value    = config.dadoAcerto;
  document.getElementById("config-etapa-acerto").checked = config.etapaAcerto;
  document.getElementById("config-auto-morte").checked   = config.autoMorte;
  document.getElementById("modal-config").classList.remove("oculto");
}

function salvarConfig() {
  config.campanhaNome = document.getElementById("config-campanha-nome").value.trim();
  config.mestreNome   = document.getElementById("config-mestre-nome").value.trim();
  config.dadoAcerto   = parseInt(document.getElementById("config-dado-acerto").value) || 20;
  config.etapaAcerto  = document.getElementById("config-etapa-acerto").checked;
  config.autoMorte    = document.getElementById("config-auto-morte").checked;
  localStorage.setItem("configRPG", JSON.stringify(config));
  aplicarConfig();
  document.getElementById("modal-config").classList.add("oculto");
}

function aplicarConfig() {
  const spanCampanha = document.getElementById("header-campanha");
  if (spanCampanha) spanCampanha.textContent = config.campanhaNome || "";
  const spanMestre = document.getElementById("header-mestre");
  if (spanMestre) spanMestre.textContent = config.mestreNome ? `Mestre: ${config.mestreNome}` : "";
  const selAcerto = document.getElementById("acerto-tipo");
  if (selAcerto) selAcerto.value = config.dadoAcerto;
}

function exportarSessao() {
  const dados = {
    versao: "1.0",
    data: new Date().toLocaleString("pt-BR"),
    campanha: config.campanhaNome,
    mestre: config.mestreNome,
    config, listaDeIniciativa, partyHerois, monstrosCustom,
    efeitosTemporarios, turnoAtual, turnoAtivo,
    historico: lerLocalStorageJSON("historicoRPG", []),
    anotacoes: localStorage.getItem("anotacoesRPG") || "",
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
      listaDeIniciativa  = dados.listaDeIniciativa  || [];
      partyHerois        = dados.partyHerois        || [];
      monstrosCustom     = dados.monstrosCustom     || [];
      efeitosTemporarios = dados.efeitosTemporarios || [];
      turnoAtual         = dados.turnoAtual         || dados.rodadaAtual || 1;
      turnoAtivo         = dados.turnoAtivo         || 0;
      config             = dados.config             || config;
      localStorage.setItem("historicoRPG", JSON.stringify(dados.historico || []));
      localStorage.setItem("anotacoesRPG", dados.anotacoes || "");
      localStorage.setItem("configRPG",    JSON.stringify(config));
      const area = document.getElementById("campo-anotacoes");
      if (area) area.value = dados.anotacoes || "";
      document.getElementById("log-historico").innerHTML = "";
      (dados.historico || []).forEach(h => renderizarItemHistorico(h.texto, h.tipo, h.hora));
      aplicarConfig();
      salvarESincronizar();
      renderizarColetanea();
      document.getElementById("modal-config").classList.add("oculto");
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

  const inputBusca = document.getElementById("busca-monstros");
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

  const btnNovoHeroiStatus = document.getElementById("btn-novo-heroi-status");
  if (btnNovoHeroiStatus) btnNovoHeroiStatus.addEventListener("click", () => abrirModalHeroi());

  document.getElementById("btn-config").addEventListener("click", abrirModalConfig);
  document.getElementById("fechar-config").addEventListener("click", () => document.getElementById("modal-config").classList.add("oculto"));
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-config")) document.getElementById("modal-config").classList.add("oculto"); });
  document.getElementById("btn-salvar-config").addEventListener("click", salvarConfig);
  document.getElementById("btn-exportar-sessao").addEventListener("click", exportarSessao);
  document.getElementById("btn-limpar-tudo").addEventListener("click", limparTodosDados);
  const fileImportar = document.getElementById("input-importar-sessao");
  if (fileImportar) fileImportar.addEventListener("change", (e) => importarSessao(e.target.files[0]));

  document.getElementById("fechar-iniciativa").addEventListener("click", fecharModalIniciativa);
  document.getElementById("btn-rolar-ini").addEventListener("click", rolarIniciativaModal);
  document.getElementById("btn-confirmar-ini").addEventListener("click", confirmarIniciativaModal);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-iniciativa")) fecharModalIniciativa(); });
  document.getElementById("modal-iniciativa").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarIniciativaModal(); });

  document.getElementById("fechar-heroi").addEventListener("click", fecharModalHeroi);
  document.getElementById("btn-confirmar-heroi").addEventListener("click", confirmarNovoHeroi);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-heroi")) fecharModalHeroi(); });
  document.getElementById("modal-heroi").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoHeroi(); });

  document.getElementById("btn-escolher-imagem-heroi").addEventListener("click", abrirModalEscolherImagem);
  document.getElementById("fechar-escolher-imagem").addEventListener("click", fecharModalEscolherImagem);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-escolher-imagem")) fecharModalEscolherImagem(); });

  document.getElementById("fechar-exp-heroi").addEventListener("click", fecharModalExpHeroi);
  document.getElementById("btn-confirmar-exp-heroi").addEventListener("click", confirmarExpHeroi);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-exp-heroi")) fecharModalExpHeroi(); });
  document.getElementById("modal-exp-heroi").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarExpHeroi(); });

  document.getElementById("btn-abrir-monstros").addEventListener("click", abrirModalMonstrosLista);
  document.getElementById("fechar-monstros-lista").addEventListener("click", fecharModalMonstrosLista);
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("modal-monstros-lista");
    if (e.target === modal) fecharModalMonstrosLista();
  });

  document.getElementById("btn-novo-monstro").addEventListener("click", abrirModalMonstro);
  document.getElementById("fechar-monstro").addEventListener("click", fecharModalMonstro);
  document.getElementById("btn-confirmar-monstro").addEventListener("click", confirmarNovoMonstro);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-monstro")) fecharModalMonstro(); });
  document.getElementById("modal-monstro").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoMonstro(); });

  document.getElementById("fechar-dano-cura").addEventListener("click", fecharModalDanoCura);
  document.getElementById("btn-confirmar-dano").addEventListener("click", confirmarDanoCura);
  document.getElementById("btn-morto-modal").addEventListener("click", mortoViaModal);
  document.getElementById("btn-rolar-dano-modal").addEventListener("click", rolarDadoModal);
  document.getElementById("modal-dano-manual").addEventListener("input", atualizarPrevia);
  document.getElementById("modal-dano-atacante").addEventListener("change", atualizarPrevia);
  document.getElementById("modal-dano-alvos-lista").addEventListener("change", atualizarPrevia);
  document.getElementById("btn-dano-alvo-todos").addEventListener("click", () => { selecionarTodosAlvos("modal-dano-alvos-lista", true); atualizarPrevia(); });
  document.getElementById("btn-dano-alvo-nenhum").addEventListener("click", () => { selecionarTodosAlvos("modal-dano-alvos-lista", false); atualizarPrevia(); });
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-dano-cura")) fecharModalDanoCura(); });
  document.getElementById("modal-dano-cura").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarDanoCura(); });

  document.getElementById("btn-abrir-area").addEventListener("click", abrirModalArea);
  document.getElementById("fechar-area").addEventListener("click", fecharModalArea);
  document.getElementById("btn-rolar-area").addEventListener("click", rolarDadoArea);
  document.getElementById("btn-confirmar-area").addEventListener("click", confirmarDanoArea);
  document.getElementById("btn-area-todos").addEventListener("click", () => selecionarTodosAlvos("area-alvos-lista", true));
  document.getElementById("btn-area-nenhum").addEventListener("click", () => selecionarTodosAlvos("area-alvos-lista", false));
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-area")) fecharModalArea(); });

  document.getElementById("btn-abrir-cura-area").addEventListener("click", abrirModalCuraArea);
  document.getElementById("fechar-cura-area").addEventListener("click", fecharModalCuraArea);
  document.getElementById("btn-rolar-cura-area").addEventListener("click", rolarDadoCuraArea);
  document.getElementById("btn-confirmar-cura-area").addEventListener("click", confirmarCuraArea);
  document.getElementById("btn-cura-area-todos").addEventListener("click", () => selecionarTodosAlvos("cura-area-alvos-lista", true));
  document.getElementById("btn-cura-area-nenhum").addEventListener("click", () => selecionarTodosAlvos("cura-area-alvos-lista", false));
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-cura-area")) fecharModalCuraArea(); });

  document.getElementById("fechar-condicao-duracao").addEventListener("click", fecharModalCondicaoDuracao);
  document.getElementById("btn-confirmar-condicao").addEventListener("click", confirmarCondicao);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-condicao-duracao")) fecharModalCondicaoDuracao(); });
  document.getElementById("modal-condicao-duracao").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarCondicao(); });

  document.getElementById("fechar-acerto").addEventListener("click", fecharModalAcerto);
  document.getElementById("btn-rolar-acerto").addEventListener("click", rolarAcerto);
  document.getElementById("btn-acerto-aplicar-dano").addEventListener("click", irParaDano);
  document.getElementById("btn-acerto-pular").addEventListener("click", irParaDano);
  document.getElementById("btn-acerto-alvo-todos").addEventListener("click", () => selecionarTodosAlvos("acerto-alvos-lista", true));
  document.getElementById("btn-acerto-alvo-nenhum").addEventListener("click", () => selecionarTodosAlvos("acerto-alvos-lista", false));
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-acerto")) fecharModalAcerto(); });

  document.getElementById("btn-turno-anterior").addEventListener("click", turnoAnterior);
  document.getElementById("btn-proximo-turno").addEventListener("click", proximoTurno);

  document.getElementById("btn-rolar-dado").addEventListener("click", rolarDadoSelecionado);
  selecionarDado(dadoSelecionado);
  renderizarUltimasRolagens();

  document.getElementById("btn-rapido-iniciativa").addEventListener("click", () => abrirModalAcaoRapida("Iniciativa", "🎲", "acao-iniciativa"));
  document.getElementById("btn-rapido-pericia").addEventListener("click", () => abrirModalAcaoRapida("Teste de Perícia", "🎯", "acao-pericia"));
  document.getElementById("btn-rapido-resistencia").addEventListener("click", () => abrirModalAcaoRapida("Teste de Resistência", "🛡️", "acao-resistencia"));
  document.getElementById("fechar-acao-rapida").addEventListener("click", fecharModalAcaoRapida);
  document.getElementById("btn-confirmar-acao-rapida").addEventListener("click", confirmarAcaoRapida);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-acao-rapida")) fecharModalAcaoRapida(); });
  document.getElementById("modal-acao-rapida").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarAcaoRapida(); });

  document.getElementById("btn-rapido-evento").addEventListener("click", abrirModalEvento);
  document.getElementById("fechar-evento").addEventListener("click", fecharModalEvento);
  document.getElementById("btn-rolar-evento").addEventListener("click", rolarEvento);
  document.getElementById("evento-personagem").addEventListener("change", () => atualizarPreviaEvento());
  document.getElementById("evento-acao").addEventListener("input", () => atualizarPreviaEvento());
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-evento")) fecharModalEvento(); });

  // Botões de ação do painel de turno
  const btnTurnoAtaque = document.getElementById("btn-turno-ataque");
  const btnTurnoCondicao = document.getElementById("btn-turno-condicao");
  const btnTurnoCura = document.getElementById("btn-turno-cura");

  if (btnTurnoAtaque) btnTurnoAtaque.addEventListener("click", abrirTurnoAcaoAtaque);
  if (btnTurnoCondicao) btnTurnoCondicao.addEventListener("click", abrirTurnoAcaoCondicao);
  if (btnTurnoCura) btnTurnoCura.addEventListener("click", abrirTurnoAcaoCura);

  atualizarIniciativa();
  renderizarStatusGrupo();
  atualizarPainelTurno();
  aplicarConfig();

  const historicoSalvo = lerLocalStorageJSON("historicoRPG", []);
  historicoSalvo.forEach(e => renderizarItemHistorico(e.texto, e.tipo, e.hora));

  const areaAnotacoes = document.getElementById("campo-anotacoes");
  if (areaAnotacoes) {
    areaAnotacoes.value = localStorage.getItem("anotacoesRPG") || "";
    areaAnotacoes.addEventListener("input", () => localStorage.setItem("anotacoesRPG", areaAnotacoes.value));
  }

  const temaAtual = localStorage.getItem("temaRPG") || "dark";
  if (temaAtual === "light") document.body.classList.add("tema-light");
  atualizarBtnTema();
  document.getElementById("btn-tema").addEventListener("click", () => {
    document.body.classList.toggle("tema-light");
    const novoTema = document.body.classList.contains("tema-light") ? "light" : "dark";
    localStorage.setItem("temaRPG", novoTema);
    atualizarBtnTema();
  });
};