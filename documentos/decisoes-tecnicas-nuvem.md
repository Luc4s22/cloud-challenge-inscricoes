# Registro de decisões técnicas — NUVEM

**Projeto:** Inscrições da Semana Acadêmica  
**Responsável:** Lucas Mendes  
**Data:** 05/11/2026  
**Escopo:** infraestrutura, implantação e requisitos do banco de dados.

## DT-01 — Utilizar Microsoft Azure App Service

**Decisão:** hospedar o backend Django e a interface estática no mesmo App Service Linux `app-inscricoes-academicas01`, no grupo `rg-inscricoes-2026`.  
**Justificativa:** simplifica a entrega acadêmica e permite servir frontend e API sob uma única origem HTTPS.  
**Evidência:** aplicação acessível e `/health` respondendo `{"status":"ok"}` durante os testes relatados.  
**Limite:** resposta de saúde não valida as consultas ao banco.

## DT-02 — Região Mexico Central

**Decisão:** usar `mexicocentral`.  
**Justificativa:** a política `Allowed resource deployment regions` da assinatura bloqueou `eastus`, mas permite `centralus`, `brazilsouth`, `italynorth`, `mexicocentral` e `francecentral`. O App Service Plan gratuito foi criado com sucesso em Mexico Central.

## DT-03 — App Service Plan Free F1

**Decisão:** plano `asp-inscricoes-2026-mx`, Linux, Free F1.  
**Justificativa:** atende à demonstração do trabalho sem selecionar um plano pago.  
**Limites:** plano com recursos restritos, não adequado para assumir produção com disponibilidade e capacidade garantidas. Avaliar custo e escala antes de uso real.

## DT-04 — Implantação pelo GitHub Actions

**Decisão:** `main` do fork `Luc4s22/cloud-challenge-inscricoes` aciona `.github/workflows/main_app-inscricoes-academicas01.yml`; autenticação Azure via identidade federada OIDC; build e deploy separados.  
**Justificativa:** rastreabilidade e implantação reproduzível.  
**Evidências:** execuções #2, #3 e #5 concluídas com sucesso nos prints do GitHub Actions. A #5 restaurou o frontend original.

## DT-05 — Arquivos estáticos servidos pelo Django

**Decisão:** incorporar `frontend/index.html`, `frontend/style.css` e `frontend/script.js` ao artefato Django na etapa de build, mantendo a estrutura original do repositório.  
**Justificativa:** permitir que a rota `/` exiba a interface de inscrições no App Service sem outro serviço de hospedagem.  
**Estado:** interface original publicada; integração funcional do formulário depende de API e banco.

## DT-06 — Persistência em PostgreSQL (pendente)

**Decisão:** preparar a aplicação para PostgreSQL configurado via `DATABASE_URL` na Azure, com TLS conforme o provedor.  
**Motivo:** foi verificado em SSH que a aplicação usa `django.db.backends.sqlite3`; `/api/eventos` respondeu 500. SQLite dentro do ambiente efêmero de execução não deve armazenar inscrições reais.  
**Critério de aceite:** instância PostgreSQL definida e acessível; `DATABASE_URL` protegida; `python manage.py migrate` concluído; `/api/eventos` responde sem 500; inscrições persistem após nova requisição.  
**Cuidado com custos:** verificar preço e cotas antes de criar PostgreSQL gerenciado na Azure.

## DT-07 — Segurança básica

**Decisão:** guardar segredos em App settings, nunca em Git; `DJANGO_DEBUG=False`; restringir `DJANGO_ALLOWED_HOSTS` ao domínio oficial.  
**Pendências de verificação:** HTTPS, configurações CSRF para fluxos reais, exposição de logs e necessidade de políticas de acesso.

## Resumo para apresentação

A infraestrutura de hospedagem foi criada, integrada ao GitHub Actions e validada com uma página funcional e uma rota de saúde. A integração do PostgreSQL foi especificada, mas não pode ser declarada concluída: o diagnóstico mostrou uso de SQLite e erro 500 na API de eventos. A atividade de nuvem documenta essa situação com clareza e define os próximos passos.
