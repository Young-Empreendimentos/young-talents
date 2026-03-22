import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Book } from 'lucide-react';
import DocumentationSidebar from './DocumentationSidebar';
import { getDocBySlug, DOC_SECTIONS } from './docs/DocContent';

export default function DocumentationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const docParam = searchParams.get('doc') || 'visao-geral';
  const validSlug = DOC_SECTIONS.some((d) => d.slug === docParam) ? docParam : 'visao-geral';
  const [activeSlug, setActiveSlug] = useState(validSlug);

  useEffect(() => {
    setActiveSlug(validSlug);
  }, [validSlug]);

  const handleNavigate = (slug) => {
    setActiveSlug(slug);
    setSearchParams({ doc: slug });
  };

  const currentDoc = getDocBySlug(activeSlug);
  const ContentComponent = currentDoc.Component;

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <DocumentationSidebar activeSlug={activeSlug} onNavigate={handleNavigate} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Book size={28} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <h1 className="text-2xl font-bold text-foreground">
              {currentDoc.title}
            </h1>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ContentComponent />
          </div>
        </div>
      </main>
    </div>
  );
}
