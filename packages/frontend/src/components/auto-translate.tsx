'use client';

import { cloneElement, isValidElement, useMemo, type ReactElement, type ReactNode } from 'react';
import { lookupPhrase, type Locale } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n-context';

/**
 * Applies the phrase dictionary to the React tree a page/component renders.
 *
 * This is deliberately a React-element transform, not a DOM mutation: the
 * project ships a workaround for browser page translators rewriting the DOM
 * under React (see `translation-safe-dom.ts`), and doing the same here would
 * reintroduce that crash. Nothing is executed — an untranslated string is
 * returned byte-for-byte, so data, user content and backend messages survive.
 *
 * Limitations (by design):
 *  - exact matches only, on trimmed text and a small allowlist of attributes;
 *  - a component's own JSX is only reachable when that component wraps its
 *    own render tree, hence the wrapper is mounted in each UI surface.
 */
const SKIP_TAGS = new Set(['script', 'style', 'code', 'pre', 'textarea', 'svg', 'path']);
const TEXT_PROPS = ['placeholder', 'title', 'aria-label', 'alt', 'subtitle', 'label'] as const;

function localizeText(text: string, locale: Locale): string {
  const core = text.trim();
  if (core.length < 2 || core.length > 240 || core.includes('\n')) return text;
  // Numbers, dates, paths, URLs and e-mail-ish values are data, not copy.
  if (/^[\d\s.,:+\-/%€$]+$/u.test(core)) return text;
  if (/^https?:\/\//i.test(core) || core.startsWith('/')) return text;
  const hit = lookupPhrase(locale, core);
  if (!hit) return text;
  const lead = text.slice(0, text.length - text.trimStart().length);
  const trail = text.slice(text.trimEnd().length);
  return lead + hit + trail;
}

function localize(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === 'string') return localizeText(node, locale);

  if (Array.isArray(node)) {
    let changed = false;
    const next = node.map((child) => {
      const translated = localize(child, locale);
      if (translated !== child) changed = true;
      return translated;
    });
    // Keep the original array identity (and therefore element keys) when
    // nothing matched, so no subtree is remounted.
    return changed ? next : node;
  }

  if (!isValidElement(node)) return node;
  if (typeof node.type === 'string' && SKIP_TAGS.has(node.type.toLowerCase())) return node;

  const props = node.props as Record<string, unknown>;
  let changed = false;
  const nextProps: Record<string, unknown> = {};
  for (const key of TEXT_PROPS) {
    const value = props[key];
    if (typeof value === 'string') {
      const translated = localizeText(value, locale);
      if (translated !== value) {
        nextProps[key] = translated;
        changed = true;
      }
    }
  }

  const nextChildren = localize(props.children as ReactNode, locale);
  if (nextChildren !== props.children) changed = true;
  if (!changed) return node;
  return cloneElement(node as ReactElement<Record<string, unknown>>, nextProps, nextChildren as ReactNode);
}

export function AutoTranslate({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const localized = useMemo(
    () => (locale === 'en' ? children : localize(children, locale)),
    [children, locale],
  );
  return <>{localized}</>;
}
