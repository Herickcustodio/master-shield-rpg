const STORAGE_KEY = "masterShieldIdioma";
const translations = {
  "Sobre": "About",
  "Atualizações": "Updates",
  "Ajuda": "Help",
  "Configurações": "Settings",
  "Modo Dark/Light": "Dark/Light Mode",
  "Fechar": "Close",
  "As atualizações serão carregadas ao abrir esta janela.": "Updates will load when you open this window.",
  "Ver todos os commits no GitHub": "View all commits on GitHub",
  "Sobre o Master Shield RPG": "About Master Shield RPG",
  "O Master Shield RPG é uma ferramenta auxiliar para mestres em mesas de RPG. Criei o projeto para colocar em prática minhas aulas de programação, também, para ajudar mais mestres(que nem eu) a se organizar nos combates e informações dos grupos de RPG.": "Master Shield RPG is a tool for tabletop RPG game masters. I created this project to put my programming lessons into practice and help other GMs organize combat and party information.",
  "Como só joguei Tormenta e D&D, não conheço muito outros sistemas, mas fiz diversas coisas personalizáveis, para adaptar ao sistema que quiser usar.": "Since I have only played Tormenta and D&D, I do not know many other systems, but I added several customizable features so you can adapt the app to the system of your choice.",
  "A ideia inicial do site é deixar as informações salvas automaticamente no navegador, sem precisar de cadastro ou login. Mas ainda irei adicionar alguns desses recursos, só ir avançando mais no meu aprendizado.": "The initial idea is to save information automatically in your browser, without registration or login. I may add some of those features as I continue learning.",
  "Esse projeto é opensource, mas por favor, não se esqueça de dar os créditos caso utilize em seu próprio projeto.": "This project is open source. Please remember to give credit if you use it in your own project.",
  "Para o domínio desse site irei pagar tudo do meu bolso, mas se quiser ajudar com alguma coisa, deixarei um botão de doações.": "I pay for this site's domain myself, but I have added a donation button in case you would like to help.",
  "Para sugestões e report de bugs, envie um e-mail para": "For suggestions or bug reports, email",
  "Desenvolvido por Herick Custódio Francisco": "Developed by Herick Custódio Francisco",
  "Créditos": "Credits",
  "Fontes: Google Fonts": "Fonts: Google Fonts",
  "Ícones: Flaticon": "Icons: Flaticon",
  "Imagens de monstros: Gerados por IA Leonardo.ia": "Monster images: generated with Leonardo.ai",
  "Imagens dos Heróis, ícones de dados: https://game-icons.net/": "Hero images and dice icons: https://game-icons.net/",
  "Ícone da aba, ícone do site e logo: Feito por mim mesmo.": "Tab icon, site icon, and logo: created by me.",
  "Também tive auxílio do Claude code na programação.": "Claude Code also helped with programming.",
  "Fazer uma doação": "Make a donation",
  "Como usar o Master Shield RPG": "How to use Master Shield RPG",
  "Guia rápido de cada parte da tela. As alterações são salvas automaticamente no navegador conforme você usa o app.": "A quick guide to each part of the app. Changes are saved automatically in your browser as you use it.",
  "Rolador de Dados": "Dice Roller",
  "Dados": "Dice",
  "Ações Rápidas": "Quick Actions",
  "Rolar Iniciativa": "Roll Initiative",
  "Teste de Perícia": "Ability Check",
  "Teste de Resistência": "Saving Throw",
  "Personagem": "Character",
  "Evento": "Event",
  "Combate": "Combat",
  "Adicionar Monstro": "Add Monster",
  "editados": "edited",
  "Encerrar Combate": "End Combat",
  "Controle de Turno": "Turn Tracker",
  "Voltar Turno": "Previous Turn",
  "Finalizar Turno": "End Turn",
  "Ataque": "Attack",
  "Cura": "Healing",
  "Condição": "Condition",
  "nome do ataque": "attack name",
  "aplicar uma condição junto": "apply a condition as well",
  "Dano em vários alvos": "Damage Multiple Targets",
  "Cura em vários alvos": "Heal Multiple Targets",
  "Fonte": "Source",
  "Curador": "Healer",
  "Grupo e Combatentes": "Party & Combatants",
  "Criar Novo Herói": "Create New Hero",
  "+ Criar Novo Herói": "+ Create New Hero",
  "+ Iniciativa": "+ Initiative",
  "+ EXP": "+ XP",
  "Histórico da Sessão": "Session Log",
  "Limpar Histórico": "Clear Log",
  "Anotações": "Notes",
  "Campanha": "Campaign",
  "Nome da Campanha": "Campaign Name",
  "Nome do Mestre": "Game Master Name",
  "Dado padrão de acerto": "Default attack dice",
  "Condição se encerra": "Condition expires",
  "Ao fim da rodada": "At the end of the round",
  "No turno do personagem": "At the character's turn",
  "Etapa de acerto antes do dano": "Attack roll before damage",
  "Se desativado,": "When disabled,",
  "Dano vai direto para o dano": "damage is applied directly",
  "Marcar mortos automaticamente": "Automatically mark defeated",
  "Monstros vão a 0 HP → marcados como mortos": "Monsters reaching 0 HP are marked as dead",
  "Sessão": "Session",
  "Exportar Sessão": "Export Session",
  "Importar Sessão": "Import Session",
  "Limpar todos os dados": "Clear All Data",
  "Salvar Configurações": "Save Settings",
  "Novo Herói": "New Hero",
  "Nome": "Name",
  "Classe": "Class",
  "Nível": "Level",
  "HP Máximo": "Maximum HP",
  "Classe de Armadura (CA)": "Armor Class (AC)",
  "EXP Atual": "Current XP",
  "EXP para Subir de Nível": "XP to Next Level",
  "Cor do Herói": "Hero Color",
  "Imagem do Herói": "Hero Image",
  "Escolher Imagem": "Choose Image",
  "Criar Herói": "Create Hero",
  "Iniciativa": "Initiative",
  "Modificador de Iniciativa": "Initiative Modifier",
  "Rolar d20": "Roll d20",
  "Ou digite manualmente": "Or enter a value manually",
  "Confirmar Iniciativa": "Confirm Initiative",
  "EXP": "XP",
  "Nível atual: 1": "Current level: 1",
  "EXP atual: 0 / 1000": "Current XP: 0 / 1000",
  "Adicionar EXP": "Add XP",
  "+ Adicionar EXP": "+ Add XP",
  "EXP necessária para o próximo nível": "XP needed for the next level",
  "Novo Monstro": "New Monster",
  "Criar Monstro": "Create Monster",
  "Editar Monstro": "Edit Monster",
  "Editar Herói": "Edit Hero",
  "Salvar Alterações": "Save Changes",
  "Salvar Monstro": "Save Monster",
  "Imagem (opcional)": "Image (optional)",
  "🎯 Rolagem de Acerto": "🎯 Attack Roll",
  "Alvo(s)": "Target(s)",
  "Selecionar todos": "Select all",
  "Limpar seleção": "Clear selection",
  "Dado de acerto": "Attack die",
  "Qtd": "Qty",
  "Dado": "Die",
  "Mod": "Mod",
  "Rolar": "Roll",
  "Pular → Ir para Dano": "Skip → Go to Damage",
  "Aplicar Dano": "Apply Damage",
  "Aplicar Cura": "Apply Healing",
  "A etapa de acerto pode ser ligada ou desligada em Configurações (botão no canto superior direito).": "The attack roll step can be enabled or disabled in Settings (top-right button).",
  "Ação": "Action",
  "Rolar Evento": "Roll Event",
  "Dano": "Damage",
  "Quem curar": "Who to heal",
  "Atacante": "Attacker",
  "Rolar dados": "Roll dice",
  "Liga/desliga a duplicação do valor (acerto/cura crítico)": "Toggle value doubling (critical hit/heal)",
  "×2 crítico": "×2 Critical",
  "Ou digite o valor": "Or enter a value",
  "Nome do ataque (opcional)": "Attack name (optional)",
  "Aplicar condição (opcional)": "Apply condition (optional)",
  "Duração da condição (turnos)": "Condition duration (turns)",
  "Deixe em branco para duração indefinida.": "Leave blank for an indefinite duration.",
  "Aplicar": "Apply",
  "☠️ Marcar como Morto": "☠️ Mark as Dead",
  "Lembre-se que a cura não pode exceder o máximo de vida configurado.": "Healing cannot exceed the configured maximum HP.",
  "Duração em turnos": "Duration in turns",
  "Deixe em branco para duração indefinida (sem contagem).": "Leave blank for an indefinite duration (no countdown).",
  "Aplicar Condição": "Apply Condition",
  "Rolar 1d20": "Roll 1d20",
  "Personagem (opcional)": "Character (optional)",
  "Modificador": "Modifier",
  "Dano em Área": "Area Damage",
  "Fonte do dano (opcional)": "Damage source (optional)",
  "Nome da magia/habilidade (opcional)": "Spell/ability name (optional)",
  "Rolar dano": "Roll damage",
  "Valor do dano": "Damage amount",
  "Selecionar alvos": "Select targets",
  "Aplicar Dano em Área": "Apply Area Damage",
  "Cura em Área": "Area Healing",
  "Curador (opcional)": "Healer (optional)",
  "Rolar cura": "Roll healing",
  "Valor da cura": "Healing amount",
  "Aplicar Cura em Área": "Apply Area Healing",
  "Adicionar Monstro ao Combate": "Add Monster to Combat",
  "+ Criar": "+ Create",
  "RODADA": "ROUND",
  "Ordem da Iniciativa": "Initiative Order",
  "Ferramentas de sessão": "Session tools",
  "Quantidade:": "Quantity:",
  "Modificador:": "Modifier:",
  "ROLAR DADO": "ROLL DICE",
  "Resultado:": "Result:",
  "Últimas Rolagens": "Recent Rolls",
  "Digite suas anotações aqui...": "Write your notes here...",
  "Adicione combatentes e avance o turno.": "Add combatants and advance the turn.",
  "◀ Voltar Turno": "◀ Previous Turn",
  "Finalizar Turno ▶": "End Turn ▶",
  "Anotar no histórico… (ex: o grupo seguiu para a floresta)": "Add to the log… (e.g. the party entered the forest)",
  "Adicionar ao histórico": "Add to log",
  "Adicionar": "Add",
  "+ Adicionar": "+ Add",
  "Condições": "Conditions",
  "🩺 Condições": "🩺 Conditions",
  "Remover herói": "Remove hero",
  "Editar herói": "Edit hero",
  "Atualizar iniciativa": "Update initiative",
  "Lançar iniciativa": "Roll initiative",
  "Indefinido": "Indefinite",
  "indefinido": "indefinite",
  "💚 Reviver": "💚 Revive",
  "⚔️ Ataque": "⚔️ Attack",
  "🩺 Condição": "🩺 Condition",
  "💊 Cura": "💊 Heal",
  "⚔️ Dano": "⚔️ Damage",
  "Nenhum alvo selecionado.": "No target selected.",
  "Nenhum combatente ativo.": "No active combatant.",
  "Turnos...": "Turns...",
  "Buscar monstro...": "Search monsters...",
  "Escolha do grupo/combate ou digite": "Choose from the party/combat or type a name",
  "Escolha um combatente ou digite (ex: Armadilha)": "Choose a combatant or type a name (e.g. Trap)",
  "Escolha um combatente ou digite (ex: Fonte sagrada)": "Choose a combatant or type a name (e.g. Holy spring)",
  "Valor final": "Final value",
  "Valor em turnos": "Duration in turns",
  "Ex: Aragorn": "e.g. Aragorn",
  "Ex: Guerreiro, Mago...": "e.g. Fighter, Wizard...",
  "Ex: Dragão da Caverna": "e.g. Cave Dragon",
  "Ex: 1, 1/2, 5...": "e.g. 1, 1/2, 5...",
  "Ex: 250": "e.g. 250",
  "Ex: 1000": "e.g. 1000",
  "Ex: Golpe de Escudo": "e.g. Shield Bash",
  "Ex: Bola de Fogo": "e.g. Fireball",
  "...vai tentar abrir a porta": "...tries to open the door",
  "Selecionar d4": "Select d4",
  "Selecionar d6": "Select d6",
  "Selecionar d8": "Select d8",
  "Selecionar d10": "Select d10",
  "Selecionar d12": "Select d12",
  "Selecionar d20": "Select d20",
  "Selecionar d100": "Select d100",
  "Morto-Vivo": "Undead",
  "Na aba": "In the",
  ": escolha o dado clicando no ícone, ajuste Quantidade/Modificador e toque em \"Rolar Dado\". O resultado aparece ao lado e fica registrado em \"Últimas Rolagens\".": ": choose a die by clicking its icon, set Quantity/Modifier, and click \"Roll Dice\". The result appears beside it and is recorded in \"Recent Rolls\".",
  "Em": "In",
  ", os botões": ", the buttons",
  " abrem uma janela pedindo o modificador e rolam um d20, já lançando o resultado colorido no histórico. Cada uma tem um campo opcional de ": " open a window for the modifier and roll a d20, adding the color-coded result to the log. Each has an optional ",
  " — escolha alguém do grupo/combate ou digite um nome — que aparece na mensagem do histórico. O botão ": " — choose someone from the party/combat or enter a name — which appears in the log message. The ",
  " abre um rolador dedicado a testes de personagens específicos.": " button opens a dedicated roller for checks made by specific characters.",
  "Use ": "Use ",
  " para buscar na coletânea ou criar um monstro customizado — ao adicionar, é pedida a iniciativa dele. Monstros customizados podem ser ": " to search the collection or create a custom monster — you will be prompted for its initiative when adding it. Custom monsters can be ",
  " (✎) ou removidos (✕) na coletânea. Cada combatente vira um card com CA, HP e condições ativas, exibidos em ordem de iniciativa. A faixa \"Ordem da Iniciativa\" permite pular direto para o turno de qualquer combatente. ": " (✎) or removed (✕) from the collection. Each combatant appears on a card with AC, HP, and active conditions, sorted by initiative. The \"Initiative Order\" strip lets you jump to any combatant's turn. ",
  " limpa a lista e reinicia o contador de rodada.": " clears the list and resets the round counter.",
  " e ": " and ",
  " avançam a iniciativa entre os combatentes vivos; ao completar uma volta, o contador \"RODADA\" no topo avança e as condições/efeitos temporários são decrementados automaticamente.": " advance initiative among living combatants. When everyone has taken a turn, the \"ROUND\" counter at the top advances and conditions and temporary effects are reduced automatically.",
  "O card do combatente ativo tem botões de ": "The active combatant's card has ",
  ", além do ícone de caveira para marcar como morto/nocauteado. Condições ativas de duração limitada expiram sozinhas e avisam no histórico quando estão prestes a acabar.": " buttons, as well as a skull icon to mark them dead or unconscious. Timed conditions expire automatically and the log warns when they are about to end.",
  " abre a etapa de acerto (que pode ser desligada em Configurações) e depois o dano. No modal de dano dá para informar o ": " opens the attack roll step (which can be disabled in Settings), followed by damage. In the damage dialog, you can enter the ",
  " (ex.: golpe de escudo que atordoa) — tudo vai para o histórico. ": " (e.g. a shield bash that stuns) — everything is added to the log. ",
  " deixa escolher quem curar; curar alguém a 0 HP o traz de volta (reviver/tirar do nocaute). Nos modais de dano e cura há um botão ": " lets you choose who to heal; healing someone at 0 HP brings them back (revived or no longer unconscious). The damage and healing dialogs have a ",
  " que liga/desliga a duplicação do valor (acerto/cura crítico) — nunca é automático, para não conflitar com sistemas sem essa regra. Ele acende quando acionado e fica realçado quando o acerto rolado foi crítico.": " button to toggle doubled values (critical hit/heal). This is never automatic, so it works with systems that do not use that rule. It lights up when enabled and is highlighted when the attack roll was critical.",
  " aplicam valor a vários de uma vez. Dá para indicar a ": " apply a value to multiple targets at once. You can specify the ",
  " do dano / o ": " for damage or the ",
  " (escolhido da lista ou digitado, ex.: \"Armadilha\", \"Fonte sagrada\") e o nome da magia/habilidade (ex.: \"Bola de Fogo\"), que aparecem no histórico.": " (choose from the list or type one, e.g. \"Trap\" or \"Holy spring\") and a spell/ability name (e.g. \"Fireball\"); these appear in the log.",
  " cadastra nome, classe, nível (começa em 0), HP, CA, EXP, cor e imagem. Cada card de herói tem ": " lets you enter a name, class, level (starts at 0), HP, AC, XP, color, and image. Each hero card has ",
  " para entrar em combate e ": " to join combat and ",
  " para lançar experiência ganha — o herói sobe de nível automaticamente ao atingir a meta, que também pode ser reajustada ali mesmo para o próximo nível. HP temporário pode ser ajustado direto no card.": " to add earned XP — heroes level up automatically when they reach the goal, which can also be adjusted there for the next level. Temporary HP can be adjusted right on the card.",
  "Registra automaticamente tudo que acontece na mesa — dano, cura, condições, turnos, rolagens e mais — cada tipo de evento com sua própria cor para facilitar a leitura. Ações dos heróis (entrar em combate, subir de nível) saem na cor do próprio herói. Há também um campo para anotar algo manualmente no histórico. ": "Automatically records everything that happens at the table — damage, healing, conditions, turns, rolls, and more — with a different color for each event type. Hero actions (joining combat, leveling up) use the hero's color. You can also add a manual note to the log. ",
  " apaga os registros.": " clears the entries.",
  "Na aba \"Anotações\", ao lado dos Dados, há um campo de texto livre para anotar o que quiser durante a sessão.": "The \"Notes\" tab beside Dice has a free-text field for anything you want to write during the session.",
  "Defina o nome da campanha e do mestre (aparecem no cabeçalho), exporte a sessão inteira para um arquivo .json (backup) ou importe um arquivo salvo anteriormente. ": "Set the campaign and game master names (shown in the header), export the entire session to a .json backup, or import a previously saved file. ",
  " reseta o app por completo.": " completely resets the app.",
  "Dica: use o botão ": "Tip: use the ",
  " no topo para trocar o tema a qualquer momento.": " button at the top to switch themes at any time.",
  "Bárbaro": "Barbarian",
  "Anão": "Dwarf",
  "Anão Guerreiro": "Dwarf Warrior",
  "Rei Anão": "Dwarf King",
  "Elfo Guerreiro": "Elf Warrior",
  "Elfa": "Elf",
  "Bruxo": "Warlock",
  "Bruxa": "Witch",
  "Clériga": "Cleric",
  "Encapuzado": "Hooded Figure",
  "Carrasco": "Executioner",
  "Elmo Barbuto": "Barbute Helmet",
  "Elmo Brutal": "Brutal Helmet",
  "Elmo com Viseira": "Visored Helmet",
  "Agarrado": "Grappled",
  "Amedrontado": "Frightened",
  "Atordoado": "Stunned",
  "Caído": "Prone",
  "Cego": "Blinded",
  "Enfeitiçado": "Charmed",
  "Envenenado": "Poisoned",
  "Impedido": "Restrained",
  "Incapacitado": "Incapacitated",
  "Invisível": "Invisible",
  "Paralisado": "Paralyzed",
  "Petrificado": "Petrified",
  "Surdo": "Deafened",
  "Exaustão": "Exhaustion",
  "Deslocamento vira 0. O efeito termina se quem agarrou ficar incapacitado ou o alvo escapar mecanicamente.": "Speed becomes 0. The effect ends if the grappler is incapacitated or the target escapes.",
  "Desvantagem em ataques e testes enquanto a fonte do medo estiver visível. Não pode se aproximar dela.": "Disadvantage on attacks and ability checks while the source of fear is visible. Cannot willingly move closer to it.",
  "Incapacitado, não pode se mover, fala balbuciante. Ataques contra ele têm vantagem.": "Incapacitated, cannot move, and can speak only falteringly. Attacks against it have advantage.",
  "Só pode rastejar. Ataques próprios com desvantagem. Ataques corpo a corpo contra si com vantagem, distância com desvantagem.": "Can only crawl. Disadvantage on its attacks. Melee attacks against it have advantage; ranged attacks have disadvantage.",
  "Falha em testes que dependem de visão. Ataques próprios com desvantagem, ataques contra si com vantagem.": "Automatically fails checks that rely on sight. Its attacks have disadvantage, and attacks against it have advantage.",
  "Não pode atacar o encantador. O encantador tem vantagem em interações sociais com o alvo.": "Cannot attack the charmer. The charmer has advantage on social interactions with the target.",
  "Desvantagem em jogadas de ataque e testes de habilidade.": "Disadvantage on attack rolls and ability checks.",
  "Deslocamento vira 0. Ataques contra si com vantagem, próprios com desvantagem. Desvantagem em saves de Destreza.": "Speed becomes 0. Attacks against it have advantage, its attacks have disadvantage, and it has disadvantage on Dexterity saving throws.",
  "Não pode realizar ações, ações bônus ou reações.": "Cannot take actions, bonus actions, or reactions.",
  "Impossível de ver sem sentidos especiais. Ataques próprios com vantagem, ataques contra si com desvantagem.": "Impossible to see without special senses. Its attacks have advantage, and attacks against it have disadvantage.",
  "Incapacitado, não se move nem fala. Falha automática em saves de For/Des. Acertos adjacentes são críticos.": "Incapacitated, cannot move or speak, and automatically fails Strength and Dexterity saving throws. Attacks from within 5 feet are critical hits.",
  "Transformado em pedra. Incapacitado, peso ×10, resistente a todo dano.": "Turned to stone. Incapacitated, weight multiplied by 10, and resistant to all damage.",
  "Não pode ouvir. Falha automática em testes baseados em audição.": "Cannot hear and automatically fails checks that require hearing.",
  "Condição cumulativa. Níveis crescentes afetam testes e velocidade, podendo levar à morte no nível máximo.": "Cumulative condition. Increasing levels affect checks and speed and can eventually cause death.",
  "Troglodita": "Troglodyte",
  "Bandido": "Bandit",
  "Capitão Bandido": "Bandit Captain",
  "Guarda": "Guard",
  "Veterano": "Veteran",
  "Fanático Cultista": "Cult Fanatic",
  "Besta-fera de Caerbannog": "The Beast of Caerbannog",
  "Esqueleto": "Skeleton",
  "Zumbi": "Zombie",
  "Sombra": "Shadow",
  "Espectro": "Specter",
  "Fantasma": "Ghost",
  "Múmia": "Mummy",
  "Senhor Múmia": "Mummy Lord",
  "Morto-Vivo Carcaça": "Revenant",
  "Rato Gigante": "Giant Rat",
  "Morcego Gigante": "Giant Bat",
  "Aranha Gigante": "Giant Spider",
  "Lobo Gigante": "Dire Wolf",
  "Urso Pardo": "Brown Bear",
  "Urso Polar Gigante": "Polar Bear",
  "Escorpião Gigante": "Giant Scorpion",
  "Tubarão Gigante": "Giant Shark",
  "Leão": "Lion",
  "Grifo": "Griffon",
  "Hipogrifo": "Hippogriff",
  "Quimera": "Chimera",
  "Basilisco": "Basilisk",
  "Minotauro": "Minotaur",
  "Centauro": "Centaur",
  "Ciclope": "Cyclops",
  "Harpia": "Harpy",
  "Hidra": "Hydra",
  "Mantícora": "Manticore",
  "Ogro": "Ogre",
  "Gigante da Colina": "Hill Giant",
  "Gigante de Pedra": "Stone Giant",
  "Gigante do Gelo": "Frost Giant",
  "Gigante do Fogo": "Fire Giant",
  "Gigante das Nuvens": "Cloud Giant",
  "Gigante da Tempestade": "Storm Giant",
  "Elemental do Ar": "Air Elemental",
  "Elemental da Terra": "Earth Elemental",
  "Elemental do Fogo": "Fire Elemental",
  "Elemental da Água": "Water Elemental",
  "Mefito de Lama": "Mud Mephit",
  "Mefito de Fumaça": "Smoke Mephit",
  "Mefito de Vapor": "Steam Mephit",
  "Homúnculo": "Homunculus",
  "Estátua Animada": "Animated Armor",
  "Golem de Argila": "Clay Golem",
  "Golem de Pedra": "Stone Golem",
  "Golem de Ferro": "Iron Golem",
  "Golem de Carne": "Flesh Golem",
  "Escudo Guardião": "Shield Guardian",
  "Dragão Filhote Branco": "White Dragon Wyrmling",
  "Dragão Filhote Preto": "Black Dragon Wyrmling",
  "Dragão Filhote Verde": "Green Dragon Wyrmling",
  "Dragão Filhote Azul": "Blue Dragon Wyrmling",
  "Dragão Filhote Vermelho": "Red Dragon Wyrmling",
  "Dragão Jovem Branco": "Young White Dragon",
  "Dragão Jovem Preto": "Young Black Dragon",
  "Dragão Jovem Verde": "Young Green Dragon",
  "Dragão Jovem Azul": "Young Blue Dragon",
  "Dragão Jovem Vermelho": "Young Red Dragon",
  "Dragão Adulto Branco": "Adult White Dragon",
  "Dragão Adulto Preto": "Adult Black Dragon",
  "Dragão Adulto Verde": "Adult Green Dragon",
  "Dragão Adulto Azul": "Adult Blue Dragon",
  "Dragão Adulto Vermelho": "Adult Red Dragon",
  "Dragão Ancião Branco": "Ancient White Dragon",
  "Dragão Ancião Vermelho": "Ancient Red Dragon",
  "Dragão Ancião Azul": "Ancient Blue Dragon",
  "Pseudodragão": "Pseudodragon",
  "Abissal": "Abyssal",
  "Do computador": "From computer",
  "Enviar uma imagem do computador": "Upload an image from your computer",
  "Imagem atual (enviada do computador)": "Current image (uploaded from computer)",
  "Sem imagem (usa a inicial do nome)": "No image (uses the first letter of the name)",
  "Editar monstro": "Edit monster",
  "Remover da coletânea": "Remove from collection",
  "custom": "custom",
  "CURRENT": "CURRENT",
  "TURNO ATUAL": "CURRENT TURN",
  "Nenhuma condição ativa.": "No active conditions.",
  "Nenhum commit encontrado.": "No commits found.",
  "Carregando atualizações...": "Loading updates...",
  "Exibindo os": "Showing the",
  " commits mais recentes.": " most recent commits.",
  "Deseja remover este monstro da coletânea?": "Remove this monster from the collection?",
  "Deseja realmente limpar todo o combate?": "Are you sure you want to clear the entire combat?",
  "Remover combatente do combate": "Remove combatant from combat",
  "Use o ícone × no card de um combatente para removê-lo do combate sem encerrá-lo; repita para remover outros combatentes.": "Use the × icon on a combatant's card to remove them from combat without ending it; repeat to remove other combatants.",
  "Deseja realmente remover este herói da party?": "Are you sure you want to remove this hero from the party?",
  "Deseja realmente limpar o histórico da sessão?": "Are you sure you want to clear the session log?",
  "Isso apagará TODOS os dados. Tem certeza?": "This will delete ALL data. Are you sure?",
  "Segunda confirmação: não pode ser desfeito!": "Final confirmation: this cannot be undone!",
  "Arquivo inválido.": "Invalid file.",
  "Sessão importada com sucesso!": "Session imported successfully!",
  "Não há combatentes no combate!": "There are no combatants in combat!",
  "Selecione pelo menos um alvo!": "Select at least one target!",
  "Selecione ao menos um alvo para comparar com a CA.": "Select at least one target to compare against AC.",
  "Selecione um arquivo de imagem.": "Select an image file.",
  "Autor desconhecido": "Unknown author",
  "Data indisponível": "Date unavailable",
  "Modo Dark": "Dark Mode",
  "Modo Light": "Light Mode",
  " Modo Dark": " Dark Mode",
  " Modo Light": " Light Mode",
  "Lobo": "Wolf",
  "Pantera": "Panther",
  "Tigre": "Tiger",
  "Mamute": "Mammoth",
  "Crocodilo": "Crocodile",
  "Crocodilo Gigante": "Giant Crocodile",
};

