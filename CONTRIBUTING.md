# Diretrize de Contribuição e Fluxo de Desenvolvimento

Todas as pessoas desenvolvedoras e **agentes de Inteligência Artificial (de qualquer modelo)** que trabalharem neste repositório devem seguir obrigatoriamente as instruções abaixo.

---

## 1. Regra Fundamental: Issues e Pull Requests (PRs)

1. **Criação Obrigatória de Issue no GitHub**:
   - Nenhuma alteração (seja **Correção de Bug**, **Melhoria/Refatoração** ou **Nova Função/Feature**) pode ser feita sem antes existir uma Issue cadastrada no GitHub.
   - A Issue deve possuir um título claro e uma descrição detalhada com o objetivo e os critérios de aceite.

2. **Gerenciamento e Deploy via Pull Request (PR)**:
   - É proibido realizar commits diretos na branch principal (`main` / `master`).
   - Todo trabalho deve ser realizado em uma branch separada (ex: `feat/issue-12-motion`, `fix/issue-34-loading`) e submetido via PR.

3. **Vínculo Obrigatório da Issue na Descrição do PR**:
   - A descrição de **todo PR** deve conter a menção explícita da Issue correspondente utilizando uma das palavras-chave do GitHub:
     - `Fixes #NUMERO_DA_ISSUE`
     - `Closes #NUMERO_DA_ISSUE`
     - `Ref #NUMERO_DA_ISSUE`

---

## 2. Instruções para Agentes de IA

Se você é um assistente ou agente de IA (qualquer modelo):
1. **Verifique ou crie a Issue no GitHub** antes de iniciar qualquer alteração.
2. **Crie a branch correspondente** antes de alterar os arquivos.
3. **Crie o Pull Request** ao finalizar e certifique-se de incluir `Closes #ISSUE` / `Fixes #ISSUE` na descrição.
4. **Respeite o sistema de animação, observabilidade e suíte de testes** do projeto.
