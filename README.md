# Master Shield RPG

> O escudo por trás da tela — tudo que o mestre precisa em um só lugar.

Ferramenta auxiliar para mesas de RPG (D&D 5e e sistemas d20 em geral), pensada
para o mestre usar durante a sessão. Roda 100% no navegador, sem back-end: todos
os dados ficam no `localStorage` do próprio dispositivo.

---

## Funcionalidades

| Painel | O que faz |
|---|---|
| **Rolador de Dados** | Seleção de dado (d4–d100), quantidade e modificador; registra as 3 últimas rolagens. |
| **Ações Rápidas** | Botões de Iniciativa, Teste de Perícia e Teste de Resistência (d20 + modificador, com crítico/falha coloridos no histórico) e um rolador de **Evento** para testes de personagens específicos. |
| **Combate** | Coletânea de monstros D&D 5e + monstros customizados; cada combatente vira um card com CA, HP, condições e ordem de iniciativa. Faixa "Ordem da Iniciativa" para pular direto para qualquer combatente. |
| **Controle de Turno** | Avança/volta a iniciativa pulando mortos; ao fechar a volta, incrementa a RODADA e decrementa condições/efeitos. Card do combatente ativo com ações de **Ataque**, **Cura**, **Condição** e morte/nocaute. |
| **Dano / Cura** | Modal de acerto (compara com a CA dos alvos), modal de dano/cura individual ou em lote, e **Dano em Área** / **Cura em Área** com seleção múltipla de alvos e nome de magia/habilidade. |
| **Grupo e Combatentes** | Cadastro de heróis (nome, classe, nível, HP, CA, EXP, cor e imagem). Barra de EXP ao redor do avatar, subida de nível automática, HP temporário ajustável no card. |
| **Histórico da Sessão** | Registro automático e colorido de tudo (dano, cura, condições, turnos, rolagens…). |
| **Anotações** | Campo de texto livre, salvo automaticamente. |
| **Configurações** | Nome da campanha e do mestre, dado padrão de acerto, quando a condição expira (fim da rodada × turno do personagem), etapa de acerto antes do dano, marcação automática de mortos. |
| **Sessão** | Exportar/importar a sessão inteira como `.json` (backup) e "Limpar todos os dados". |
| **Tema** | Alternância claro/escuro, persistida. |

---

## Como rodar

O app usa **módulos ES** (`<script type="module">`), então **precisa ser servido por
HTTP** — abrir o `index.html` direto pelo `file://` não funciona.

Qualquer servidor estático serve. Exemplos:

```bash
# Node
npx serve .

# Python 3
python -m http.server 8000

# VS Code
# extensão "Live Server" → botão "Go Live"
```

Depois acesse `http://localhost:<porta>`. Não há passo de build nem dependências.

---

## Arquitetura

Código organizado em módulos ES pequenos e coesos, sem framework nem bundler.

### Padrões-chave

- **`estado` vivo compartilhado** ([js/state.js](js/state.js)) — um único objeto
  mutável importado por todos os painéis. Sempre acessado via `estado.x`; nunca
  desestruturado nem reatribuído (isso quebraria a referência viva vista pelos
  outros módulos). O mesmo vale para o objeto `config` ([js/config.js](js/config.js)).
- **Re-render centralizado por registro** ([js/sync.js](js/sync.js)) —
  `salvarESincronizar()` persiste o estado e dispara os renderizadores dos
  painéis. Cada painel se inscreve no boot com `aoSincronizar(fn)`. Isso evita
  que `sync.js` importe os painéis e, com isso, **elimina imports circulares**.
- **Chaves de `localStorage` centralizadas** ([js/storage.js](js/storage.js)) —
  objeto `CHAVES` + leitura tolerante a falhas (`lerLocalStorageJSON`,
  `lerLocalStorageNumero`).
- **`init*()` por painel** — cada módulo de painel exporta uma função `initX()`
  que liga seus listeners; [js/main.js](js/main.js) só chama todas no `window.onload`.

### Grafo de dependências