const conditionLabels = [
  "Agarrado",
  "Amedrontado",
  "Atordoado",
  "Caído",
  "Cego",
  "Enfeitiçado",
  "Envenenado",
  "Impedido",
  "Incapacitado",
  "Invisível",
  "Paralisado",
  "Petrificado",
  "Surdo",
  "Exaustão"
];
const conditionLabelPattern = conditionLabels.join("|");

const prefixes = [
  ["Mestre: ", "GM: "],
  ["Ini: ", "Init: "],
  ["HP Temp:", "Temp HP:"],
  ["CA: ", "AC: "],
  ["ATUAL", "CURRENT"],
  ["⚔️ Aplicar Dano", "⚔️ Apply Damage"],
  ["💊 Aplicar Cura", "💊 Apply Healing"]
];

const originalText = new WeakMap();
const originalAttributes = new WeakMap();
let currentLanguage = "pt-BR";

function isUserContent(element) {
  if (!element) return false;
  return Boolean(element.closest(
    "#header-campanha, .card-heroi-nome, .item-iniciativa-nome, .turno-ativo-nome, .area-alvo-nome, .acerto-alvo-nome"
  ) || (element.closest(".item-monstro-custom") && element.closest(".item-monstro-nome")));
}

function translateCombatantName(name) {
  if (translations[name] !== undefined) return translations[name];
  const numberedName = name.match(/^(.+?) ([A-Z])$/);
  if (numberedName && translations[numberedName[1]] !== undefined) {
    return `${translations[numberedName[1]]} ${numberedName[2]}`;
  }
  return name;
}

