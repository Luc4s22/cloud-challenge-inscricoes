/*
 * Semana Acadêmica: eventos e inscrições reais, carregados da API Django.
 * A aplicação pública não consulta nomes/e-mails dos participantes.
 */

const API_EVENTOS = '/api/eventos';
const listaEventos = document.getElementById('lista-eventos');
const campoBusca = document.getElementById('buscar-evento');
const formulario = document.getElementById('form-inscricao');
const nomeEvento = document.getElementById('evento-selecionado');
const mensagem = document.getElementById('mensagem-inscricao');
const botaoConfirmar = document.getElementById('btn-confirmar');

let eventos = [];
let eventoSelecionadoId = null;
let enviandoInscricao = false;

function formatarData(data) {
    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return 'Data não informada';
    return valor.toLocaleString('pt-BR', {
        dateStyle: 'short', timeStyle: 'short'
    });
}

function eventoEncerrado(evento) {
    const dataInicio = new Date(evento.data_inicio);
    return Number.isNaN(dataInicio.getTime()) || dataInicio <= new Date();
}

function exibirMensagem(texto, tipo = 'erro') {
    mensagem.textContent = texto;
    mensagem.className = tipo === 'sucesso' ? 'mensagem-sucesso' : 'mensagem-erro';
}

function eventoDisponivel(evento) {
    return Boolean(evento) && !eventoEncerrado(evento) &&
        Number(evento.vagas_disponiveis) > 0;
}

function atualizarSelecao() {
    const selecionado = eventos.find(item => Number(item.id) === Number(eventoSelecionadoId));
    if (!eventoDisponivel(selecionado)) {
        eventoSelecionadoId = null;
        nomeEvento.textContent = 'Selecione um evento';
    } else {
        nomeEvento.textContent = selecionado.titulo;
    }
    botaoConfirmar.disabled = enviandoInscricao || eventoSelecionadoId === null;
}

function selecionarEvento(id) {
    const evento = eventos.find(item => Number(item.id) === Number(id));
    if (!eventoDisponivel(evento) || enviandoInscricao) return;

    eventoSelecionadoId = evento.id;
    mensagem.textContent = '';
    atualizarSelecao();
    document.getElementById('inscricao').scrollIntoView({
        behavior: 'smooth', block: 'center'
    });
}

function inserirTexto(elemento, classe, valor) {
    const no = document.createElement('p');
    if (classe) no.className = classe;
    no.textContent = valor;
    elemento.appendChild(no);
}

function mostrarEventos(filtro = '') {
    listaEventos.replaceChildren();
    const busca = filtro.trim().toLocaleLowerCase('pt-BR');
    const encontrados = eventos.filter(evento =>
        String(evento.titulo || '').toLocaleLowerCase('pt-BR').includes(busca) ||
        String(evento.palestrante || '').toLocaleLowerCase('pt-BR').includes(busca)
    );

    if (encontrados.length === 0) {
        inserirTexto(listaEventos, 'aviso-lista', busca
            ? 'Nenhum evento encontrado para essa busca.'
            : 'Ainda não há eventos cadastrados.');
        return;
    }

    encontrados.forEach(evento => {
        const card = document.createElement('article');
        card.className = 'card-evento';
        const titulo = document.createElement('h3');
        titulo.textContent = evento.titulo;
        card.appendChild(titulo);

        inserirTexto(card, '', evento.descricao);
        inserirTexto(card, '', 'Palestrante: ' + evento.palestrante);
        inserirTexto(card, '', 'Início: ' + formatarData(evento.data_inicio));
        inserirTexto(card, '', 'Término: ' + formatarData(evento.data_fim));
        inserirTexto(card, '', 'Local: ' + evento.local);
        inserirTexto(card, '', 'Vagas disponíveis: ' + evento.vagas_disponiveis);

        const botao = document.createElement('button');
        botao.className = 'btn-inscricao';
        botao.type = 'button';
        if (eventoEncerrado(evento)) {
            botao.textContent = 'Inscrições encerradas';
            botao.disabled = true;
        } else if (Number(evento.vagas_disponiveis) <= 0) {
            botao.textContent = 'Vagas esgotadas';
            botao.disabled = true;
        } else {
            botao.textContent = 'Inscrever-se';
            botao.addEventListener('click', () => selecionarEvento(evento.id));
        }
        card.appendChild(botao);
        listaEventos.appendChild(card);
    });
}

