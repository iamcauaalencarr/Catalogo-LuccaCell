---
name: functional-typescript
description: "Guia e regras de programação funcional, lógica pura, imutabilidade, tratamento seguro de erros (Result/Option pattern) e arquitetura determinística em TypeScript e React. Ative sempre que projetar lógica de negócios, refatorar cálculos, manipular estado complexo, implementar transformações de dados ou evitar efeitos colaterais e mutações acidentais."
metadata:
  author: Antigravity
  version: "1.0.0"
---

# Functional TypeScript & Logic Architecture

Este guia estabelece os princípios de **Programação Funcional (FP)** e **Lógica Determinística** para código TypeScript e aplicações React de alto desempenho.

---

## 1. Princípios Fundamentais (Core Tenets)

### 1.1 Funções Puras (Pure Functions)
Uma função é pura se:
1. **Mesma entrada ➔ Mesma saída**: É 100% determinística (não depende de variáveis mutáveis globais, relógios externos ou dados voláteis não declarados).
2. **Zero Efeitos Colaterais (No Side Effects)**: Não altera o mundo exterior (não muta argumentos, não dispara requisições assíncronas escondidas, não modifica o DOM nem o `localStorage` dentro da função de cálculo).

```typescript
// ❌ INCORRETO (Impuro - altera o argumento e depende de estado externo)
function applyDiscount(cart: CartLine[], percent: number) {
  for (const line of cart) {
    line.product.price -= line.product.price * (percent / 100); // MUTOU O OBJETO!
  }
}

// ✅ CORRETO (Puro - imutável e determinístico)
function calculateDiscountedCart(lines: readonly CartLine[], percent: number): CartLine[] {
  const factor = 1 - Math.max(0, Math.min(100, percent)) / 100;
  return lines.map(line => ({
    ...line,
    product: {
      ...line.product,
      price: Number((line.product.price * factor).toFixed(2))
    }
  }));
}
```

---

### 1.2 Imutabilidade e Compartilhamento Estrutural
- **Nunca use**: `array.push()`, `array.splice()`, `delete obj.prop` ou reatribuição de propriedades (`obj.foo = bar`).
- **Sempre use**:
  - Adição: `[...array, newItem]`
  - Remoção: `array.filter(item => item.id !== targetId)`
  - Atualização: `array.map(item => item.id === targetId ? { ...item, ...updates } : item)`
  - Objetos: `{ ...original, [key]: newValue }`
  - Deep clone seguro: `structuredClone(obj)` quando necessário.

---

### 1.3 Railway-Oriented Programming (Result Pattern)
Evite lançar `throw new Error()` em lógica pura de negócio. Utilize o padrão **Result** para tornar os erros tipados e obrigatórios de serem tratados pelo consumidor:

```typescript
export type Result<T, E = string> = 
  | { ok: true; data: T }
  | { ok: false; error: E };

export const Ok = <T>(data: T): Result<T, never> => ({ ok: true, data });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Exemplo: Validação de cupom de desconto
export function applyCouponRule(subtotal: number, couponCode: string, activeCoupons: Coupon[]): Result<number, string> {
  if (subtotal <= 0) return Err('O valor do pedido deve ser maior que zero.');
  
  const coupon = activeCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
  if (!coupon) return Err('Cupom inválido ou expirado.');
  if (!coupon.is_active) return Err('Este cupom foi desativado.');
  if (coupon.min_order_value && subtotal < coupon.min_order_value) {
    return Err(`Valor mínimo para este cupom é R$ ${coupon.min_order_value.toFixed(2)}.`);
  }

  const discount = coupon.discount_type === 'percentage'
    ? (subtotal * coupon.discount_value) / 100
    : coupon.discount_value;

  const finalPrice = Math.max(0, subtotal - discount);
  return Ok(Number(finalPrice.toFixed(2)));
}
```

---

### 1.4 Padrão "Functional Core, Imperative Shell"
Separe rigidamente seu código em duas camadas:

1. **Núcleo Funcional (Functional Core)**:
   - Funções puras, cálculos matemáticos, regras de validação, formatação e transformações de dados.
   - Zero dependências de APIs, `window`, `document` ou banco de dados.
   - 100% testável em milissegundos sem mocks.
2. **Casca Imperativa (Imperative Shell)**:
   - Componentes React, hooks com efeitos (`useEffect`), chamadas Supabase/OpenRouter e manipulação de `localStorage`.
   - Lê dados externos ➔ Passa para o Núcleo Funcional ➔ Grava os resultados de volta.

---

### 1.5 Discriminated Unions e Exhaustiveness Checking
Para estados complexos e máquinas de estado, use **Unions Discriminadas** com verificação exaustiva:

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

function renderStatus(state: AsyncState<Product[]>) {
  switch (state.status) {
    case 'idle':
      return 'Pronto para buscar';
    case 'loading':
      return 'Carregando...';
    case 'success':
      return `${state.data.length} produtos carregados`;
    case 'error':
      return `Erro: ${state.message}`;
    default: {
      const _exhaustiveCheck: never = state;
      return _exhaustiveCheck;
    }
  }
}
```

---

### 1.6 Composição de Funções (Pipelining)
Crie pipelines de transformação legíveis encadeando funções simples:

```typescript
export const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T =>
  fns.reduce((acc, fn) => fn(acc), value);

// Pipeline de normalização de busca
export const cleanSearchQuery = (raw: string): string =>
  pipe(
    (s: string) => s.trim().toLowerCase(),
    (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    (s: string) => s.replace(/[^a-z0-9\s]/g, ' ')
  )(raw);
```

---

## 2. Checklist de Qualidade Funcional

- [ ] Todas as funções de cálculo e negócio são puras (não mutam variáveis externas).
- [ ] Arrays e Objetos utilizam operadores de espalhamento (`...`) ou métodos não mutáveis (`map`, `filter`, `reduce`).
- [ ] Erros esperados de regras de negócio retornam objetos tipados (`Result<T, E>`) em vez de disparar exceções não tratadas.
- [ ] Efeitos colaterais (chamadas de rede, I/O, timers) estão isolados nos limites da aplicação (hooks/handlers).
- [ ] Verificações condicionais cobrem todos os casos de união tipada com segurança de compilação TypeScript.