function translateAreaTargets(targets) {
  return targets.split(", ").map(target => {
    const match = target.match(/^(.+?) \((\d+)→(\d+)\)$/);
    return match
      ? `${translateCombatantName(match[1])} (${match[2]}→${match[3]})`
      : target;
  }).join(", ");
}

function translateAttackTargets(targets) {
  if (!targets) return "";
  const entries = targets.slice(" contra ".length).split(", ").map(target => {
    const match = target.match(/^(.+?)(?: — (Acertou|Errou)!)?$/);
    if (!match) return target;
    const result = match[2] === "Acertou" ? " — Hit!" : match[2] === "Errou" ? " — Miss!" : "";
    return `${translateCombatantName(match[1])}${result}`;
  });
  return ` against ${entries.join(", ")}`;
}

function translateAreaSource(source, areaLabel) {
  if (source === areaLabel) return areaLabel === "Dano em área" ? "Area Damage" : "Area Healing";
  if (areaLabel === "Cura em área" && source.endsWith(" curou")) {
    return `${translateCombatantName(source.slice(0, -" curou".length))} healed`;
  }
  const [name, ability] = source.split(" — ");
  const translatedName = translateCombatantName(name);
  return ability === undefined ? translatedName : `${translatedName} — ${ability}`;
}

function translateValue(text) {
  const exact = translations[text];
  if (exact !== undefined) return exact;
  const prefix = prefixes.find(([source]) => text.startsWith(source));
  if (prefix) return prefix[1] + text.slice(prefix[0].length);
  const patterns = [
    [/^⚔️ (.+) usou (.+) e causou (\d+) de dano em (.+)! \((\d+) → (\d+) HP\)$/, (_, attacker, attack, damage, target, hpBefore, hpAfter) =>
      `⚔️ ${translateCombatantName(attacker)} used ${attack} and dealt ${damage} damage to ${translateCombatantName(target)}! (${hpBefore} → ${hpAfter} HP)`],
    [/^⚔️ (.+) causou (\d+) de dano em (.+)! \((\d+) → (\d+) HP\)$/, (_, attacker, damage, target, hpBefore, hpAfter) =>
      `⚔️ ${translateCombatantName(attacker)} dealt ${damage} damage to ${translateCombatantName(target)}! (${hpBefore} → ${hpAfter} HP)`],
    [/^⚔️ (.+) recebeu (\d+) de dano \((.+)\) \((\d+) → (\d+) HP\)$/, (_, target, damage, attack, hpBefore, hpAfter) =>
      `⚔️ ${translateCombatantName(target)} took ${damage} damage (${attack}) (${hpBefore} → ${hpAfter} HP)`],
    [/^⚔️ (.+) recebeu (\d+) de dano \((\d+) → (\d+) HP\)$/, (_, target, damage, hpBefore, hpAfter) =>
      `⚔️ ${translateCombatantName(target)} took ${damage} damage (${hpBefore} → ${hpAfter} HP)`],
    [/^💊 (.+) recuperou (\d+) de HP \((\d+) → (\d+) HP\)$/, (_, target, healing, hpBefore, hpAfter) =>
      `💊 ${translateCombatantName(target)} recovered ${healing} HP (${hpBefore} → ${hpAfter} HP)`],
    [/^💥 (.+) \((\d+)\): (.+)$/, (_, source, damage, targets) =>
      `💥 ${translateAreaSource(source, "Dano em área")} (${damage}): ${translateAreaTargets(targets)}`],
    [/^💚 (.+) \((\d+)\): (.+)$/, (_, source, healing, targets) =>
      `💚 ${translateAreaSource(source, "Cura em área")} (${healing}): ${translateAreaTargets(targets)}`],
    [/^💚 (.+) está nocauteado! \((\d+) HP\)$/, (_, name, hp) =>
      `💚 ${translateCombatantName(name)} is unconscious! (${hp} HP)`],
    [/^😵 (.+) está nocauteado! \((\d+) HP\)$/, (_, name, hp) =>
      `😵 ${translateCombatantName(name)} is unconscious! (${hp} HP)`],
    [/^💀 (.+) chegou a (\d+) HP!$/, (_, name, hp) =>
      `💀 ${translateCombatantName(name)} reached ${hp} HP!`],
    [/^💪 (.+) se recuperou do nocaute!$/, (_, name) =>
      `💪 ${translateCombatantName(name)} recovered from being knocked out!`],
    [/^💚 (.+) voltou à vida com a cura!$/, (_, name) =>
      `💚 ${translateCombatantName(name)} was brought back to life with healing!`],
    [/^🏳️ Combate encerrado!$/, "🏳️ Combat ended!"],
    [/^((?:🎲|🎯|🛡️)) (.+?) — (Iniciativa|Teste de Perícia|Teste de Resistência): (SUCESSO CRÍTICO! |FALHA CRÍTICA! )?(1d20: .+)$/, (_, emoji, character, action, critical, roll) =>
      `${emoji} ${translateCombatantName(character)} — ${action === "Iniciativa" ? "Initiative" : action === "Teste de Perícia" ? "Ability Check" : "Saving Throw"}: ${critical ? critical === "SUCESSO CRÍTICO! " ? "CRITICAL SUCCESS! " : "CRITICAL FAILURE! " : ""}${roll}`],
    [/^((?:🎲|🎯|🛡️)) (.+?): (SUCESSO CRÍTICO! |FALHA CRÍTICA! )?(1d20: .+)$/, (_, emoji, action, critical, roll) =>
      `${emoji} ${action === "Iniciativa" ? "Initiative" : action === "Teste de Perícia" ? "Ability Check" : action === "Teste de Resistência" ? "Saving Throw" : action}: ${critical ? critical === "SUCESSO CRÍTICO! " ? "CRITICAL SUCCESS! " : "CRITICAL FAILURE! " : ""}${roll}`],
    [/^📜 (.+) e rolou (\d+) \((\d+d\d+: .+)\)$/, (_, event, total, formula) =>
      `📜 ${event} and rolled ${total} (${formula})`],
    [/^🎯 (.+) rolou acerto( contra .+)?\: (\d+) (.+)$/, (_, attacker, targets = "", total, formula) =>
      `🎯 ${translateCombatantName(attacker)} rolled an attack${translateAttackTargets(targets)}: ${total} ${formula}`],
    [/^⚔️ SUCESSO CRÍTICO! Rolou (.+)$/, "⚔️ CRITICAL SUCCESS! Rolled $1"],
    [/^💀 FALHA CRÍTICA! Rolou (.+)$/, "💀 CRITICAL FAILURE! Rolled $1"],
    [/^Rolou (.+)$/, "Rolled $1"],
    [new RegExp(`^(\\S+) (.+) recebeu: (${conditionLabelPattern}) \\((\\d+) turnos?\\)$`), (_, emoji, name, condition, turns) =>
      `${emoji} ${translateCombatantName(name)} gained: ${translations[condition]} (${turns} ${turns === "1" ? "turn" : "turns"})`],
    [new RegExp(`^(\\S+) (.+) recebeu: (${conditionLabelPattern}) \\(indefinido\\)$`), (_, emoji, name, condition) =>
      `${emoji} ${translateCombatantName(name)} gained: ${translations[condition]} (indefinite)`],
    [new RegExp(`^✅ (.+) se recuperou de: (${conditionLabelPattern})$`), (_, name, condition) =>
      `✅ ${translateCombatantName(name)} recovered from: ${translations[condition]}`],
    [new RegExp(`^⚠️ (.+): "(${conditionLabelPattern})" expira no próximo turno!$`), (_, name, condition) =>
      `⚠️ ${translateCombatantName(name)}: "${translations[condition]}" expires next turn!`],
    [new RegExp(`^⏰ (.+): condição "(${conditionLabelPattern})" expirou!$`), (_, name, condition) =>
      `⏰ ${translateCombatantName(name)}: condition "${translations[condition]}" expired!`],
    [/^⏰ Efeito expirado: "(.+)"$/, '⏰ Effect expired: "$1"'],
    [/^⚠️ "(.+)" expira no próximo turno!$/, '⚠️ "$1" expires next turn!'],
    [new RegExp(`^(.+?) (${conditionLabelPattern}) — (.+)$`), (_, emoji, condition, name) =>
      `${emoji} ${translations[condition]} — ${name}`],
    [new RegExp(`^(.+?) (${conditionLabelPattern})(?: \\((\\d+) turnos?\\))?$`), (_, emoji, condition, turns) =>
      `${emoji} ${translations[condition]}${turns ? ` (${turns} ${turns === "1" ? "turn" : "turns"})` : ""}`],
    [/^Marcar "(.+)" como morto\?$/, 'Mark "$1" as dead?'],
    [/^Nocautear "(.+)"\?$/, 'Knock out "$1"?'],
    [/^Deseja remover "(.+)" do combate\?$/, 'Remove "$1" from combat?'],
    [/^Importar sessão "(.+)" de (.+)\?\nIsso substituirá os dados atuais\.$/, 'Import session "$1" from $2?\nThis will replace the current data.'],
    [/^Exibindo os (\d+) commits mais recentes\.$/, "Showing the $1 most recent commits."],
    [/^🔄 Rodada (\d+) iniciada!$/, "🔄 Round $1 started!"],
    [/^🔄 (.+) atualizou iniciativa para (\d+)$/, (_, name, initiative) =>
      `🔄 ${translateCombatantName(name)} updated initiative to ${initiative}`],
    [/^🦸 (.+) entrou no combate! \(Ini: (\d+) \| HP: (\d+)\)$/, (_, name, initiative, hp) =>
      `🦸 ${translateCombatantName(name)} joined combat! (Init: ${initiative} | HP: ${hp})`],
    [/^🦸 (.+) entrou no combate! \(Ini: (\d+) \| HP: (\d+) \| CA: (.+)\)$/, (_, name, initiative, hp, ac) =>
      `🦸 ${translateCombatantName(name)} joined combat! (Init: ${initiative} | HP: ${hp} | AC: ${ac})`],
    [/^⚔️ (.+) entrou no combate! \(Ini: (\d+) \| HP: (\d+)\)$/, (_, name, initiative, hp) =>
      `⚔️ ${translateCombatantName(name)} joined combat! (Init: ${initiative} | HP: ${hp})`],
    [/^⚔️ (.+) entrou no combate! \(Ini: (\d+) \| HP: (\d+) \| CA: (.+)\)$/, (_, name, initiative, hp, ac) =>
      `⚔️ ${translateCombatantName(name)} joined combat! (Init: ${initiative} | HP: ${hp} | AC: ${ac})`],
    [/^💚 (.+) foi revivido!$/, (_, name) => `💚 ${translateCombatantName(name)} was revived!`],
    [/^☠️ (.+) morreu!$/, (_, name) => `☠️ ${translateCombatantName(name)} died!`],
    [/^😵 (.+) foi nocauteado!$/, (_, name) => `😵 ${translateCombatantName(name)} was knocked out!`],
    [/^🗑️ (.+) foi removido do combate\.$/, (_, name) => `🗑️ ${translateCombatantName(name)} was removed from combat.`],
    [/^📈 (.+) subiu para o nível (\d+)!$/, "📈 $1 reached level $2!"],
    [/^(.+) recebeu: (.+) \((\d+) turnos?\)$/, "$1 gained: $2 ($3 turn(s))"],
    [/^⚠️ (.+): "(.+)" expira no próximo turno!$/, "⚠️ $1: \"$2\" expires next turn!"],
    [/^⏰ (.+): condição "(.+)" expirou!$/, "⏰ $1: condition \"$2\" expired!"],
    [/^Nível atual: (\d+)$/, "Current level: $1"],
    [/^EXP atual: ([\d,.\s]+) \/ ([\d,.\s]+)$/, "Current XP: $1 / $2"],
    [/^Resultado: (.+)$/, "Result: $1"],
    [/^Não foi possível carregar as atualizações\.(.*)Tente novamente ao reabrir esta janela\.$/, "Could not load updates.$1Try again by reopening this window."],
    [/^Combate — /, "Combat — "],
    [/^EXP — /, "XP — "],
    [/^Não foi possível carregar a imagem: /, "Could not load image: "],
    [/^⚔️ Atacante: /, "⚔️ Attacker: "]
  ];
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }
  return undefined;
}