Sem ciclos — é um DAG:

```
main
 ├── herois ──► combate ──► turno ──► dano ──► condicoes ──► sync
 ├── config          (turno/dano também usam: ui, config, historico)
 ├── dados
 └── ui, sync
```

`sync.js` não depende de nenhum painel (o registro de renderizadores quebra o que
seria o ciclo principal).

### Módulos

| Arquivo | Responsabilidade |
|---|---|
| [js/main.js](js/main.js) | Ponto de entrada. Registra renderizadores, chama os `init*`, restaura histórico/anotações/tema, exporta/importa sessão. |
| [js/dom.js](js/dom.js) | `$` (getElementById) e `horaAgora`. |
| [js/storage.js](js/storage.js) | `CHAVES` do `localStorage` + leitura tolerante a falhas. |
| [js/state.js](js/state.js) | Objeto `estado` — estado mutável compartilhado. |
| [js/constantes.js](js/constantes.js) | Dados fixos: `CORES_HEROI`, `IMAGENS_HEROI`, `CONDICOES`. |
| [js/monstros.js](js/monstros.js) | `coletaneaMonstros` — lista genérica de monstros D&D 5e. |
| [js/historico.js](js/historico.js) | Histórico da sessão (`adicionarHistorico`, render e limpeza). |
| [js/dados.js](js/dados.js) | Rolador principal, ações rápidas, modal de evento, últimas rolagens. |
| [js/ui.js](js/ui.js) | Helpers compartilhados: modal genérico, avatar, cor de HP, lista de alvos, resolução de CA. |
| [js/sync.js](js/sync.js) | `salvarESincronizar` + registro `aoSincronizar`. |
| [js/config.js](js/config.js) | Objeto `config` (vivo) + modal de Configurações. |
| [js/herois.js](js/herois.js) | Cadastro/edição de herói, seletores de cor/imagem, EXP/nível, painel "Grupo e Combatentes". |
| [js/combate.js](js/combate.js) | Coletânea e monstros custom, modal de iniciativa, painel de iniciativa (`atualizarIniciativa`, `renderizarOrdemIniciativa`). |
| [js/turno.js](js/turno.js) | Avanço/retrocesso de turno, painel do combatente ativo e suas ações, popover de condições. |
| [js/condicoes.js](js/condicoes.js) | Aplicar/remover condições, contagem de duração, morte/reviver. |
| [js/dano.js](js/dano.js) | Modais de acerto, dano/cura (individual e em lote) e dano/cura em área. |

---

## Estrutura de pastas

```
.
├── index.html          # markup + todos os modais
├── css/style.css        # estilos (tema claro/escuro, responsivo)
├── js/                  # módulos ES (ver tabela acima)
├── img/                 # dados (d4–d100), ícones e img/herois/<id>_white|black.png
└── informacoes.txt      # notas de desenvolvimento / backlog
```

---

## Persistência (`localStorage`)

Chaves definidas em [js/storage.js](js/storage.js):

| Chave | Conteúdo |
|---|---|
| `iniciativaRPG` | Lista de combatentes na iniciativa. |
| `partyHeroisRPG` | Heróis cadastrados. |
| `turnoAtivoRPG` / `turnoAtualRPG` | Índice do combatente ativo / número da rodada. |
| `monstrosCustomRPG` | Monstros customizados. |
| `efeitosRPG` | Efeitos temporários. |
| `ultimasRolagensRPG` | Últimas 3 rolagens. |
| `historicoRPG` | Histórico da sessão. |
| `configRPG` | Configurações da mesa. |
| `anotacoesRPG` | Texto das anotações. |
| `temaRPG` | `"light"` ou `"dark"`. |

O botão **Exportar Sessão** empacota tudo isso em um único `.json`; **Importar
Sessão** substitui o estado atual por um arquivo salvo.

---

## Stack

HTML, CSS e JavaScript puro (módulos ES). Sem build, sem dependências, sem
back-end. Ícones de [game-icons.net](https://game-icons.net/).
