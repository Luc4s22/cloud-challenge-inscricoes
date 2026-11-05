# Planejamento e preparação do ambiente Microsoft Azure

**Projeto:** Sistema de Inscrições da Semana Acadêmica  
**Responsável:** Lucas Mendes — NUVEM  
**Data:** 05/11/2026  
**Situação da entrega:** infraestrutura de aplicação criada e publicada; integração com PostgreSQL ainda não comprovada.

## 1. Objetivo e escopo

Planejar, configurar e registrar a infraestrutura necessária para hospedar o sistema de Inscrições da Semana Acadêmica no Microsoft Azure, considerando aplicação Python/Django, frontend HTML/CSS/JavaScript, integração contínua pelo GitHub Actions e conexão futura a PostgreSQL. O objetivo acadêmico desta atividade é deixar o ambiente planejado e documentado, com recursos provisionados quando disponíveis.

## 2. Inventário dos recursos e configuração realizada

| Item | Configuração / resultado | Situação em 05/11/2026 |
| --- | --- | --- |
| Assinatura | Azure for Students | Acesso validado no portal |
| Grupo de recursos | `rg-inscricoes-2026` | Criado |
| Aplicativo Web | `app-inscricoes-academicas01` | Criado; status *Running* no portal |
| Plano App Service | `asp-inscricoes-2026-mx` | Free F1 (Linux), criado |
| Região da aplicação | Mexico Central | Escolhida dentre as regiões permitidas |
| Runtime | Python 3.13 / Django / Gunicorn | Configurado |
| Repositório GitHub | `https://github.com/Luc4s22/cloud-challenge-inscricoes` | Fork próprio, conectado ao deploy |
| Branch de deploy | `main` | Configurada |
| Arquivo de workflow | `.github/workflows/main_app-inscricoes-academicas01.yml` | Criado e utilizado |
| Endpoint de verificação | `/health` | Retornou `{"status":"ok"}`, conforme teste informado |
| Página inicial `/` | Frontend HTML/CSS/JS servido pela aplicação Django | Abertura confirmada; interface original restaurada no workflow #5 |
| Banco PostgreSQL | Instância e credenciais ainda a definir/confirmar | **Não conectado; aplicação usa SQLite** |

**Endereço da aplicação:**  
https://app-inscricoes-academicas01-cycnhmbzd4g4gugu.mexicocentral-01.azurewebsites.net/

**Endpoint de saúde:**  
https://app-inscricoes-academicas01-cycnhmbzd4g4gugu.mexicocentral-01.azurewebsites.net/health

> O sucesso do GitHub Actions e do endpoint `/health` comprova publicação e resposta HTTP da aplicação, **não** comprova armazenamento de inscrições ou conexão a PostgreSQL.

## 3. Arquitetura adotada

```text
Navegador do participante
  -> HTTPS / domínio padrão *.azurewebsites.net
  -> Azure App Service (Linux / Python 3.13 / Gunicorn / Django)
       |- Rota /: HTML, CSS e JavaScript do frontend
       |- Rota /health: verificação simples do backend
       |- Rotas /api/...: endpoints Django
       \- PostgreSQL: conexão prevista por DATABASE_URL (a configurar e validar)

GitHub (branch main)
  -> GitHub Actions (build + artifact + deploy)
  -> Azure App Service (autenticação federada OIDC)
```

O código mantém as pastas `backend/` e `frontend/` no repositório. O workflow prepara os arquivos do frontend para serem servidos pelo Django, instala dependências e publica o conteúdo do backend como raiz do pacote no Azure App Service. O comando de inicialização configurado é:

```bash
gunicorn --bind 0.0.0.0:8000 --workers 1 --timeout 120 config.wsgi:application
```

A opção de um único *worker* reduz consumo de memória dentro dos limites do plano gratuito; dimensionamento e disponibilidade adequados a produção real deverão ser avaliados separadamente.

## 4. Regiões, plano e justificativas técnicas

Na primeira tentativa do ambiente novo, a implantação em **East US** foi barrada pela política de assinatura **Allowed resource deployment regions**. A consulta à atribuição de política revelou as regiões permitidas: `centralus`, `brazilsouth`, `italynorth`, `mexicocentral` e `francecentral`.

Foi selecionada **Mexico Central**, região autorizada em que foi possível criar um plano Linux **Free F1** separado dos recursos anteriores. Esse plano foi escolhido por atender à finalidade acadêmica de demonstração sem contratar automaticamente um plano pago. O Free F1 tem limites e não deve ser considerado dimensionamento de produção.

Os recursos antigos não foram excluídos como parte deste trabalho.

## 5. Variáveis de ambiente e segurança

Em **Azure Portal → App Service → Settings → Environment variables → App settings**:

