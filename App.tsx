
import React, { useState } from "react";
import { GameProvider, useGame } from "./context/GameContext";
import { ActionCard } from "./components/ActionCard";
import { TaskCard } from "./components/TaskCard";
import { ResourceRow } from "./components/ResourceRow";
import { EquipmentView } from "./components/EquipmentView";
import { ResourceConfig } from "./types";

// --- Components ---
const SectionHeader: React.FC<{ 
    title: string; 
    isOpen: boolean; 
    onToggle: () => void; 
    count?: number; 
    colorClass?: string;
}> = ({ title, isOpen, onToggle, count, colorClass = "bg-gray-200" }) => (
    <div 
        onClick={onToggle}
        className={`flex items-center justify-between p-2 ${colorClass} border-b border-gray-300 cursor-pointer hover:bg-opacity-80 transition-colors select-none`}
    >
        <span className="font-bold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-2">
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

const GameLayout: React.FC = () => {
  const { state, config, toggleTask, checkPrerequisites, checkIsVisible, saveGame, resetGame, exportSave, importSave, setRestTask, getMaxResource } = useGame();
  const [activeTab, setActiveTab] = useState<'activity' | 'equipment' | 'completed'>('activity');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Modal State
  const [modalMode, setModalMode] = useState<'none' | 'export' | 'import' | 'reset'>('none');
  const [modalInput, setModalInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const activeTaskId = Object.keys(state.tasks).find(id => state.tasks[id].active);
  const activeTaskName = activeTaskId ? config.tasks.find(t => t.id === activeTaskId)?.name : "Idle";
  
  const hasItems = state.inventory.length > 0 || Object.keys(state.equipment).length > 0;

  const isActionCompleted = (actionId: string) => {
      const aConfig = config.actions.find(a => a.id === actionId);
      const aState = state.actions[actionId];
      if (!aConfig || !aState) return false;
      return aConfig.maxExecutions !== undefined && aState.executions >= aConfig.maxExecutions;
  };

  const hasCompletedUpgrades = config.actions.some(a => isActionCompleted(a.id));

  // Get unlocked rest tasks for dropdown
  const restTasks = config.tasks.filter(t => 
      t.type === 'rest' && 
      checkIsVisible(t.id, t.prerequisites)
  );

  const toggleSection = (id: string) => {
      setCollapsedSections(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  };

  // --- Modal Handlers ---

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

  // --- Resource Grouping Logic ---
  const basicResources = config.resources.filter(r => r.type === 'basic');
  const resourceGroups: { category: string, resources: ResourceConfig[] }[] = [];

  // 1. Map known categories
  config.categories.forEach(cat => {
      const resources = basicResources.filter(r => r.category === cat.id && getMaxResource(r.id) > 0);
      if (resources.length > 0) {
          resourceGroups.push({ category: cat.name, resources });
      }
  });

  // 2. Map uncategorized (or unknown category)
  const uncategorized = basicResources.filter(r => 
      (!r.category || !config.categories.find(c => c.id === r.category)) && 
      getMaxResource(r.id) > 0
  );
  if (uncategorized.length > 0) {
      resourceGroups.push({ category: "Other", resources: uncategorized });
  }

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
                            <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                Reset Game
                            </h2>
                        </div>
                        <p className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-100">
                            Are you sure you want to completely wipe your save? <br/>
                            This action cannot be undone.
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


      {/* HEADER */}
      <header className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between shadow-sm shrink-0 z-10 h-12">
        <h1 className="font-bold text-lg text-gray-700 tracking-tight">OpenIdle</h1>
        
        {/* Toolbar */}
        <div className="flex items-center gap-3">
             <div className="text-xs text-gray-500 font-mono hidden sm:block mr-2">
                Time: {(state.totalTimePlayed / 1000).toFixed(0)}s
            </div>
            <button onClick={saveGame} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 font-medium transition-colors">
                Save
            </button>
            <button onClick={handleExportClick} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 font-medium transition-colors">
                Export
            </button>
            <button onClick={handleImportClick} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 font-medium transition-colors">
                Import
            </button>
            <button onClick={handleResetClick} className="px-3 py-1 text-xs bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600 font-medium transition-colors">
                Reset
            </button>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="flex flex-grow overflow-hidden">
        
        {/* LEFT COLUMN: BASIC RESOURCES */}
        <aside className="w-56 bg-gray-50 border-r border-gray-300 flex flex-col shrink-0">
          <div className="p-3 bg-gray-200 border-b border-gray-300 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">
            Resources
          </div>
          <div className="flex-grow overflow-y-auto">
            {/* Categorized Resources */}
            {resourceGroups.map(group => {
                const isOpen = !collapsedSections[`res-${group.category}`];
                return (
                    <div key={group.category}>
                        <SectionHeader 
                            title={group.category} 
                            isOpen={isOpen} 
                            onToggle={() => toggleSection(`res-${group.category}`)} 
                            count={group.resources.length}
                            colorClass="bg-gray-100 text-[10px]"
                        />
                        {isOpen && (
                            <div className="p-2 space-y-1">
                                {group.resources.map(res => (
                                    <ResourceRow key={res.id} resource={res} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
          </div>
          
          {/* LOG */}
          <div className="h-48 border-t border-gray-300 bg-white flex flex-col">
             <div className="p-1 bg-gray-100 border-b border-gray-200 text-[10px] font-bold text-gray-500 text-center uppercase">Game Log</div>
             <div className="flex-grow overflow-y-auto p-2 font-mono text-[10px] leading-4 space-y-1">
                 {state.log.map((entry, i) => (
                     <div key={i} className={`${i === 0 ? 'text-black' : 'text-gray-400'}`}>
                         {i === 0 ? '>' : ''} {entry}
                     </div>
                 ))}
             </div>
          </div>
        </aside>

        {/* MIDDLE COLUMN: TABS + CONTENT */}
        <main className="flex-grow bg-white flex flex-col min-w-[300px] relative">
           {/* Tab Navigation */}
           <div className="flex border-b border-gray-300 bg-gray-50">
               <button 
                   onClick={() => setActiveTab('activity')}
                   className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-r border-gray-200 hover:bg-gray-100 ${activeTab === 'activity' ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'text-gray-500'}`}
               >
                   Activity
               </button>
               {hasItems && (
                   <button 
                       onClick={() => setActiveTab('equipment')}
                       className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-r border-gray-200 hover:bg-gray-100 ${activeTab === 'equipment' ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'text-gray-500'}`}
                   >
                       Equipment
                   </button>
               )}
               {hasCompletedUpgrades && (
                   <button 
                       onClick={() => setActiveTab('completed')}
                       className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide hover:bg-gray-100 ${activeTab === 'completed' ? 'bg-white text-blue-600 border-b-2 border-b-blue-500' : 'text-gray-500'}`}
                   >
                       Completed
                   </button>
               )}
           </div>

           {activeTab === 'activity' && (
             <>
               {/* Active Task Banner */}
               <div className="bg-orange-50 border-b border-orange-200 p-2 text-center shadow-sm shrink-0 flex items-center justify-center gap-4">
                   <div className="flex items-center">
                        <span className="text-xs text-orange-600 uppercase font-bold tracking-wide mr-2">Current Activity:</span>
                        <span className={`font-bold ${activeTaskId ? 'text-orange-800' : 'text-gray-400 italic'}`}>
                            {activeTaskName}
                        </span>
                   </div>

                   {/* Rest Task Selector */}
                   {restTasks.length > 0 && (
                        <div className="flex items-center gap-1 border-l border-orange-200 pl-4">
                            <span className="text-[10px] text-orange-600 uppercase font-bold tracking-wide">Fallback Rest:</span>
                            <select 
                                value={state.selectedRestTaskId || ''}
                                onChange={(e) => setRestTask(e.target.value)}
                                className="text-xs bg-white border border-orange-200 text-orange-800 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-orange-300"
                            >
                                <option value="" disabled>Select Rest Task</option>
                                {restTasks.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                   )}
               </div>

               <div className="flex-grow overflow-y-auto p-4 max-w-4xl mx-auto w-full">
                    {config.categories.map(cat => {
                        const tasks = config.tasks.filter(t => t.category === cat.id && checkIsVisible(t.id, t.prerequisites));
                        const actions = config.actions.filter(a => 
                            a.category === cat.id && 
                            checkIsVisible(a.id, a.prerequisites) && 
                            !isActionCompleted(a.id)
                        );
                        
                        if (tasks.length === 0 && actions.length === 0) return null;
                        
                        const isOpen = !collapsedSections[`cat-${cat.id}`];

                        return (
                            <div key={cat.id} className="mb-4 border border-gray-200 rounded-sm overflow-hidden shadow-sm">
                                <SectionHeader 
                                    title={cat.name} 
                                    isOpen={isOpen} 
                                    onToggle={() => toggleSection(`cat-${cat.id}`)}
                                />
                                {isOpen && (
                                    <div className="p-2 bg-gray-50/50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {tasks.map(t => {
                                                return <TaskCard key={t.id} task={t} isLocked={false} />;
                                            })}
                                            {actions.map(a => {
                                                return <ActionCard key={a.id} action={a} isLocked={false} />;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
               </div>
             </>
           )}

           {activeTab === 'equipment' && <EquipmentView />}
           
           {activeTab === 'completed' && (
               <div className="flex-grow overflow-y-auto p-4 max-w-2xl mx-auto w-full">
                   <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200 mb-4 pb-1">
                        Completed Upgrades
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 opacity-75 grayscale hover:grayscale-0 transition-all">
                        {config.actions.filter(a => isActionCompleted(a.id)).map(a => (
                            <ActionCard key={a.id} action={a} />
                        ))}
                   </div>
               </div>
           )}
        </main>

        {/* RIGHT COLUMN: BODY STATS */}
        <aside className="w-64 bg-gray-50 border-l border-gray-300 flex flex-col shrink-0">
           
           {/* Active Tasks HUD (Multitasking) */}
           {state.maxConcurrentTasks > 1 && (
             <div className="bg-white border-b border-gray-300 flex-shrink-0 shadow-sm z-10">
                <div className="p-2 bg-orange-100 border-b border-orange-200 font-bold text-orange-800 text-xs uppercase tracking-wider text-center flex justify-between items-center">
                    <span>Active Tasks</span>
                    <span className="font-mono text-[10px] opacity-80 bg-orange-200 px-1.5 rounded text-orange-900">
                        {state.activeTaskIds.length} / {state.maxConcurrentTasks}
                    </span>
                </div>
                <div className="p-2 space-y-1.5 max-h-60 overflow-y-auto bg-orange-50/30">
                    {state.activeTaskIds.length === 0 && (
                        <div className="text-center text-gray-400 text-[10px] italic py-2">
                            No tasks running.<br/>Select tasks to multitask.
                        </div>
                    )}
                    {state.activeTaskIds.map(tid => {
                        const task = config.tasks.find(t => t.id === tid);
                        if(!task) return null;
                        const tState = state.tasks[tid];
                        // Calculate simplistic progress for visual feedback
                        const progress = tState.progress || 0;
                        const req = task.progressRequired || 1;
                        const pct = Math.min(100, (progress/req)*100);
                        const isLoop = task.autoRestart;

                        return (
                            <div 
                                key={tid}
                                onClick={() => toggleTask(tid)}
                                className="group flex flex-col bg-white border border-orange-200 rounded-sm p-2 cursor-pointer hover:bg-red-50 hover:border-red-300 transition-all relative overflow-hidden shadow-sm select-none"
                                title="Click to stop task"
                            >
                                {/* Progress Bar Background */}
                                {req > 0 && (
                                     <div className="absolute left-0 bottom-0 h-0.5 bg-gray-100 w-full">
                                        <div 
                                            className={`h-full transition-all duration-200 ${isLoop ? 'bg-orange-400' : 'bg-blue-500'}`} 
                                            style={{width: `${pct}%`}}
                                        ></div>
                                     </div>
                                )}
                                
                                <div className="flex justify-between items-center z-10 relative gap-2">
                                    <span className="text-xs font-semibold text-gray-700 group-hover:text-red-700 truncate">{task.name}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                         {isLoop && (
                                             <svg className="w-2.5 h-2.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                             </svg>
                                         )}
                                         <span className="text-[10px] text-gray-300 group-hover:text-red-500 font-bold">✕</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
           )}

           <div className="p-3 bg-gray-200 border-b border-gray-300 font-bold text-gray-600 text-xs uppercase tracking-wider text-center">
            Body & Stats
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {config.resources.filter(r => r.type === 'stat').map((res) => (
                  <ResourceRow key={res.id} resource={res} />
              ))}
          </div>
        </aside>

      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <GameLayout />
    </GameProvider>
  );
};

export default App;