async function carregarEventos() {
    const resposta = await fetch(API_EVENTOS, {cache: 'no-store'});
    if (!resposta.ok) {
        throw new Error(`A API retornou erro HTTP ${resposta.status}.`);
    }
    const dados = await resposta.json();
    if (!Array.isArray(dados)) {
        throw new Error('Formato inesperado na resposta da API.');
    }
    eventos = dados;
    mostrarEventos(campoBusca.value);
    atualizarSelecao();
}

campoBusca.addEventListener('input', () => mostrarEventos(campoBusca.value));

formulario.addEventListener('submit', async event => {
    event.preventDefault();
    if (enviandoInscricao) return;

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const escolhido = eventos.find(item => Number(item.id) === Number(eventoSelecionadoId));

    if (!nome || !email || !escolhido) {
        exibirMensagem('Informe nome, e-mail e selecione um evento.');
        return;
    }
    if (!eventoDisponivel(escolhido)) {
        exibirMensagem('Este evento não aceita novas inscrições.');
        return;
    }

    enviandoInscricao = true;
    botaoConfirmar.disabled = true;
    botaoConfirmar.textContent = 'Confirmando...';
    formulario.setAttribute('aria-busy', 'true');

    try {
        const resposta = await fetch(`${API_EVENTOS}/${encodeURIComponent(escolhido.id)}/inscricoes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({participante: {nome, email}})
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
            throw new Error(dados.mensagem || `Erro ${resposta.status} ao confirmar inscrição.`);
        }

        formulario.reset();        // Só exibe o comprovante depois que a API confirmou o registro.
        // Os dados ficam temporariamente nesta aba; nunca vão para a URL.
        const resumoInscricao = {
            id: dados.id,
            nome: dados.participante?.nome || nome,
            email: dados.participante?.email || email,
            evento: escolhido.titulo,
            local: escolhido.local,
            inicio: escolhido.data_inicio,
            status: dados.status,
            criadoEm: Date.now()
        };
        if (dados.status === 'confirmada' && dados.id &&
                typeof window !== 'undefined' && window.sessionStorage &&
                typeof window.location?.assign === 'function') {
            try {
                window.sessionStorage.setItem(
                    'semana_academica_inscricao_confirmada_v1',
                    JSON.stringify(resumoInscricao)
                );
                window.location.assign('/inscricao-confirmada/');
                return;
            } catch (erroNavegador) {
                console.warn('Falha ao abrir a página de confirmação:', erroNavegador);
                // A inscrição já foi gravada: mantém a mensagem de sucesso nesta tela.
            }
        }


        eventoSelecionadoId = null;
        exibirMensagem(`Inscrição de ${nome} confirmada com sucesso!`, 'sucesso');

        try {
            await carregarEventos();
        } catch (erroAtualizacao) {
            console.error('Inscrição salva, mas a listagem não atualizou:', erroAtualizacao);
            // Nunca atribuir falha de inscrição a uma atualização da lista.
        }
    } catch (erro) {
        exibirMensagem(erro.message || 'Não foi possível concluir a inscrição.');
    } finally {
        enviandoInscricao = false;
        formulario.removeAttribute('aria-busy');
        botaoConfirmar.textContent = 'Confirmar inscrição';
        atualizarSelecao();
    }
});

carregarEventos().catch(erro => {
    console.error('Falha ao carregar os eventos:', erro);
    listaEventos.replaceChildren();
    inserirTexto(listaEventos, 'aviso-lista',
        'Não foi possível carregar os eventos. Verifique sua conexão e atualize a página.');
});

/* INSCRICOES_NA_HOME_V1: mostra a planilha no fim da pÃ¡gina inicial.
   O backend mantÃ©m a autorizaÃ§Ã£o: pessoas nÃ£o logadas NÃƒO recebem dados pessoais. */
;(() => {
    'use strict';
    const corpo = document.getElementById('corpo-planilha-inscricoes');
    const estado = document.getElementById('estado-planilha-inscricoes');
    const botao = document.getElementById('atualizar-planilha-inscricoes');
    const acesso = document.getElementById('acesso-planilha-inscricoes');
    if (!corpo || !estado || !botao || !acesso) return;

    function escreverLinha(valores) {
        const linha = document.createElement('tr');
        valores.forEach(valor => {
            const coluna = document.createElement('td');
            coluna.textContent = valor === null || valor === undefined ? 'â€”' : String(valor);
            linha.appendChild(coluna);
        });
        corpo.appendChild(linha);
    }

    function linhaDeAviso(texto) {
        corpo.replaceChildren();
        const linha = document.createElement('tr');
        const celula = document.createElement('td');
        celula.colSpan = 6;
        celula.textContent = texto;
        linha.appendChild(celula);
        corpo.appendChild(linha);
    }

    function dataBrasileira(valor) {
        if (!valor) return 'â€”';
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? 'â€”' : data.toLocaleString('pt-BR', {
            dateStyle: 'short', timeStyle: 'short'
        });
    }

    async function lerJson(url) {
        const resposta = await fetch(url, {
            credentials: 'same-origin',
            cache: 'no-store'
        });
        if (resposta.status === 401 || resposta.status === 403) {
            const erro = new Error('Somente a equipe organizadora pode visualizar os inscritos.');
            erro.acessoNegado = true;
            throw erro;
        }
        if (!resposta.ok) throw new Error('NÃ£o foi possÃ­vel consultar as inscriÃ§Ãµes. HTTP ' + resposta.status);
        const dados = await resposta.json();
        if (!Array.isArray(dados)) throw new Error('A API retornou um formato inesperado.');
        return dados;
    }

    let carregamentoAtual = 0;
    async function carregarPlanilha() {
        const id = ++carregamentoAtual;
        botao.disabled = true;
        acesso.hidden = true;
        estado.textContent = 'Carregando inscriÃ§Ãµes...';
        linhaDeAviso('Buscando informaÃ§Ãµes...');
        try {
            const eventosDaApi = await lerJson('/api/eventos');
            const porEvento = await Promise.all(eventosDaApi.map(async evento => {
                const lista = await lerJson('/api/eventos/' + encodeURIComponent(evento.id) + '/inscricoes');
                return lista.map(inscricao => ({
                    id: inscricao.id,
                    nome: inscricao.participante?.nome || 'â€”',
                    email: inscricao.participante?.email || 'â€”',
                    evento: evento.titulo || 'â€”',
                    status: inscricao.status || 'â€”',
                    data: inscricao.criada_em
                }));
            }));
            if (id !== carregamentoAtual) return;
            const inscricoes = porEvento.flat();
            inscricoes.sort((a, b) => (Date.parse(b.data) || 0) - (Date.parse(a.data) || 0));
            corpo.replaceChildren();
            inscricoes.forEach(item => escreverLinha([
                item.id, item.nome, item.email, item.evento, item.status, dataBrasileira(item.data)
            ]));
            if (inscricoes.length === 0) linhaDeAviso('Ainda nÃ£o hÃ¡ inscriÃ§Ãµes cadastradas.');
            estado.textContent = inscricoes.length + (inscricoes.length === 1 ? ' inscriÃ§Ã£o registrada.' : ' inscriÃ§Ãµes registradas.');
        } catch (erro) {
            if (id !== carregamentoAtual) return;
            linhaDeAviso(erro.acessoNegado ? 'A lista Ã© restrita Ã  equipe organizadora.' : 'NÃ£o foi possÃ­vel carregar a lista.');
            estado.textContent = erro.message || 'Erro ao consultar inscriÃ§Ãµes.';
            acesso.hidden = !erro.acessoNegado;
        } finally {
            if (id === carregamentoAtual) botao.disabled = false;
        }
    }

    botao.addEventListener('click', carregarPlanilha);

    // Depois de uma inscriÃ§Ã£o bem-sucedida, atualiza a tabela sem mudar de pÃ¡gina.
    const mensagemFormulario = document.getElementById('mensagem-inscricao');
    if (mensagemFormulario && typeof MutationObserver !== 'undefined') {
        let mensagemAnterior = '';
        const observador = new MutationObserver(() => {
            const texto = mensagemFormulario.textContent.trim();
            if (texto !== mensagemAnterior) {
                mensagemAnterior = texto;
                if (/inscri[cÃ§][aÃ£]o.*confirmad/i.test(texto)) carregarPlanilha();
            }
        });
        observador.observe(mensagemFormulario, { childList: true, subtree: true, characterData: true });
    }

    carregarPlanilha();
})();