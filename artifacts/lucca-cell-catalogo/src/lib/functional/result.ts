/**
 * Utility types e funções puras para Railway-Oriented Programming
 * Permite tratamento determinístico de erros com tipos estritos.
 */

export type Result<T, E = string> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: E };

export const Ok = <T>(data: T): Result<T, never> => ({
  ok: true,
  data,
});

export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; data: T } {
  return result.ok === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}

export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  return result.ok ? Ok(fn(result.data)) : result;
}

export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.data) : result;
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.data : fallback;
}
