/* ==========================================================================
   STORAGE — chaves do localStorage e leitura tolerante a falhas
   ========================================================================== */

/** Chaves do localStorage centralizadas — evita erro de digitação silencioso */
export const CHAVES = {
  iniciativa:      "iniciativaRPG",
  party:           "partyHeroisRPG",
  turnoAtivo:      "turnoAtivoRPG",
  turnoAtual:      "turnoAtualRPG",
  rodadaAtual:     "rodadaAtualRPG",
  monstrosCustom:  "monstrosCustomRPG",
  efeitos:         "efeitosRPG",
  ultimasRolagens: "ultimasRolagensRPG",
  historico:       "historicoRPG",
  config:          "configRPG",
  anotacoes:       "anotacoesRPG",
  tema:            "temaRPG",
};

export function lerLocalStorageJSON(chave, fallback) {
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

export function lerLocalStorageNumero(chave, fallback = 0) {
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
