import { useCallback, useEffect, useRef, useState } from 'react';

interface Resource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Loads data for the current set of inputs.
 *
 * The obvious version of this clears `data` and `error` at the top of the
 * effect, which is a setState during an effect and costs a second render pass
 * on every keystroke-driven filter change. Instead each result is stamped with
 * the inputs it was fetched for, and anything stamped with stale inputs simply
 * reads as loading — so the reset is derived rather than assigned.
 */
export function useResource<T>(load: () => Promise<T>, key: string, onError?: (err: unknown) => void): Resource<T> {
  const [nonce, setNonce] = useState(0);
  // `key: null` is the never-loaded state; a real token is always a string.
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({ key: null, data: null, error: null });

  // Both change identity on every render, so the fetch effect keys off `token`
  // alone and reads them through refs. This effect is declared first, so it has
  // already refreshed them by the time the fetch below runs.
  const loadRef = useRef(load);
  const errorRef = useRef(onError);
  useEffect(() => {
    loadRef.current = load;
    errorRef.current = onError;
  });

  const token = `${key}#${nonce}`;

  useEffect(() => {
    let live = true;
    loadRef.current().then(
      data => live && setState({ key: token, data, error: null }),
      err => {
        if (!live) return;
        setState({ key: token, data: null, error: err instanceof Error ? err.message : 'Something went wrong' });
        errorRef.current?.(err);
      },
    );
    return () => {
      live = false;
    };
  }, [token]);

  const fresh = state.key === token;
  return {
    // The previous result stays on screen while the next one loads, so changing
    // a filter or refetching after an edit does not flash a skeleton over a
    // screen the person is already reading.
    data: state.data,
    error: fresh ? state.error : null,
    loading: !fresh,
    reload: useCallback(() => setNonce(n => n + 1), []),
  };
}
