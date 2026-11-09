// Página de leitura: exibe as inscrições existentes, sem editar ou excluir dados.
// A rota /organizacao/ e a API de inscritos exigem usuário organizador autenticado.
const busca = document.getElementById('buscar-inscrito');
const filtroEvento = document.getElementById('filtrar-evento');
const atualizar = document.getElementById('atualizar-inscritos');
const resumo = document.getElementById('resumo-organizacao');
const statusPagina = document.getElementById('status-organizacao');
const corpo = document.getElementById('corpo-inscritos');

let todasInscricoes = [];

async function buscarJson(url) {
    const resposta = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
    if (resposta.status === 401 || resposta.status === 403) {
        throw new Error('Acesso restrito. Entre como organizador para visualizar os inscritos.');
    }
    if (!resposta.ok) {
        throw new Error(`Não foi possível buscar as inscrições (HTTP ${resposta.status}).`);
    }
    return resposta.json();
}

function formatarData(valor) {
    if (!valor) return '—';
    const data = new Date(valor);
    return Number.isNaN(data.getTime())
        ? '—'
        : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function mostrarMensagem(texto) {
    const linha = document.createElement('tr');
    const celula = document.createElement('td');
    celula.colSpan = 6;
    celula.textContent = texto;
    linha.appendChild(celula);
    corpo.appendChild(linha);
}

function exibirTabela() {
    const termo = busca.value.trim().toLocaleLowerCase('pt-BR');
    const eventoId = filtroEvento.value;
    const filtradas = todasInscricoes.filter(registro => {
        const campos = [registro.nome, registro.email, registro.evento];
        return (!eventoId || String(registro.eventoId) === eventoId) &&
            campos.some(valor => String(valor).toLocaleLowerCase('pt-BR').includes(termo));
    });

    corpo.replaceChildren();
    resumo.textContent = `${filtradas.length} inscrição(ões) exibida(s) de ${todasInscricoes.length} no total.`;

    if (!filtradas.length) {
        mostrarMensagem(todasInscricoes.length ? 'Nenhuma inscrição encontrada com esses filtros.' : 'Ainda não há inscrições cadastradas.');
        return;
    }

    filtradas.forEach(registro => {
        const linha = document.createElement('tr');
        [registro.id, registro.nome, registro.email, registro.evento, registro.situacao, formatarData(registro.data)]
            .forEach(valor => {
                const celula = document.createElement('td');
                // Dados dos participantes sempre como texto, sem interpretar HTML.
                celula.textContent = String(valor ?? '—');
                linha.appendChild(celula);
            });
        corpo.appendChild(linha);
    });
}

async function carregarTabela() {
    atualizar.disabled = true;
    statusPagina.textContent = 'Buscando inscrições...';
    statusPagina.className = '';

    try {
        const eventos = await buscarJson('/api/eventos');
        if (!Array.isArray(eventos)) throw new Error('Formato de eventos inválido.');

        const resultados = await Promise.all(eventos.map(async evento => {
            const inscricoes = await buscarJson(`/api/eventos/${encodeURIComponent(evento.id)}/inscricoes`);
            if (!Array.isArray(inscricoes)) throw new Error('Formato de inscrições inválido.');
            return inscricoes.map(inscricao => ({
                id: inscricao.id,
                nome: inscricao.participante?.nome || '—',
                email: inscricao.participante?.email || '—',
                evento: evento.titulo || '—',
                eventoId: evento.id,
                situacao: inscricao.status || '—',
                data: inscricao.criada_em
            }));
        }));

        todasInscricoes = resultados.flat();
        todasInscricoes.sort((a, b) => (Date.parse(b.data) || 0) - (Date.parse(a.data) || 0));

        const escolhaAnterior = filtroEvento.value;
        filtroEvento.replaceChildren();
        const todos = document.createElement('option');
        todos.value = '';
        todos.textContent = 'Todos os eventos';
        filtroEvento.appendChild(todos);
        eventos.forEach(evento => {
            const opcao = document.createElement('option');
            opcao.value = String(evento.id);
            opcao.textContent = evento.titulo;
            filtroEvento.appendChild(opcao);
        });
        if ([...filtroEvento.options].some(opcao => opcao.value === escolhaAnterior)) {
            filtroEvento.value = escolhaAnterior;
        }
        exibirTabela();
        statusPagina.textContent = 'Lista atualizada.';
    } catch (erro) {
        todasInscricoes = [];
        corpo.replaceChildren();
        mostrarMensagem('Não foi possível carregar a lista de inscritos.');
        resumo.textContent = 'Inscrições indisponíveis.';
        statusPagina.textContent = erro.message;
        statusPagina.className = 'erro';
    } finally {
        atualizar.disabled = false;
    }
}

busca.addEventListener('input', exibirTabela);
filtroEvento.addEventListener('change', exibirTabela);
atualizar.addEventListener('click', carregarTabela);
carregarTabela();
