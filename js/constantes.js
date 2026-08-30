/* ==========================================================================
   CONSTANTES — dados fixos do app (cores, imagens e condições de herói)
   ========================================================================== */

export const CORES_HEROI = [
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

// Ícones disponíveis em img/herois/ (arquivo real é <id>_white.png / <id>_black.png)
export const IMAGENS_HEROI = [
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

// Ícones disponíveis em img/monstros/ (arquivo real é <id>_white.png / <id>_black.png).
// Guardados no monstro como "monstros/<id>" para distinguir dos ícones de herói.
export const MONSTROS_ICONES = [
  { id: "esqueleto",        label: "Esqueleto"       },
  { id: "beholder",         label: "Beholder"        },
  { id: "mind_flayer",      label: "Mind Flayer"     },
  { id: "dragao_vermelho",  label: "Dragão Vermelho" },
];

export const CONDICOES = [
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
