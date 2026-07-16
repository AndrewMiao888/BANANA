import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Custom renderer to catch KaTeX patterns before markdown parses them.
 * Parses:
 * - Block math: $$ ... $$
 * - Inline math: $ ... $
 */
export function renderRichPayload(content: string): string {
  if (!content) return '';

  let processed = content;

  // 1. Render Block Math: $$ formula $$
  processed = processed.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
    try {
      return `<div class="katex-block-wrapper my-4 overflow-x-auto">${katex.renderToString(formula, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return match;
    }
  });

  // 2. Render Inline Math: $ formula $
  processed = processed.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch {
      return match;
    }
  });

  // 3. Parse Markdown (Headings, Code Fences, Horizontal rules, etc.)
  // We parse markdown synchronously with marked
  const parsedMarkdown = marked.parse(processed, { async: false }) as string;

  return parsedMarkdown;
}