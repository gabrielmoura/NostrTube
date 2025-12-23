import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import type { ChangeEvent } from "react";

/**
 * Payload interno utilizado pelo Subject de debounce.
 *
 * @template T
 * @property {string} value - Valor a ser aplicado após o debounce.
 * @property {(value: string) => void} setter - Função responsável por aplicar o valor no store.
 */
type DebouncePayload<T = unknown> = {
  value: string;
  setter: (value: string) => void;
};

/**
 * Stream RxJS responsável por enfileirar atualizações
 * e aplicá-las após o tempo de debounce configurado.
 */
const debounce$ = new Subject<DebouncePayload>();

/**
 * Assinatura da stream com debounce.
 * Após o tempo configurado, executa o setter com o último valor emitido.
 */
debounce$
  .pipe(debounceTime(250))
  .subscribe(({ value, setter }) => {
    setter(value);
  });

/**
 * Enfileira uma atualização de estado com debounce.
 *
 * Útil para evitar múltiplas mutações consecutivas em stores
 * (ex.: Valtio) durante eventos de alta frequência como digitação.
 *
 * @example
 * ```ts
 * debounceStoreUpdate(value, (v) => {
 *   store.name = v;
 * });
 * ```
 *
 * @example
 * ```ts
 *   onChange={(e) =>
 *               handleChange(e, (value) => {
 *                 store.summary = value;
 *               })
 *             }
 * ```
 *
 * @param {string} value - Valor a ser aplicado após o debounce.
 * @param {(value: string) => void} setter - Função que aplica o valor no store.
 *
 * @returns {void}
 */
export function debounceStoreUpdate(
  value: string,
  setter: (value: string) => void
): void {
  debounce$.next({ value, setter });
}

export function debounceHandleChange(
  e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  setter: (value: string) => void
) {
  debounceStoreUpdate(e.target.value, setter);
}
