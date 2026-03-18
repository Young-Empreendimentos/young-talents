import React from 'react';
import { Mail, Phone, MapPin, Briefcase, TrendingUp, Clock as ClockIcon, Car, GraduationCap, Tag } from 'lucide-react';
import { getCandidateAge } from '../../../utils/candidateDisplay';
import { STATUS_COLORS, PIPELINE_STAGES } from '../../../constants';
import { photoDisplayUrl, parseCandidateUrls, copyToClipboard } from '../../../utils/urlUtils';
import { Copy, Check } from 'lucide-react';
import { useLinkStatus } from '../../../utils/useLinkStatus';
import { LinkStatusBadge } from '../../ui/LinkStatusBadge';

function CvLinkRow({ url, idx, total, copiedUrl, onCopy }) {
    const status = useLinkStatus(url);
    return (
        <div className="flex items-center gap-1">
            <a href={url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-l-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800 border-r-0">
                {total > 1 ? `CV ${idx + 1}` : 'Ver CV'}
            </a>
            <LinkStatusBadge status={status} label="CV" />
            <button
                onClick={() => onCopy(url)}
                className="px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-r-lg border border-blue-200 dark:border-blue-800 transition-colors"
                title="Copiar URL"
            >
                {copiedUrl === url ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
        </div>
    );
}

function PortfolioLinkRow({ url, idx, total, copiedUrl, onCopy }) {
    const status = useLinkStatus(url);
    return (
        <div className="flex items-center gap-1">
            <a href={url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-l-lg text-xs font-medium hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-800 border-r-0">
                {total > 1 ? `Portfólio ${idx + 1}` : 'Ver Portfólio'}
            </a>
            <LinkStatusBadge status={status} label="Portfólio" />
            <button
                onClick={() => onCopy(url)}
                className="px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-r-lg border border-purple-200 dark:border-purple-800 transition-colors"
                title="Copiar URL"
            >
                {copiedUrl === url ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
        </div>
    );
}

export default function OverviewTab({
    candidate,
    scorecards,
    photoLoadError,
    setPhotoLoadError
}) {
    const [copiedUrl, setCopiedUrl] = React.useState(null);

    const handleCopy = async (url) => {
        const success = await copyToClipboard(url);
        if (success) {
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        }
    };

    const cvUrls = parseCandidateUrls(candidate.cvUrl);
    const portfolioUrls = parseCandidateUrls(candidate.portfolioUrl);
    return (
        <div className="space-y-6">
            {/* Scorecards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {scorecards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${card.color} text-white`}>
                                    <Icon size={24} />
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${card.color} text-white`}>
                                    {card.subtitle}
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {card.title}
                            </h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {card.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contato e Essenciais */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Mail size={20} />
                        Informações de Contato
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">E-mail Principal</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {candidate.email || 'Não informado'}
                                </p>
                            </div>
                        </div>
                        {candidate.phone && (
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Telefone</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {candidate.phone}
                                    </p>
                                </div>
                            </div>
                        )}
                        {candidate.city && (
                            <div className="flex items-center gap-3">
                                <MapPin size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Cidade</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {candidate.city}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Car size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">CNH (tipo B)</p>
                                <p className={`text-sm font-medium ${candidate.hasLicense ? 'text-gray-900 dark:text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {candidate.hasLicense === 'Sim' ? 'Sim' : candidate.hasLicense === 'Não' ? 'Não' : 'Não informado'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ClockIcon size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Idade</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {(() => {
                                        const a = getCandidateAge(candidate);
                                        return a != null ? `${a} anos` : 'Não informado';
                                    })()}
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Dados da inscrição</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-2">
                                    <Tag size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Áreas de interesse</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{candidate.interestAreas || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <GraduationCap size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Escolaridade</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{candidate.schoolingLevel || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Pretensão Salarial</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{candidate.salaryExpectation || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Disponibilidade mudança</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{candidate.canRelocate || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status e Perfil Rápido */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Status e Links
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Status Atual no Funil</p>
                            <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'}`}>
                                {candidate.status || 'Inscrito'}
                            </span>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Links Rápidos</h3>
                            <div className="space-y-3">
                                {/* CV Links */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Currículo (CV)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {cvUrls.length > 0 ? (
                                            cvUrls.map((url, idx) => (
                                                <CvLinkRow
                                                    key={idx}
                                                    url={url}
                                                    idx={idx}
                                                    total={cvUrls.length}
                                                    copiedUrl={copiedUrl}
                                                    onCopy={handleCopy}
                                                />
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Nenhum CV anexado</span>
                                        )}
                                    </div>
                                </div>

                                {/* Portfolio Links */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Portfólio</p>
                                    <div className="flex flex-wrap gap-2">
                                        {portfolioUrls.length > 0 ? (
                                            portfolioUrls.map((url, idx) => (
                                                <PortfolioLinkRow
                                                    key={idx}
                                                    url={url}
                                                    idx={idx}
                                                    total={portfolioUrls.length}
                                                    copiedUrl={copiedUrl}
                                                    onCopy={handleCopy}
                                                />
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Nenhum portfólio cadastrado</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Bio/Campo Livre</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                {candidate.freeField ? `"${candidate.freeField.substring(0, 150)}${candidate.freeField.length > 150 ? '...' : ''}"` : 'Nenhuma observação adicional.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
