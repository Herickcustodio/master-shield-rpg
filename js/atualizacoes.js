const API_COMMITS = "https://api.github.com/repos/Herickcustodio/master-shield-rpg/commits?per_page=10";

function criarItemAtualizacao(commit) {
  const item = document.createElement("li");
  item.className = "atualizacao-item";

  const mensagem = document.createElement("a");
  mensagem.className = "atualizacao-mensagem";
  mensagem.href = commit.html_url;
  mensagem.target = "_blank";
  mensagem.rel = "noopener noreferrer";
  mensagem.textContent = commit.commit.message.trim();

  const autor = commit.commit.author?.name
    || commit.commit.committer?.name
    || commit.author?.login
    || "Autor desconhecido";
  const dataCommit = commit.commit.author?.date || commit.commit.committer?.date;
  const data = dataCommit
    ? new Date(dataCommit).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : "Data indisponível";
  const detalhes = document.createElement("p");
  detalhes.className = "atualizacao-detalhes";
  detalhes.textContent = `${autor} · ${data}`;

  item.append(mensagem, detalhes);
  return item;
}

export function initAtualizacoes() {
  const botao = document.getElementById("btn-atualizacoes");
  const status = document.getElementById("atualizacoes-status");
  const lista = document.getElementById("lista-atualizacoes");
  let carregada = false;
  let carregando = false;

  async function carregarAtualizacoes() {
    if (carregada || carregando) return;

    carregando = true;
    status.textContent = "Carregando atualizações...";
    lista.replaceChildren();

    try {
      const resposta = await fetch(API_COMMITS, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!resposta.ok) {
        throw new Error(`O GitHub respondeu com o erro ${resposta.status}.`);
      }

      const commits = await resposta.json();
      if (!Array.isArray(commits)) {
        throw new Error("O GitHub retornou uma resposta inesperada.");
      }

      lista.replaceChildren(...commits.map(criarItemAtualizacao));
      status.textContent = commits.length
        ? `Exibindo os ${commits.length} commits mais recentes.`
        : "Nenhum commit encontrado.";
      carregada = true;
    } catch (erro) {
      status.textContent = `Não foi possível carregar as atualizações. ${erro.message} Tente novamente ao reabrir esta janela.`;
    } finally {
      carregando = false;
    }
  }

  botao.addEventListener("click", carregarAtualizacoes);
}
