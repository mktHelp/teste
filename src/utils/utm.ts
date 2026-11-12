/**
 * Captura dos parâmetros UTM da URL.
 *
 * Regra de atribuição: "último clique com UTM".
 *  - Se a URL atual tem qualquer UTM → substitui o que estava salvo.
 *  - Se não tem (acesso direto, reload, retorno) → reaproveita o último salvo por até 30 dias.
 *
 * Assim o lead mantém a origem mesmo se a pessoa recarregar a página ou voltar depois
 * sem os parâmetros na URL.
 */

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Record<UtmKey, string>;

const STORAGE_KEY = 'hm_funil_utms';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const MAX_LENGTH = 200;

const empty = (): UtmParams => ({
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
  utm_term: '',
});

let current: UtmParams = empty();

function readFromUrl(search: string): UtmParams | null {
  const params = new URLSearchParams(search);
  const utms = empty();
  let found = false;

  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().slice(0, MAX_LENGTH) ?? '';
    if (value) {
      utms[key] = value;
      found = true;
    }
  }
  return found ? utms : null;
}

function readFromStorage(): UtmParams | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { utms: UtmParams; savedAt: number };
    if (Date.now() - saved.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { ...empty(), ...saved.utms };
  } catch {
    return null;
  }
}

function saveToStorage(utms: UtmParams) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ utms, savedAt: Date.now() }));
  } catch {
    // modo privado / storage bloqueado: segue só com o valor em memória
  }
}

/** Chamar uma vez, no carregamento da página, antes de qualquer mudança de URL. */
export function captureUtms(): UtmParams {
  const fromUrl = readFromUrl(window.location.search);
  if (fromUrl) {
    saveToStorage(fromUrl);
    current = fromUrl;
  } else {
    current = readFromStorage() ?? empty();
  }
  return current;
}

/** UTMs da sessão atual (strings vazias quando não houver). */
export function getUtms(): UtmParams {
  return { ...current };
}
