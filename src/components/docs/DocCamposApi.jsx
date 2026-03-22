import React from 'react';
import { CANDIDATE_FIELDS, JOB_FIELDS, APPLICATION_FIELDS } from '../../constants';

function FieldTable({ fields, title }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-input rounded-lg text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left px-3 py-2 text-foreground">key (API/DB)</th>
              <th className="text-left px-3 py-2 text-foreground">displayName</th>
              <th className="text-left px-3 py-2 text-foreground">csvLabel</th>
              <th className="text-left px-3 py-2 text-foreground">type</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {fields.map((f) => (
              <tr key={f.key}>
                <td className="px-3 py-2 border-t dark:border-gray-600 font-mono text-xs">{f.key}</td>
                <td className="px-3 py-2 border-t dark:border-gray-600">{f.displayName || '-'}</td>
                <td className="px-3 py-2 border-t dark:border-gray-600 text-xs">{f.csvLabel || '-'}</td>
                <td className="px-3 py-2 border-t dark:border-gray-600">{f.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DocCamposApi() {
  return (
    <>
      <h2 id="mapeamento" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Mapeamento de campos</h2>
      <p className="text-muted-foreground mb-4">
        Cada entidade usa um mapeamento padronizado: <strong>key</strong> (nome no sistema/API), <strong>displayName</strong> (rótulo visual), <strong>csvLabel</strong> (coluna no CSV/Sheets para importação), <strong>type</strong> (tipo de dado). Útil para integrações futuras via API.
      </p>

      <h2 id="candidato" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Campos do Candidato</h2>
      <FieldTable fields={CANDIDATE_FIELDS} title="CANDIDATE_FIELDS" />

      <h2 id="vaga" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Campos da Vaga</h2>
      <FieldTable fields={JOB_FIELDS} title="JOB_FIELDS" />

      <h2 id="candidatura" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Campos da Candidatura (Application)</h2>
      <FieldTable fields={APPLICATION_FIELDS} title="APPLICATION_FIELDS" />
    </>
  );
}
