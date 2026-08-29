/* ==========================================================================
   SYNC — persistência do estado de combate/grupo + re-render dos painéis
   Os painéis se registram no boot via aoSincronizar(fn), assim este módulo
   não precisa importar cada painel (evita dependência circular).
   ========================================================================== */
import { CHAVES } from "./storage.js";
import { estado } from "./state.js";

const _sincronizadores = [];

/** Registra um renderizador para rodar após cada salvarESincronizar() */
export function aoSincronizar(fn) {
  _sincronizadores.push(fn);
}

export function salvarIniciativaNoCofre() {
  localStorage.setItem(CHAVES.iniciativa, JSON.stringify(estado.listaDeIniciativa));
}

export function salvarHeroisNoCofre() {
  localStorage.setItem(CHAVES.party, JSON.stringify(estado.partyHerois));
}

export function salvarESincronizar() {
  salvarIniciativaNoCofre();
  salvarHeroisNoCofre();
  localStorage.setItem(CHAVES.turnoAtivo, estado.turnoAtivo);
  localStorage.setItem(CHAVES.turnoAtual, estado.turnoAtual);
  localStorage.setItem(CHAVES.efeitos,    JSON.stringify(estado.efeitosTemporarios));
  _sincronizadores.forEach(fn => fn());
}
