# Checklist para a entrega — responsabilidade NUVEM

- [x] Acesso ao Azure for Students confirmado.
- [x] Criado o Resource Group `rg-inscricoes-2026`.
- [x] Criado o App Service Linux `app-inscricoes-academicas01` no plano `asp-inscricoes-2026-mx` (Free F1), região Mexico Central.
- [x] Runtime Python 3.13 e startup Gunicorn configurados.
- [x] GitHub Actions configurado para o repositório `Luc4s22/cloud-challenge-inscricoes`.
- [x] Builds e deploys de backend e frontend executados com sucesso.
- [x] Teste `/health` com retorno `{"status":"ok"}` informado.
- [x] Interface original restaurada; execução #5 concluída.
- [x] Requisitos de conexão PostgreSQL identificados neste pacote.
- [x] Configurações de implantação e decisões técnicas documentadas neste pacote.
- [ ] **Publicar estes documentos no GitHub** (commit e push). Só marcar após confirmar.
- [ ] Definir servidor PostgreSQL, configurar `DATABASE_URL` e validar migrações (etapa operacional adicional; não declarar concluída).
- [ ] Corrigir erro HTTP 500 de `/api/eventos` e validar inscrições reais (etapa operacional adicional).

## Referências de evidência

- Repositório: https://github.com/Luc4s22/cloud-challenge-inscricoes
- Aplicação: https://app-inscricoes-academicas01-cycnhmbzd4g4gugu.mexicocentral-01.azurewebsites.net/
- Saúde: https://app-inscricoes-academicas01-cycnhmbzd4g4gugu.mexicocentral-01.azurewebsites.net/health
- Workflow: `.github/workflows/main_app-inscricoes-academicas01.yml`

## Cuidados

- Não inserir `DATABASE_URL` real, senha ou `DJANGO_SECRET_KEY` em arquivos versionados.
- Não confundir pipeline verde ou página `/health` com banco operacional.
- Não trocar Free F1 por um plano pago sem aprovação e avaliação de custo.
