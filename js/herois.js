/* ==========================================================================
   HERÓIS — cadastro/edição, seletores de cor e imagem, EXP/nível e o
   painel "Grupo e Combatentes".
   ========================================================================== */
import { $ } from "./dom.js";
import { estado } from "./state.js";
import { CORES_HEROI, IMAGENS_HEROI } from "./constantes.js";
import { adicionarHistorico } from "./historico.js";
import { salvarESincronizar } from "./sync.js";
import { calcularCorHP, preencherAvatar } from "./ui.js";
import { lancarIniciativaHeroi } from "./combate.js";

let _corSelecionada = null;
let _imagemSelecionada = null;
let _idHeroiExpAtual = null;

/* ==========================================================================
   SELETORES DE COR E IMAGEM
   ========================================================================== */
/** true se o valor guardado é uma foto enviada pelo usuário (data URL) e não um id de preset */
const _ehFoto = (v) => typeof v === "string" && v.startsWith("data:");

/** Lê um arquivo de imagem, reduz para no máx. `max`px de lado e devolve uma data URL leve */
function redimensionarImagem(file, max = 256) {
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

/** Marca o <img> de avatar como foto (cover, sem padding, sem inversão no tema claro) */
function _srcAvatar(imgEl, valor) {
  if (_ehFoto(valor)) {
    imgEl.src = valor;
    imgEl.classList.add("foto");
  } else {
    imgEl.src = `img/herois/${valor}_white.png`;
  }
}

/** Preenche o quadradinho de pré-visualização no modal de Novo/Editar Herói */
function atualizarPreviewImagemHeroi() {
  const preview = $("heroi-imagem-preview");
  if (!preview) return;
  if (_imagemSelecionada) {
    preview.innerHTML = "";
    const img = document.createElement("img");
    img.alt = "";
    _srcAvatar(img, _imagemSelecionada);
    preview.appendChild(img);
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

  // Botão "enviar do computador"
  const btnUpload = document.createElement("button");
  btnUpload.type      = "button";
  btnUpload.title     = "Enviar uma imagem do computador";
  btnUpload.className = "imagem-heroi-btn imagem-heroi-btn--upload";
  btnUpload.innerHTML = `<span>📁</span><span class="imagem-heroi-btn-legenda">Do computador</span>`;
  btnUpload.addEventListener("click", () => $("heroi-imagem-arquivo").click());
  container.appendChild(btnUpload);

  // Miniatura da foto atual (quando já foi enviada uma), marcada como selecionada
  if (_ehFoto(_imagemSelecionada)) {
    const btnFoto = document.createElement("button");
    btnFoto.type      = "button";
    btnFoto.title     = "Imagem atual (enviada do computador)";
    btnFoto.className = "imagem-heroi-btn imagem-heroi-btn--selecionada";
    btnFoto.innerHTML = `<img class="foto" src="${_imagemSelecionada}" alt="">`;
    btnFoto.addEventListener("click", () => fecharModalEscolherImagem());
    container.appendChild(btnFoto);
  }

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
   MODAL DE NOVO / EDITAR HERÓI
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

export function abrirModalHeroi(idEdicao = null) {
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
   MODAL DE EXP DO HERÓI
   ========================================================================== */
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

export function removerHeroi(idHeroi) {
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
   PAINEL — GRUPO E COMBATENTES
   ========================================================================== */
export function renderizarStatusGrupo() {
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

/** Liga o botão "Criar Novo Herói" e os modais de herói / imagem / EXP. Chamado no boot pelo main. */
export function initHerois() {
  const btnNovoHeroiStatus = $("btn-novo-heroi-status");
  if (btnNovoHeroiStatus) btnNovoHeroiStatus.addEventListener("click", () => abrirModalHeroi());

  $("fechar-heroi").addEventListener("click", fecharModalHeroi);
  $("btn-confirmar-heroi").addEventListener("click", confirmarNovoHeroi);
  window.addEventListener("click", (e) => { if (e.target === $("modal-heroi")) fecharModalHeroi(); });
  $("modal-heroi").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoHeroi(); });

  $("btn-escolher-imagem-heroi").addEventListener("click", abrirModalEscolherImagem);
  $("fechar-escolher-imagem").addEventListener("click", fecharModalEscolherImagem);
  window.addEventListener("click", (e) => { if (e.target === $("modal-escolher-imagem")) fecharModalEscolherImagem(); });

  $("heroi-imagem-arquivo").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo depois
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Selecione um arquivo de imagem."); return; }
    try {
      _imagemSelecionada = await redimensionarImagem(file);
      atualizarPreviewImagemHeroi();
      fecharModalEscolherImagem();
    } catch (err) {
      alert("Não foi possível carregar a imagem: " + err.message);
    }
  });

  $("fechar-exp-heroi").addEventListener("click", fecharModalExpHeroi);
  $("btn-confirmar-exp-heroi").addEventListener("click", confirmarExpHeroi);
  window.addEventListener("click", (e) => { if (e.target === $("modal-exp-heroi")) fecharModalExpHeroi(); });
  $("modal-exp-heroi").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarExpHeroi(); });
}
