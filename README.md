# Nexus Oracle — Stability + Auto Detect

Melhorias desta rodada:
- estabilidade sem dependência operacional de scraping externo
- monitoramento simples de performance via `/status` e `/metrics`
- auto detect de champ select via LCU local (`/auto-context`)
- explicação melhorada: `por que isso ganha jogo`
- explicação estratégica: win condition inimiga + counter-plan

Observações:
- o auto detect depende do cliente do LoL aberto no Windows e do lockfile local.
- se o LCU não estiver acessível, o sistema continua funcionando em modo manual.


Rodada final UX/performance:
- onboarding simples com CTA 'Me diga o pick'
- endpoint /instant-pick para fluxo rápido
- cache TTL de 10s para /analyze e /pick-data
- responseMs exposto no payload e na UI
