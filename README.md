<div align="center">

# 📱 LUCCA CELL — Catálogo Digital & Sistema PDV Inteligente

<p align="center">
  <strong>Plataforma moderna de e-commerce local, catálogo interativo e gestão PDV com Inteligência Artificial e automação de pagamentos.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenRouter_AI-FF6B6B?style=for-the-badge&logo=openai&logoColor=white" alt="OpenRouter AI" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

[🌐 Demonstração Online](https://catalogo-lucca-cell.vercel.app) • [📖 Funcionalidades](#-funcionalidades-de-destaque) • [🏗️ Arquitetura](#-arquitetura-e-engenharia) • [🚀 Como Executar](#-como-executar-localmente)

</div>

---

## 🌟 Sobre o Projeto

O **Catálogo Lucca Cell** é uma solução completa desenvolvida sob medida para a **Lucca Cell & Loucas Por Esmaltes** (Guajará - AM). O sistema combina a elegância de um catálogo de boutique com o poder de um sistema administrativo com **Visão Computacional por IA**, **Emissão de Pix Automático (BR Code EMV)** e **Impressão Térmica de Comprovantes (Epson TM-T20X)**.

---

## ✨ Funcionalidades de Destaque

### 🤖 1. Cadastro Inteligente de Produtos por IA (Visão Computacional)
- **Reconhecimento por Foto:** Basta tirar uma foto da embalagem ou do produto. A IA analisa o produto, identifica a marca, modelo, categoria correta, preço sugerido e redige descrição comercial vendedora.
- **Esteira de Contingência Automática (Failover de 3 Camadas):** Caso o modelo principal oscile ou atinja limite de requisições, o sistema aciona automaticamente modelos reserva (`openrouter/free` ➔ `nemotron-3-nano` ➔ `nemotron-3.5`) sem interromper o cadastro.
- **Isolamento de Preferência:** O modelo de IA favorito do lojista permanece fixado e salvo sem sobrescritas indesejadas.

### 💳 2. Pagamento Pix Automático com Valor Exato (Padrão Banco Central)
- **Norma Oficial BR Code EMV (QRCPS-MPM):** Gera o código Pix Copia e Cola contendo o valor exato da compra (sem necessidade do cliente digitar centavos no banco).
- **Cálculo Polinomial CRC-16 CCITT:** Validação estrita de integridade para compatibilidade imediata com Nubank, Inter, Itaú, Bradesco, PicPay, Caixa, Santander e Banco do Brasil.
- **QR Code Dinâmico Instantâneo:** Permite apontar a câmera de outro dispositivo ou copiar com 1 clique.

### 🖨️ 3. Notinha & Impressão Térmica POS (Epson TM-T20X 80mm)
- **Driver de Impressão Isolado (Iframe POS):** Impressão direta sem abrir páginas em branco ou sofrer interferências do layout web.
- **Logotipo em Preto Absoluto (`#000000`):** Tratamento de contraste e máscara térmica para máxima nitidez no cabeçote de corte.
- **Privacidade Operacional:** Botão de impressão restrito ao painel interno da loja, mantendo a sacola pública limpa para os clientes.

### 🔍 4. Busca Inteligente com Sinônimos e Tolerância Fonética
- **Mecanismo de Busca Semântica:** Mapeamento de sinônimos (`fones`, `cabos`, `carregadores`, `peliculas`, `peliculas 3d`, etc.).
- **Tolerância a Acentos e Erros:** Algoritmo de normalização que encontra itens mesmo com variações de digitação.
- **Contador Dinâmico de Categorias:** Filtros laterais com badge de contagem sincronizada em tempo real.

### 🔒 5. Painel Administrativo & Gestão de Loja
- **Acesso Seguro por Rota com Hash:** Rota administrativa camuflada (`/#natal`) com autenticação via Supabase Auth.
- **Controle de Acesso RBAC:** Níveis de permissão distintos para Master, Gerentes e Operadores.
- **Gerenciador Completo:** Gestão de produtos, controle de estoque, motor de cupons de desconto, relatórios e auditoria de segurança.

---

## 🏗️ Arquitetura e Engenharia

O projeto foi refatorado e auditado segundo os princípios de **Programação Funcional em TypeScript (`functional-typescript`)**:

```
src/
├── lib/
│   ├── functional/
│   │   ├── result.ts        # Padrão Result/Option (Tratamento seguro de erros)
│   │   ├── search.ts        # Pipeline pura de busca, tokenização e sinônimos
│   │   ├── cart.ts          # Reducer puro de carrinho, totais e formatadores
│   │   ├── validation.ts    # Validação pura de schemas e regras de cupons
│   │   └── pix.ts           # Gerador de payload Pix EMV & cálculo CRC16
│   └── supabase.ts          # Cliente Supabase com fallback de resiliência
├── components/
│   ├── admin/               # Módulos do painel administrativo e PDV
│   ├── PixPaymentModal.tsx  # Modal de Pix Copia e Cola e QR Code
│   ├── ThermalReceiptModal.tsx # Gerador de notinhas para impressoras térmicas
│   ├── AIVisionModal.tsx    # Modal de escaneamento de produtos por IA
│   └── NotFoundPage.tsx     # Página 404 animada e estilizada
└── services/
    ├── openrouter.ts        # Integração multimodal OpenRouter + contingência
    └── adminStore.ts        # Gerenciamento de estado e sincronização cloud
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Função no Projeto |
|---|:---:|---|
| **React** | 19.x | Biblioteca de interface reativa e performática |
| **TypeScript** | 5.x | Tipagem estática estrita e arquitetura determinística |
| **Vite** | 7.x | Build tool ultrarrápido com Hot Module Replacement |
| **Tailwind CSS** | 4.x | Design system moderno com suporte a temas e micro-animações |
| **Supabase** | 2.x | Banco de dados PostgreSQL em nuvem e autenticação |
| **Lucide Icons** | Latest | Iconografia moderna e consistente |
| **OpenRouter API** | Latest | Gateway de inteligência artificial multimodal |

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/iamcauaalencarr/Catalogo-LuccaCell.git
cd Catalogo-LuccaCell
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

O aplicativo estará acessível em:
- **Catálogo Público:** `http://localhost:3000`
- **Painel Administrativo:** `http://localhost:3000/#natal`

---

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos estáticos otimizados serão gerados na pasta `dist/`, prontos para deploy na **Vercel** ou em qualquer CDN estático.

---

## 📄 Licença

Este projeto é desenvolvido e mantido para a **Lucca Cell & Loucas Por Esmaltes**.  
Todos os direitos reservados © 2026.
