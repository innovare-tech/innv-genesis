type Ok<T> = { isOk: true; value: T; status: number };
type Err<E> = { isOk: false; error: E; status: number };

/**
 * Representa um resultado explícito que pode ser
 * um sucesso (Ok<T>) ou um erro (Err<E>).
 */
export type Result<T, E> = Ok<T> | Err<E>;

export const Ok = <T>(value: T, status: number): Ok<T> => ({
  isOk: true,
  value,
  status,
});

export const Err = <E>(error: E, status: number): Err<E> => ({
  isOk: false,
  error,
  status,
});