| Variável | Exigência ou finalidade |
| --- | --- |
| `DJANGO_SECRET_KEY` | Chave aleatória gerada e guardada somente na configuração segura do aplicativo; nunca versionar |
| `DJANGO_DEBUG` | `False` no ambiente publicado |
| `DJANGO_ALLOWED_HOSTS` | Host exato do novo App Service, sem `https://` |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` para permitir instalação das dependências via Oryx na Azure |
| `DATABASE_URL` | String de conexão PostgreSQL; **não configurada/validada nesta entrega** |
| `CORS_ALLOWED_ORIGINS` | Necessária se um frontend em **outra origem** consumir a API; para frontend na mesma origem, não é obrigatória só por esse motivo |

O projeto lê essas variáveis via `backend/config/settings.py`. Credenciais, tokens, valores de `DATABASE_URL`, segredos de autenticação e arquivos `.env` **não devem ser incluídos no GitHub ou em capturas públicas**. É recomendável conferir também `CSRF_TRUSTED_ORIGINS`, cookies e opções de HTTPS antes de liberar formulários autenticados.

## 6. Requisitos para conectar ao PostgreSQL

O backend utiliza Django e a biblioteca `dj-database-url`, com driver PostgreSQL `psycopg` (a cópia original do projeto declara `psycopg[binary]`) no conjunto de dependências. O código aceita uma conexão por meio de `DATABASE_URL`. É necessário:

1. Escolher uma instância PostgreSQL existente ou um serviço gerenciado (por exemplo, Azure Database for PostgreSQL Flexible Server), confirmando **custos**, cotas, região e permissões antes da criação.
2. Obter, de modo privado, **host, porta (geralmente 5432), nome do banco, usuário e senha**. Confirmar exigência de SSL/TLS e regras de firewall/rede para aceitar conexões do App Service.
3. Inserir em **App settings** uma string de conexão do formato abaixo, substituindo todos os valores fictícios e codificando caracteres especiais da senha:

   ```text
   DATABASE_URL=postgresql://USUARIO:SENHA_CODIFICADA@HOST:5432/NOME_DO_BANCO?sslmode=require
   ```

4. Reiniciar a aplicação após a mudança e executar, a partir de um ambiente que consiga alcançar o banco e disponha das configurações corretas, `python manage.py migrate` **uma vez** para aplicar as migrações Django.
5. Validar conexão e persistência por consulta e operação de teste no banco e na API. Não considerar `/health` como teste de PostgreSQL: essa rota é um teste básico de disponibilidade do backend.
6. Verificar se os formulários JavaScript da interface chamam efetivamente os endpoints de API. A interface inicial possuía dados simulados e precisa de validação funcional antes de afirmar que registra inscrições reais.

**Risco observado:** sem `DATABASE_URL`, o `settings.py` contém fallback para SQLite, confirmado no diagnóstico em SSH. O armazenamento local desse tipo não é solução confiável para inscrições persistentes no Azure App Service; a conexão PostgreSQL é requisito para a etapa operacional.

## 7. Deploy e evidências

O pipeline em `.github/workflows/main_app-inscricoes-academicas01.yml` executa instalação de dependências, cópia dos arquivos HTML/CSS/JS para a estrutura servida pelo Django, criação do artefato do backend e implantação com `azure/webapps-deploy@v3`, autenticada por identidade federada.

**Evidências obtidas em 05/11/2026:**

- Captura do App Service em estado `Running`, no grupo de recursos `rg-inscricoes-2026` e plano Free F1 na região Mexico Central.
- Execução do GitHub Actions **#2**, build e deploy concluídos com sucesso.
- Execução do GitHub Actions **#3**, após integração do frontend, build e deploy concluídos com sucesso.
- Teste de `/health` informado com resposta `{"status":"ok"}`.
- Confirmação do responsável de que o frontend abre no endereço principal da aplicação.
- Execução do GitHub Actions **#5** com sucesso, restaurando a interface original da Semana Acadêmica.
- Verificação por SSH: `django.db.backends.sqlite3` como banco ativo; requisição a `/api/eventos` devolveu erro HTTP 500. Portanto, persistência de inscrições **não** foi validada.

**Observação:** sucesso do deploy não substitui testes de banco de dados, inscrição, autenticação ou observabilidade.

## 8. Pendências, riscos e próximos passos

| Pendência | Prioridade | Critério de aceite |
| --- | --- | --- |
| Confirmar fornecedor/instância PostgreSQL, custos e acesso | Alta | Dados de conexão e responsável definidos sem expor segredos |
| Configurar `DATABASE_URL` no App Service | Alta | Variável salva apenas na Azure |
| Executar migrations e testar leitura/gravação | Alta | Tabelas criadas e persistência confirmada |
| Integrar formulário frontend à API real | Alta para sistema funcional | Cadastro persiste no PostgreSQL |
| Revisar logs, HTTPS, CSRF e permissões | Média | Teste de segurança/funcionamento documentado |
| Revisar avisos de versões das Actions no GitHub | Baixa | Pipeline atualizado sem regressões |

## 9. Alinhamento com o critério acadêmico

- [x] Verificar o acesso à plataforma Microsoft Azure.
- [x] Definir recursos de nuvem necessários ao projeto.
- [x] Planejar e criar o Azure App Service.
- [x] **Identificar os requisitos** de conexão PostgreSQL (seção 6).
- [x] Documentar configurações necessárias à implantação (este arquivo).
- [ ] **Registrar as decisões técnicas no repositório** — concluir com commit deste documento na pasta `documentos/` ou `docs/` do fork.

A atividade de **planejamento e preparação** pode ser apresentada com o banco ainda pendente, desde que o estado real seja explicitado; **não declarar a conexão PostgreSQL concluída** até obter prova de funcionamento.

## 10. Referências técnicas

- [Microsoft Learn — Configurar aplicativos Python no Azure App Service](https://learn.microsoft.com/pt-br/azure/app-service/configure-language-python)
- [Microsoft Learn — Aplicativo Django com PostgreSQL no App Service](https://learn.microsoft.com/en-us/azure/app-service/tutorial-python-postgresql-app-django)
- [Microsoft Learn — Configurar variáveis de um App Service](https://learn.microsoft.com/azure/app-service/configure-common)
