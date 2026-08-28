import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GameProvider, useGame } from './context/GameContext';
import { ActionCard } from './components/ActionCard';
import { TaskCard } from './components/TaskCard';
import { ResourceRow } from './components/ResourceRow';
import { EquipmentView } from './components/EquipmentView';
import { ConverterCard } from './components/ConverterCard';
import { FormSelector } from './components/FormSelector';
import { CategoryConfig, ResourceConfig, LogCategory, LogEntry, Cost } from './types';
import { BESTIARY } from './gameData/side/bestiary';
import { getSeasonForDate } from './gameData/live/seasons';

// --- Components ---
const SectionHeader: React.FC<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    count?: number;
    colorClass?: string;
    level?: number;
    bordered?: boolean;
}> = ({ title, isOpen, onToggle, count, colorClass = "bg-gray-200", level = 1, bordered = true }) => {
    const headerLevel = Math.min(level, 3);
    const headerPadding = headerLevel === 1 ? 'p-2' : headerLevel === 2 ? 'p-1.5' : 'p-1';
    const headerText = headerLevel === 1 ? 'text-xs' : headerLevel === 2 ? 'text-[11px]' : 'text-[10px]';

    return (
    <div
        onClick={onToggle}
        className={`flex items-center justify-between ${headerPadding} ${colorClass} ${bordered ? 'border-b border-gray-300' : ''} cursor-pointer hover:bg-opacity-80 transition-colors select-none`}
    >
        <span className={`font-bold text-gray-700 ${headerText} uppercase tracking-wider flex items-center gap-2`}>
            <svg
                className={`w-3 h-3 text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {title}
        </span>
        {count !== undefined && <span className="text-[10px] text-gray-500 font-mono">({count})</span>}
    </div>
    );
};

const GameLayout: React.FC = () => {
    const { state, config, toggleTask, checkPrerequisites, checkIsVisible, saveGame, resetGame, exportSave, importSave, setRestTask, getMaxResource, buyConverter, toggleConverter, secondKindling } = useGame();
    const [activeTab, setActiveTab] = useState<'activity' | 'equipment' | 'converters' | 'completed' | 'codex'>('activity');
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [logFilters, setLogFilters] = useState<Record<LogCategory, boolean>>({ flavour: true, loot: true, unlock: true, other: true });
    const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
    const [activeHoverRect, setActiveHoverRect] = useState<DOMRect | null>(null);
    const getActiveHoverTask = () => {
        if (!activeHoverId || !activeHoverRect) return null;
        const task = config.tasks.find(t => t.id === activeHoverId);
        if (!task) return null;
        return { task, rect: activeHoverRect, tState: state.tasks[activeHoverId] };
    };

    // --- Resource & Stat Grouping Logic (Fixed) ---
    const resourceGroups: { id: string; name: string; resources: ResourceConfig[] }[] = [];
    config.categories.forEach(cat => {
        const res = config.resources.filter(r => r.type !== 'stat' && r.category === cat.id && getMaxResource(r.id) > 0);
        if (res.length > 0) resourceGroups.push({ id: cat.id, name: cat.name, resources: res });
    });
    const uncategorizedResources = config.resources.filter(r => r.type !== 'stat' && !r.category && getMaxResource(r.id) > 0);
    const visibleStats = config.resources.filter(r => r.type === 'stat' && getMaxResource(r.id) > 0);
    const uncategorizedStats = visibleStats.filter(r => !r.category);
    const hasBestiary = ["bestiary_emberling", "bestiary_bramblehound", "bestiary_unremembered", "bestiary_greyfen_sentinel"].some(f => (state.flags as any)[f]);
    const seasonalEvent = getSeasonForDate(new Date());

    // --- Modal State & Handlers ---
    const [modalMode, setModalMode] = useState<'none' | 'export' | 'import' | 'reset'>('none');
    const [modalInput, setModalInput] = useState('');
    const [copyFeedback, setCopyFeedback] = useState(false);

    const handleExportClick = () => {
        const data = exportSave();
        setModalInput(data);
        setModalMode('export');
        setCopyFeedback(false);
    };

    const handleImportClick = () => {
        setModalInput('');
        setModalMode('import');
    };

    const handleResetClick = () => {
        setModalMode('reset');
    };

    const doImport = () => {
        if (importSave(modalInput)) {
            setModalMode('none');
        }
    };

    const doReset = () => {
        resetGame();
        setModalMode('none');
    };

    const doCopy = () => {
        navigator.clipboard.writeText(modalInput).then(() => {
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        });
    };

    const closeModal = () => {
        setModalMode('none');
        setModalInput('');
    };

    // --- Helpers ---
    const activeTaskId = Object.keys(state.tasks).find(id => state.tasks[id].active);
    const isAutoResting = !!(state.previousTaskId && state.restTaskId && state.activeTaskIds.includes(state.restTaskId));
    const activeTaskName = (() => {
        if (!activeTaskId) return "Idle";
        if (isAutoResting) {
            const prev = config.tasks.find(t => t.id === state.previousTaskId);
            return prev ? prev.name : config.tasks.find(t => t.id === activeTaskId)?.name || "Idle";
        }
        return config.tasks.find(t => t.id === activeTaskId)?.name || "Idle";
    })();
    const autoRestLabel = isAutoResting ? `auto-resting via ${config.tasks.find(t => t.id === state.restTaskId)?.name}` : null;

    const hasItems = state.inventory.length > 0 || Object.keys(state.equipment).length > 0;
    const hasConverters = config.converters.some(c => state.converters[c.id]?.unlocked);

    const isActionAtLimit = (actionId: string) => {
        const aConfig = config.actions.find(a => a.id === actionId);
        const aState = state.actions[actionId];
        if (!aConfig || !aState) return false;
        return aConfig.maxExecutions !== undefined && aState.executions >= aConfig.maxExecutions;
    };

    const isActionCompleted = (actionId: string) => {
        const aConfig = config.actions.find(a => a.id === actionId);
        if (!aConfig) return false;
        return isActionAtLimit(actionId) && !aConfig.hideWhenComplete;
    };

    const isTaskAtLimit = (taskId: string) => {
        const tConfig = config.tasks.find(t => t.id === taskId);
        const tState = state.tasks[taskId];
        if (!tConfig || !tState) return false;
        return tConfig.maxExecutions !== undefined && (tState.completions || 0) >= tConfig.maxExecutions;
    };

    const isTaskCompleted = (taskId: string) => {
        const tConfig = config.tasks.find(t => t.id === taskId);
        if (!tConfig) return false;
        return isTaskAtLimit(taskId) && !tConfig.hideWhenComplete;
    };

    const hasCompletedUpgrades = config.actions.some(a => isActionCompleted(a.id)) || config.tasks.some(t => isTaskCompleted(t.id));

    const toggleSection = (id: string) => {
        setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderActivityCategory = (cat: CategoryConfig, depth = 0): React.ReactNode => {
        const tasks = config.tasks.filter(t => t.category === cat.id && checkIsVisible(t.id, t.prerequisites) && !isTaskAtLimit(t.id));
        const actions = config.actions.filter(a => a.category === cat.id && checkIsVisible(a.id, a.prerequisites) && !isActionAtLimit(a.id));
        const childNodes = config.categories
            .filter(child => child.parentCategoryId === cat.id)
            .map(child => renderActivityCategory(child, depth + 1))
            .filter(Boolean);

        if (tasks.length === 0 && actions.length === 0 && childNodes.length === 0) return null;

        const isOpen = !collapsedSections[`cat-${cat.id}`];
        return (
            <div key={cat.id} className="mb-4">
                <SectionHeader title={cat.name} isOpen={isOpen} onToggle={() => toggleSection(`cat-${cat.id}`)} level={depth + 1} bordered={false} />
                {isOpen && (
                    <div className={`${depth === 0 ? 'p-2' : ''} bg-gray-50/50`}>
                        {(tasks.length > 0 || actions.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {tasks.map(t => <TaskCard key={t.id} task={t} isLocked={false} />)}
                                {actions.map(a => <ActionCard key={a.id} action={a} isLocked={false} />)}
                            </div>
                        )}
                        {childNodes}
                    </div>
                )}
            </div>
        );
    };

    const renderStatCategory = (cat: CategoryConfig, depth = 0): React.ReactNode => {
        const stats = visibleStats.filter(resource => resource.category === cat.id);
        const childNodes = config.categories
            .filter(child => child.parentCategoryId === cat.id)
            .map(child => renderStatCategory(child, depth + 1))
            .filter(Boolean);

        if (stats.length === 0 && childNodes.length === 0) return null;

        const isOpen = !collapsedSections[`stat-${cat.id}`];
        return (
            <div key={cat.id} className="mb-4">
                <SectionHeader title={cat.name} isOpen={isOpen} onToggle={() => toggleSection(`stat-${cat.id}`)} colorClass="bg-gray-100" level={depth + 1} bordered={false} />
                {isOpen && (
                    <div className={`${depth === 0 ? 'p-2' : ''} bg-gray-50/50`}>
                        {stats.length > 0 && (
                            <div className={`${depth === 0 ? 'p-2' : ''} space-y-4`}>
                                {stats.map(resource => <ResourceRow key={resource.id} resource={resource} />)}
                            </div>
                        )}
                        {childNodes}
                    </div>
                )}
            </div>
        );
    };

    const logCategoryMeta: Record<LogCategory, { label: string; color: string; dot: string }> = {
        flavour: { label: 'Flavour', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
        loot: { label: 'Loot', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
        unlock: { label: 'Unlocks', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
        other: { label: 'Other', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
    };
    const allLogFiltersOn = (Object.keys(logFilters) as LogCategory[]).every(k => logFilters[k]);
    const toggleLogFilter = (cat: LogCategory) => setLogFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
    const setAllLogFilters = (val: boolean) => setLogFilters({ flavour: val, loot: val, unlock: val, other: val });
    const getLogEntry = (entry: LogEntry | string): LogEntry => typeof entry === 'string' ? { msg: entry, category: 'other' } : entry;
    const filteredLog = (state.log as (LogEntry | string)[]).filter(e => logFilters[getLogEntry(e as any).category]);

    return (
        <div className="flex flex-col h-full bg-gray-100 text-sm font-sans text-gray-800 relative">

            {/* --- MODAL OVERLAYS --- */}
            {modalMode !== 'none' && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 border border-gray-200">
                        {modalMode === 'export' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Export Save</h2>
                                    <p className="text-xs text-gray-500">Copy this code and keep it safe.</p>
                                </div>
                                <textarea
                                    readOnly
                                    value={modalInput}
                                    className="w-full h-32 p-3 border border-gray-300 rounded text-xs font-mono bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                    <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Close</button>
                                    <button onClick={doCopy} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded font-bold shadow-sm transition-all flex items-center gap-2">
                                        {copyFeedback ? "Copied" : "Copy to Clipboard"}
                                    </button>
                                </div>
                            </>
                        )}

                        {modalMode === 'import' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Import Save</h2>
                                    <p className="text-xs text-gray-500">Paste your save string below. <span className="text-red-500 font-semibold">Warning: Overwrites current progress.</span></p>
                                </div>
                                <textarea
                                    value={modalInput}
                                    onChange={(e) => setModalInput(e.target.value)}
                                    placeholder="Paste save data here..."
                                    className="w-full h-32 p-3 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                    <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Cancel</button>
                                    <button
                                        onClick={doImport}
                                        disabled={!modalInput.trim()}
                                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded font-bold shadow-sm transition-all"
                                    >
                                        Load Save
                                    </button>
                                </div>
                            </>
                        )}

                        {modalMode === 'reset' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">Reset Game</h2>
                                </div>
                                <p className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-100">
                                    Are you sure you want to completely wipe your save? <br />This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition-colors">Cancel</button>
                                    <button onClick={doReset} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-bold shadow-sm transition-all">
                                        Yes, Wipe Everything
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between shadow-sm shrink-0 z-10 h-12">
                <h1 className="font-bold text-lg text-gray-700 tracking-tight">OpenIdle</h1>

                {/* Toolbar */}
                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 font-mono hidden sm:block mr-2">
                        Time: {(state.totalTimePlayed / 1000).toFixed(0)}s
                    </div>
                    <button onClick={saveGame} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 font-medium transition-colors">Save</button>
                    <button onClick={handleExportClick} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 font-medium transition-colors">Export</button>
                    <button onClick={handleImportClick} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 font-medium transition-colors">Import</button>
                    <button onClick={handleResetClick} className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600 font-medium transition-colors">Reset</button>
                    {state.flags["challenge_second_kindling"] && (
                        <button onClick={() => { if (confirm("Begin Second Kindling? This will reset progress but keep equipment and Temper. Continue?")) secondKindling(); }} className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded text-purple-700 font-medium transition-colors">Second Kindling</button>
                    )}
                </div>
            </header>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="flex flex-grow overflow-hidden">

                {/* LEFT COLUMN: BASIC RESOURCES (Fixed Grouping) */}
                <aside className="w-56 bg-gray-50 border-r border-gray-300 flex flex-col shrink-0">
                    <div className="p-2 bg-gray-100 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-center">Resources</div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                        {resourceGroups.map(group => (
                            <div key={group.id} className="border-b border-gray-300 pb-2 group-item">
                                <SectionHeader
                                    title={group.name}
                                    isOpen={!collapsedSections[`res-${group.id}`]}
                                    onToggle={() => toggleSection(`res-${group.id}`)}
                                    colorClass="bg-gray-100"
                                />
                                {!collapsedSections[`res-${group.id}`] && (
                                    <div className="p-2 space-y-1">
                                        {group.resources.map(res => <ResourceRow key={res.id} resource={res} />)}
                                    </div>
                                )}
                            </div>
                        ))}
                        {uncategorizedResources.length > 0 && (
                            <div className="border-b border-gray-300 pb-2 group-item">
                                <SectionHeader
                                    title="Uncategorized"
                                    isOpen={!collapsedSections['res-uncat']}
                                    onToggle={() => toggleSection('res-uncat')}
                                    colorClass="bg-gray-100"
                                />
                                {!collapsedSections['res-uncat'] && (
                                    <div className="p-2 space-y-1">
                                        {uncategorizedResources.map(res => <ResourceRow key={res.id} resource={res} />)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* LOG */}
                    <div className="h-64 border-t border-gray-300 bg-white flex flex-col">
                        <div className="p-1 bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-500 text-center uppercase flex items-center justify-between px-2">
                            Game Log
                            <span className="text-[9px] font-normal normal-case text-gray-400">{filteredLog.length}/{state.log.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 p-1.5 bg-gray-50 border-b border-gray-200">
                            {(Object.keys(logCategoryMeta) as LogCategory[]).map(cat => {
                                const meta = logCategoryMeta[cat];
                                const active = logFilters[cat];
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => toggleLogFilter(cat)}
                                        className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide transition-colors ${active ? meta.color : 'bg-white text-gray-300 border-gray-200'}`}
                                        title={meta.label}
                                    >
                                        {meta.label}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setAllLogFilters(!allLogFiltersOn)}
                                className="text-[9px] px-1.5 py-0.5 rounded border bg-white text-gray-500 border-gray-200 hover:bg-gray-100 ml-auto"
                            >
                                {allLogFiltersOn ? 'None' : 'All'}
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 font-mono text-[10px] leading-4 space-y-1">
                            {filteredLog.length === 0 ? (
                                <div className="text-gray-300 italic text-center py-2">No entries for selected filters.</div>
                            ) : (
                                filteredLog.map((raw: any, i: number) => {
                                    const entry = getLogEntry(raw);
                                    const meta = logCategoryMeta[entry.category];
                                    return (
                                        <div key={i} className={`flex gap-1.5 items-start ${i === 0 ? 'text-black' : 'text-gray-400'}`}>
                                            <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot} ${i !== 0 ? 'opacity-40' : ''}`} />
                                            <span className="flex-1 break-words">{i === 0 ? '> ' : ''}{entry.msg}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </aside>

                {/* MIDDLE COLUMN: TABS + CONTENT */}
                <main className="flex flex-col flex-1 bg-white overflow-hidden relative min-h-0">
                    {state.flags["met_cathal"] && (
                        <div className="bg-gray-100 border-b border-gray-300 p-2 text-xs flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                Auto-Rest:
                                <select value={state.restTaskId || ""} onChange={(e) => setRestTask(e.target.value || null)} className="bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500">
                                    <option value="">(None)</option>
                                    {config.tasks.filter(t => t.type === 'rest' && state.tasks[t.id]?.unlocked).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <span className="text-[10px] text-gray-400 italic">Unlocked at Hollow Reach</span>
                        </div>
                    )}

                    <div className="flex border-b border-gray-300 bg-gray-50 shrink-0">
                        <button onClick={() => setActiveTab('activity')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-r border-gray-200 hover:bg-gray-100 ${activeTab === 'activity' ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'text-gray-500'}`}>Activity</button>
                        {hasItems && (
                            <button onClick={() => setActiveTab('equipment')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-r border-gray-200 hover:bg-gray-100 ${activeTab === 'equipment' ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'text-gray-500'}`}>Equipment</button>
                        )}
                        {hasConverters && (
                            <button onClick={() => setActiveTab('converters')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-r border-gray-200 hover:bg-gray-100 ${activeTab === 'converters' ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'text-gray-500'}`}>Converters</button>
                        )}
                        {hasCompletedUpgrades && (
                            <button onClick={() => setActiveTab('completed')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-r border-gray-200 hover:bg-gray-100 ${activeTab === 'completed' ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'text-gray-500'}`}>Completed</button>
                        )}
                        {hasBestiary && (
                            <button onClick={() => setActiveTab('codex')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide hover:bg-gray-100 ${activeTab === 'codex' ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'text-gray-500'}`}>Codex</button>
                        )}
                    </div>

                    {activeTab === 'activity' && (
                        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                            {seasonalEvent && (
                                <div className="bg-amber-50 border-b border-amber-200 p-1.5 text-center text-[10px] text-amber-800 shrink-0">
                                    <span className="font-bold">Season: {seasonalEvent.name}</span> - {seasonalEvent.bonus} <span className="text-amber-600">({seasonalEvent.carryOver})</span>
                                </div>
                            )}
                            <div className="bg-orange-50 border-b border-orange-200 p-2 text-center shadow-sm shrink-0 flex items-center justify-center gap-4">
                                <span className="text-xs text-orange-600 uppercase font-bold tracking-wide mr-2">Current Activity:</span>
                                <span className={`font-bold ${activeTaskId ? 'text-orange-800' : 'text-gray-400 italic'}`}>{activeTaskName}</span>
                                {autoRestLabel && <span className="text-[10px] text-orange-600 ml-2 italic font-normal">({autoRestLabel})</span>}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full min-h-0">
                                <FormSelector />
                                {config.categories
                                    .filter(cat => !cat.parentCategoryId)
                                    .map(cat => renderActivityCategory(cat))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'equipment' && (
                        <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full min-h-0">
                            <EquipmentView />
                        </div>
                    )}

                    {activeTab === 'converters' && (
                        <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full min-h-0">
                            {config.converters.some(c => state.converters[c.id]?.owned) && (
                                <div className="mb-4 border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                    <SectionHeader title="Owned Converters" isOpen={!collapsedSections['conv-owned']} onToggle={() => toggleSection('conv-owned')} count={config.converters.filter(c => state.converters[c.id]?.owned).length} colorClass="bg-gray-100" />
                                    {!collapsedSections['conv-owned'] && (
                                        <div className="p-2 bg-gray-50/50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {config.converters.filter(c => state.converters[c.id]?.owned).map(converter => <ConverterCard key={converter.id} converter={converter} isOwned={true} />)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {config.converters.some(c => state.converters[c.id]?.unlocked && !state.converters[c.id]?.owned) && (
                                <div className="mb-4 border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                    <SectionHeader title="Available Converters" isOpen={!collapsedSections['conv-available']} onToggle={() => toggleSection('conv-available')} count={config.converters.filter(c => state.converters[c.id]?.unlocked && !state.converters[c.id]?.owned).length} colorClass="bg-gray-100" />
                                    {!collapsedSections['conv-available'] && (
                                        <div className="p-2 bg-gray-50/50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {config.converters.filter(c => state.converters[c.id]?.unlocked && !state.converters[c.id]?.owned).map(converter => <ConverterCard key={converter.id} converter={converter} isOwned={false} />)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!config.converters.some(c => state.converters[c.id]?.unlocked) && (
                                <div className="text-center text-gray-400 text-sm py-8">No converters available yet.</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'completed' && (
                        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full min-h-0">
                            <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200 mb-4 pb-1">Completed</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 opacity-75 grayscale hover:grayscale-0 transition-all">
                                {config.actions.filter(a => isActionCompleted(a.id)).map(a => <ActionCard key={a.id} action={a} />)}
                                {config.tasks.filter(t => isTaskCompleted(t.id)).map(t => <TaskCard key={t.id} task={t} />)}
                            </div>
                        </div>
                    )}

                    {activeTab === 'codex' && (
                        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full min-h-0">
                            <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200 mb-4 pb-1">Bestiary - Codex</h3>
                            <div className="space-y-3">
                                {BESTIARY.map(entry => {
                                    const unlocked = (state.flags as any)[`bestiary_${entry.id}`];
                                    return (
                                        <div key={entry.id} className={`border rounded p-3 ${unlocked ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-sm text-gray-800">{entry.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 uppercase">{entry.aspect}</span>
                                            </div>
                                            {unlocked ? (
                                                <>
                                                    <p className="text-xs text-gray-700 mb-1">{entry.description}</p>
                                                    <p className="text-[10px] text-gray-500 italic">Sign: {entry.sign}</p>
                                                </>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">Undiscovered - encounter via Aspect + braid work.</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {state.flags["challenge_second_kindling"] && (
                                <div className="mt-6 border-t border-gray-200 pt-4">
                                    <button onClick={() => { if (confirm("Begin Second Kindling? This will reset progress but keep equipment and Temper. Continue?")) secondKindling(); }} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded">Begin Second Kindling (NG+)</button>
                                    <p className="text-[10px] text-gray-500 mt-1 text-center">Resets tasks/actions, keeps equipment/Temper, higher start. Flag-gated.</p>
                                </div>
                            )}
                        </div>
                    )}

                </main>

                {/* RIGHT COLUMN: BODY STATS (Fixed Grouping) */}
                <aside className="w-64 bg-gray-50 border-l border-gray-300 flex flex-col shrink-0">
                    {state.maxConcurrentTasks > 1 && (
                        <div className="bg-white border-b border-gray-300 flex-shrink-0 shadow-sm z-10">
                            <div className="p-2 bg-orange-100 border-b border-orange-200 font-bold text-xs uppercase tracking-wider text-center flex justify-between items-center">Active Tasks</div>
                            <div className="flex-grow overflow-y-auto max-h-60 space-y-1.5 bg-orange-50/30 p-2">
                                {state.activeTaskIds.length === 0 && <div className="text-gray-400 text-[10px] italic py-2 text-center">No tasks running.</div>}
                                {state.activeTaskIds.map(tid => {
                                    const task = config.tasks.find(t => t.id === tid);
                                    if (!task) return null;
                                    const tState = state.tasks[tid];
                                    const hasProgress = task.progressRequired !== undefined;
                                    const progress = tState.progress || 0;
                                    const req = task.progressRequired || 1;
                                    const pct = hasProgress ? Math.min(100, (progress / req) * 100) : 0;
                                    const isLoop = task.autoRestart;
                                    const completions = tState.completions || 0;
                                    return (
                                        <div
                                            onClick={() => toggleTask(tid)}
                                            onMouseEnter={(e) => { setActiveHoverId(tid); setActiveHoverRect(e.currentTarget.getBoundingClientRect()); }}
                                            onMouseLeave={() => { setActiveHoverId(null); setActiveHoverRect(null); }}
                                            className="group flex flex-col gap-1 bg-white border border-orange-200 rounded-sm p-1.5 cursor-pointer hover:bg-red-50 transition-colors select-none"
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                {isLoop && <svg className="w-3 h-3 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                                                <span className="text-xs font-semibold text-gray-700 group-hover:text-red-700 truncate flex-grow">{task.name}</span>
                                                <span className="text-[9px] font-mono text-gray-400 shrink-0">
                                                    {hasProgress ? `${progress.toFixed(1)}/${req}s` : `Lv ${tState.level}`}
                                                </span>
                                            </div>
                                            {hasProgress ? (
                                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                                    <div className="h-full transition-none" style={{ width: `${pct}%`, backgroundColor: isLoop ? '#f97316' : '#ef4444' }} />
                                                </div>
                                            ) : (
                                                <div className="w-full h-1 bg-orange-100 rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-orange-300 animate-pulse" style={{ width: '100%' }} />
                                                </div>
                                            )}
                                            {hasProgress && completions > 0 && <span className="text-[9px] font-mono text-gray-400 self-end -mt-0.5">{completions} done</span>}
                                        </div>
                                    );
                                })}
                            </div>
                            {(() => {
                                const hover = getActiveHoverTask();
                                if (!hover) return null;
                                const { task, rect, tState } = hover;
                                const getName = (id: string) => config.resources.find(r => r.id === id)?.name || config.actions.find(a => a.id === id)?.name || config.tasks.find(t => t.id === id)?.name || config.items.find(i => i.id === id)?.name || id;
                                const getScaled = (c: Cost) => {
                                    if (!c.scaleFactor) return c.amount;
                                    const exp = (c as any).scalesByCompletion ? (tState.completions || 0) : (tState.level - 1);
                                    switch (c.scaleType) {
                                        case 'fixed': return c.amount + (c.scaleFactor * exp);
                                        case 'percentage': return c.amount * (1 + c.scaleFactor * exp);
                                        default: return c.amount * Math.pow(c.scaleFactor, exp);
                                    }
                                };
                                const style: React.CSSProperties = {
                                    position: 'fixed',
                                    top: rect.top + rect.height / 2 - 80,
                                    left: rect.left - 268,
                                    zIndex: 9999,
                                };
                                if ((style.left as number) < 8) style.left = rect.right + 8;
                                if ((style.top as number) < 8) style.top = 8;
                                return createPortal(
                                    <div style={style} className="bg-gray-200 border border-gray-400 text-gray-800 p-3 rounded shadow-2xl w-64 text-xs pointer-events-none z-[9999]">
                                        <div className="font-bold text-sm text-black leading-tight mb-1">{task.name}</div>
                                        <p className="text-gray-700 mb-2 leading-snug">{task.description}</p>
                                        {task.costPerSecond.length > 0 && (
                                            <>
                                                <div className="border-t border-gray-400 my-2"></div>
                                                <div className="font-semibold text-gray-600 italic mb-1">Cost/s</div>
                                                {task.costPerSecond.map(c => (
                                                    <div key={c.resourceId} className="flex justify-between"><span>{getName(c.resourceId)}</span><span className="font-mono text-red-700">{getScaled(c).toFixed(2)}/s</span></div>
                                                ))}
                                            </>
                                        )}
                                        {task.effectsPerSecond.filter(e => !e.hidden).length > 0 && (
                                            <>
                                                <div className="border-t border-gray-400 my-2"></div>
                                                <div className="font-semibold text-gray-600 italic mb-1">Gain/s</div>
                                                {task.effectsPerSecond.filter(e => !e.hidden).map((e, i) => (
                                                    <div key={i} className="flex justify-between"><span>{e.resourceId ? getName(e.resourceId) : 'Effect'}</span><span className="font-mono text-green-700">{e.amount}/s</span></div>
                                                ))}
                                            </>
                                        )}
                                        <div className="border-t border-gray-400 my-2"></div>
                                        <div className="text-[11px] text-gray-600">Lv {tState.level} • {tState.xp}/{tState.level * 100} XP • {tState.completions || 0} completions{task.progressRequired ? ` • ${((tState.progress || 0)).toFixed(1)}/${task.progressRequired}s` : ''}</div>
                                        <div className="text-[10px] text-gray-500 italic mt-1">Click to stop • Hover for details</div>
                                    </div>,
                                    document.body
                                );
                            })()}
                        </div>
                    )}

                    <div className="p-3 bg-gray-100 border-b border-gray-200 font-bold text-xs uppercase tracking-wider text-center">Stats</div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                        {config.categories
                            .filter(cat => !cat.parentCategoryId)
                            .map(cat => renderStatCategory(cat))}

                        {uncategorizedStats.length > 0 && (
                            <React.Fragment>
                            <SectionHeader title="Uncategorized" isOpen={!collapsedSections['stat-uncat']} onToggle={() => toggleSection('stat-uncat')} colorClass="bg-gray-100" />
                            {!collapsedSections['stat-uncat'] && (
                                <div className="p-2 space-y-4">
                                    {uncategorizedStats.map(res => <ResourceRow key={res.id} resource={res} />)}
                                </div>
                            )}
                            </React.Fragment>
                        )}
                    </div>
                </aside>

            </div>
        </div>
    );
};

const App: React.FC = () => (
    <GameProvider>
        <GameLayout />
    </GameProvider>
);

export default App;
