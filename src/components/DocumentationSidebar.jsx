import React from 'react';
import { DOC_SECTIONS, getDocBySlug } from './docs/DocContent';

export default function DocumentationSidebar({ activeSlug, onNavigate }) {
  const currentDoc = getDocBySlug(activeSlug);

  return (
    <aside
      className="w-64 flex-shrink-0 border-r border-border bg-muted/50/50 flex flex-col h-full"
      style={{ maxHeight: 'calc(100vh - 4rem)' }}
    >
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1 mb-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Páginas
          </p>
          {DOC_SECTIONS.map((doc) => (
            <button
              key={doc.slug}
              type="button"
              onClick={() => onNavigate(doc.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSlug === doc.slug
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                  : 'text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {doc.title}
            </button>
          ))}
        </div>

        {currentDoc && currentDoc.sections?.length > 0 && (
          <div className="space-y-1 pt-4 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Nesta página
            </p>
            {currentDoc.sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 truncate"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
