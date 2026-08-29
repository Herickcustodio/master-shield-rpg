/* ==========================================================================
   STATE — estado mutável compartilhado entre os módulos
   Acesse sempre via estado.X. Nunca desestruture (`const { x } = estado`)
   nem reatribua `estado` — isso quebra a referência viva vista pelos outros
   módulos. Reatribuir as propriedades (estado.x = ...) é o esperado.
   ========================================================================== */
import { CHAVES, lerLocalStorageJSON, lerLocalStorageNumero } from "./storage.js";

export const estado = {
  listaDeIniciativa:  lerLocalStorageJSON(CHAVES.iniciativa, []),
  partyHerois:        lerLocalStorageJSON(CHAVES.party, []),
  turnoAtivo:         lerLocalStorageNumero(CHAVES.turnoAtivo, 0),
  turnoAtual:         lerLocalStorageNumero(CHAVES.turnoAtual, lerLocalStorageNumero(CHAVES.rodadaAtual, 1)),
  monstrosCustom:     lerLocalStorageJSON(CHAVES.monstrosCustom, []),
  efeitosTemporarios: lerLocalStorageJSON(CHAVES.efeitos, []),
  ultimasRolagens:    lerLocalStorageJSON(CHAVES.ultimasRolagens, []),
  dadoSelecionado:    20,
};