function translateTextNode(node) {
  if (isUserContent(node.parentElement)) return;
  const current = node.nodeValue;
  let state = originalText.get(node);
  if (!state || current !== state.rendered) {
    state = { source: current, rendered: current };
  }
  if (currentLanguage === "en") {
    const leading = state.source.match(/^\s*/)[0];
    const exactTranslation = translations[state.source];
    const translationAfterLeadingWhitespace = translations[state.source.slice(leading.length)];
    const translated = exactTranslation
      ?? (translationAfterLeadingWhitespace !== undefined
        ? leading + translationAfterLeadingWhitespace
        : translateValue(state.source.trim()));
    if (translated !== undefined) {
      state.rendered = exactTranslation !== undefined || translationAfterLeadingWhitespace !== undefined
        ? translated
        : leading + translated + state.source.match(/\s*$/)[0];
      if (current !== state.rendered) node.nodeValue = state.rendered;
    }
  } else {
    state.rendered = state.source;
    if (current !== state.source) node.nodeValue = state.source;
  }
  originalText.set(node, state);
}

function translateAttributes(element) {
  if (isUserContent(element)) return;
  const attributes = ["placeholder", "title", "aria-label", "alt"];
  let state = originalAttributes.get(element);
  if (!state) {
    state = {};
    originalAttributes.set(element, state);
  }
  for (const attribute of attributes) {
    if (!element.hasAttribute(attribute)) continue;
    const current = element.getAttribute(attribute);
    let entry = state[attribute];
    if (!entry || current !== entry.rendered) entry = { source: current, rendered: current };
    const translated = currentLanguage === "en" ? translations[entry.source] : entry.source;
    if (translated !== undefined) {
      entry.rendered = translated;
      if (current !== translated) element.setAttribute(attribute, translated);
    }
    state[attribute] = entry;
  }
}

