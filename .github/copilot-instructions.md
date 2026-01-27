# ECLESYS — Copilot Instructions (PT-BR)

Você está auxiliando no desenvolvimento do **ECLESYS**, um sistema real em produção contínua.  
Este projeto **não é um tutorial**, **não é uma POC** e **não aceita gambiarras**.

Todas as decisões devem priorizar **segurança, clareza, manutenção e evolução futura**.

---

## Idioma e Padrões

### Comunicação
- **Toda a conversa, explicações e respostas devem ser em português**

### Código
- **Classes, métodos, variáveis, pacotes, arquivos e commits devem estar em inglês**
- Usar padrões internacionais de nomenclatura
- Evitar abreviações pouco claras
- Preferir nomes explícitos e autoexplicativos

---

## Estrutura do Repositório (Monorepo)

```
eclesys/
├─ backend/eclesys-api
├─ frontend/eclesys-web
└─ infra/
```

---

## Princípios Gerais

- Produto real de produção
- Mudanças pequenas e cirúrgicas
- Sem atalhos inseguros
- Clareza > esperteza
- Pensar sempre na evolução futura

---

## Backend — Spring Boot

- Java 21
- Spring Web
- Spring Security (JWT)
- JPA / Hibernate
- Flyway
- PostgreSQL
- UUID como identificador

### Organização
Monólito modular preparado para extração futura de APIs externas.

Estrutura por feature:

```
features/
└─ members/
   ├─ controller/
   ├─ service/
   ├─ repository/
   ├─ dto/
   └─ entity/
```

---

## Padrão de Resposta da API

### Sucesso
```json
{
  "status": "success",
  "data": ...
}
```

### Erro
```json
{
  "status": "error",
  "message": "Mensagem clara"
}
```

---

## Frontend — Angular

- Angular Standalone + SSR
- Angular Material (M3)
- Uso de Signals

### Componentes
Todo componente deve ter:

```
component-name/
├─ component-name.component.ts
├─ component-name.component.html
└─ component-name.component.scss
```

---

## Git / Commits

Conventional Commits:

- feat(api):
- fix(api):
- feat(web):
- fix(web):
- chore(infra):

---

## Regra Final

Sempre escolher o **correto, seguro e sustentável**.
