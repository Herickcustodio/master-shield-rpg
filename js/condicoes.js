/* ==========================================================================
   CONDIÇÕES — aplicar/remover condições nos combatentes, contagem de duração
   e o estado de morte/reviver. O modal de duração avisa um callback ao fechar
   (turno.js usa isso para reabrir seu popover de condições).
   ========================================================================== */
import { $ } from "./dom.js";
import { estado } from "./state.js";
import { CONDICOES } from "./constantes.js";
import { adicionarHistorico } from "./historico.js";
import { salvarESincronizar } from "./sync.js";

let _condicaoCtx = null; // { criaturaId, condicaoId }
let _aoFechar = null;

/** Registra um callback disparado sempre que o modal de duração fecha */
export function aoFecharModalCondicao(fn) {
  _aoFechar = fn;
}

export function abrirModalCondicaoDuracao(criaturaId, condicaoId) {
  const criatura = estado.listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;

  const cond    = CONDICOES.find(c => c.id === condicaoId);
  const jaAtiva = (criatura.condicoes || []).find(c => c.id === condicaoId);

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
  if (_aoFechar) _aoFechar();
}

/** Aplica (ou renova, se já ativa) uma condição num combatente e registra no
 *  histórico. Não persiste — quem chama deve rodar salvarESincronizar(). */
export function aplicarCondicao(criaturaId, condicaoId, turnos = null) {
  const criatura = estado.listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;
  const cond = CONDICOES.find(c => c.id === condicaoId);
  if (!cond) return;
  if (!criatura.condicoes) criatura.condicoes = [];

  const existente = criatura.condicoes.find(c => c.id === condicaoId);
  if (existente) existente.turnos = turnos;
  else criatura.condicoes.push({ id: condicaoId, turnos });

  const duracaoTxt = turnos ? `${turnos} turno${turnos > 1 ? "s" : ""}` : "indefinido";
  adicionarHistorico(`${cond.emoji} ${criatura.nome} recebeu: ${cond.label} (${duracaoTxt})`, "condicao");
}

function confirmarCondicao() {
  if (!_condicaoCtx) return;
  const { criaturaId, condicaoId } = _condicaoCtx;

  const turnosVal = $("condicao-turnos").value.trim();
  const turnos    = turnosVal !== "" ? parseInt(turnosVal) || 1 : null; // null = indefinido

  aplicarCondicao(criaturaId, condicaoId, turnos);

  fecharModalCondicaoDuracao();
  salvarESincronizar();
}

export function removerCondicao(criaturaId, condicaoId) {
  const criatura = estado.listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;
  const cond = CONDICOES.find(c => c.id === condicaoId);
  criatura.condicoes = (criatura.condicoes || []).filter(c => c.id !== condicaoId);
  adicionarHistorico(`✅ ${criatura.nome} se recuperou de: ${cond.label}`, "sucesso");
  salvarESincronizar();
}

/** Decrementa turnos de condições ao virar turno. Por padrão processa todos os combatentes;
 *  passe uma sublista (ex.: [criaturaAtiva]) para decrementar só quem está com o turno ativo. */
export function decrementarCondicoes(criaturas = estado.listaDeIniciativa) {
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

/** Alterna uma condição — abre modal para definir duração (ou remove se já ativa) */
export function toggleCondicao(id, condicaoId) {
  abrirModalCondicaoDuracao(id, condicaoId);
}

/** Alterna o estado de morte do combatente sem removê-lo da lista */
export function marcarMorto(id) {
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

/** Liga o modal de duração de condição. Chamado no boot pelo main. */
export function initCondicoes() {
  $("fechar-condicao-duracao").addEventListener("click", fecharModalCondicaoDuracao);
  $("btn-confirmar-condicao").addEventListener("click", confirmarCondicao);
  window.addEventListener("click", (e) => { if (e.target === $("modal-condicao-duracao")) fecharModalCondicaoDuracao(); });
  $("modal-condicao-duracao").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarCondicao(); });
}