function translateTree(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(translateTextNode);
  if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
  root.querySelectorAll?.("*").forEach(translateAttributes);
}

export function idiomaAtual() {
  return currentLanguage;
}

export function traduzir(texto) {
  if (currentLanguage !== "en" || typeof texto !== "string") return texto;
  return translateValue(texto) ?? texto;
}

export function initIdioma() {
  const button = document.getElementById("btn-idioma");
  if (!button) return;
  const buttonLabel = button.querySelector("span");
  if (!buttonLabel) return;

  currentLanguage = localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "pt-BR";
  const applyLanguage = () => {
    document.documentElement.lang = currentLanguage;
    buttonLabel.textContent = currentLanguage === "en" ? "EN" : "PT";
    button.setAttribute("aria-label", currentLanguage === "en" ? "Switch to Portuguese" : "Switch to English");
    document.title = currentLanguage === "en" ? "Master Shield RPG — Game Master Tools" : "Master Shield RPG";
    const description = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    const englishDescription = "A game master toolkit for dice rolls, combat and initiative tracking, conditions, party management, and session logs.";
    if (description) {
      description.content = currentLanguage === "en"
        ? englishDescription
        : "O escudo por trás da tela: ferramenta para mestres de RPG (D&D 5e e sistemas d20). Rolador de dados, controle de combate e iniciativa, condições, grupo de heróis e histórico da sessão. Roda no navegador, sem cadastro.";
    }
    if (ogDescription) ogDescription.content = currentLanguage === "en" ? englishDescription : description?.content || "";
    if (twitterDescription) twitterDescription.content = currentLanguage === "en" ? englishDescription : description?.content || "";
    if (ogLocale) ogLocale.content = currentLanguage === "en" ? "en_US" : "pt_BR";
    translateTree();
  };

  const observer = new MutationObserver((changes) => {
    changes.forEach((change) => {
      if (change.type === "characterData") translateTextNode(change.target);
      else if (change.type === "attributes") translateAttributes(change.target);
      else change.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
        else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
      });
    });
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label", "alt"]
  });

  applyLanguage();
  const nativeAlert = window.alert.bind(window);
  const nativeConfirm = window.confirm.bind(window);
  window.alert = (message) => nativeAlert(traduzir(String(message)));
  window.confirm = (message) => nativeConfirm(traduzir(String(message)));
  button.addEventListener("click", () => {
    currentLanguage = currentLanguage === "en" ? "pt-BR" : "en";
    localStorage.setItem(STORAGE_KEY, currentLanguage === "en" ? "en" : "pt-BR");
    applyLanguage();
  });
}
