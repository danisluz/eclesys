# ECLESYS – Conceitos Fundamentais do Sistema

Este documento define **os conceitos centrais do ECLESYS** e serve como referência oficial para desenvolvimento, manutenção e evolução do sistema.

> Objetivo: evitar confusão conceitual, bugs de permissão e decisões arquiteturais erradas ao longo do tempo.

---

## Visão Geral

O ECLESYS é um **SaaS multi-tenant** para gestão de igrejas, onde:

- **Tenant** = Igreja Geral (cidade ou organização mãe)
- Existe uma **hierarquia organizacional** (igreja → setor → congregação)
- Pessoas podem ter:
  - **Cargo eclesiástico** (status ministerial)
  - **Função organizacional** (liderança/serviço)
  - **Permissão de sistema** (acesso ao software)

Esses três conceitos **NÃO são a mesma coisa**.

---

## 1. Tenant (Igreja Geral)

Tabela: `tenants`

- Representa a igreja mãe
- Isola totalmente os dados
- Possui **Código da Igreja (tenantCode)** imutável

Regra:
> Tudo no sistema pertence a um tenant.

---

## 2. Estrutura Organizacional

Tabela: `organization_units`

Tipos:
- CHURCH
- SECTOR
- CONGREGATION

Define a hierarquia territorial/administrativa.

---

## 3. Usuário do Sistema

Tabela: `users`

- Pessoa que faz login no sistema
- Pode existir em vários tenants
- Não representa automaticamente liderança religiosa

Regra:
> Usuário ≠ Membro

---

## 4. Permissão de Sistema

Tabela: `user_assignments`

Define **o que o usuário pode fazer no sistema**.

- Sempre vinculada a um escopo (igreja, setor ou congregação)
- Exemplos: ADMIN, SECRETARIA, LIDER_SETOR

Regra:
> Permissão de sistema sempre depende de escopo.

---

## 5. Membros

Tabela: `members`

- Pessoa da igreja
- Pertence a **uma congregação**
- Possui status (ativo/inativo)
- Possui um cargo eclesiástico atual

---

## 6. Cargo Eclesiástico

Tabela: `church_roles`

Exemplos:
- Membro
- Diácono
- Presbítero
- Pastor

Características:
- Configurável por tenant
- Pode ser renomeado ou desativado
- **Nunca concede permissão de sistema**

---

## 7. Histórico de Cargo Eclesiástico

Tabela: `member_church_role_history`

- Guarda toda a evolução ministerial
- Um membro só pode ter **um cargo ativo por vez**
- Histórico nunca é apagado

---

## 8. Função Organizacional

Tabelas:
- `function_roles`
- `member_assignments`

Define **o que o membro faz** em um contexto específico:
- Líder
- Vice-líder
- Tesoureiro
- Secretário

Regra:
> Função organizacional ≠ cargo eclesiástico ≠ permissão de sistema.

---

## 9. Ministérios

Tabelas:
- `ministry_types` (catálogo do tenant)
- `ministries` (instância por igreja/setor/congregação)

Características:
- Ministérios nascem na igreja mãe
- Setores e congregações **herdam** os ministérios
- Cada nível possui **suas próprias lideranças**

### Regra do MVP
> Ministérios **não possuem membros**, apenas **organização (lideranças)**.

Participantes poderão ser adicionados no futuro sem quebrar o modelo.

---

## 10. Pagamentos e Assinaturas

Tabelas:
- `plans`
- `customers`
- `subscriptions`
- `payments`
- `webhook_events`

Regras:
- Pagamento pertence ao tenant
- Assinatura ativa libera acesso
- Assinatura vencida bloqueia o sistema

---

## 11. Auditoria

Tabela: `audit_logs`

Toda ação sensível deve ser registrada.

---

## Regras de Ouro

1. Tudo pertence a um tenant
2. Cargo eclesiástico não define permissão
3. Função organizacional não define permissão
4. Permissão de sistema sempre tem escopo
5. Ministérios no MVP têm apenas lideranças
6. Nada crítico é deletado se estiver em uso
7. Pagamento governa acesso ao sistema

---

## Frase Final

> Quem a pessoa é, o que ela faz e o que ela pode no sistema são coisas diferentes.
