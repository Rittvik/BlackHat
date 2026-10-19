import React from 'react';
import { X, Circle, ChevronRight, FileCode } from 'lucide-react';
import { EditorTab } from '../../types';

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabIndex: number;
  onSelectTab: (index: number) => void;
  onCloseTab: (index: number) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabIndex,
  onSelectTab,
  onCloseTab,
}) => {
  if (tabs.length === 0) return null;

  const activeTab = tabs[activeTabIndex];
  const pathParts = activeTab ? activeTab.path.split('/').filter(Boolean) : [];

  return (
    <div className="flex flex-col shrink-0 select-none bg-[#14151a]">
      {/* Apple Safari / Xcode-style Floating Tab Bar */}
      <div className="h-[38px] px-2 flex items-center gap-1.5 bg-[#14151a]/90 backdrop-blur-xl border-b border-white/[0.08] overflow-x-auto apple-specular-top">
        {tabs.map((tab, idx) => {
          const isActive = idx === activeTabIndex;
          return (
            <div
              key={tab.path}
              onClick={() => onSelectTab(idx)}
              className={`group h-[28px] px-3 rounded-lg flex items-center gap-2 cursor-pointer text-[12px] font-medium transition-all shrink-0 apple-interactive-subtle ${
                isActive 
                  ? 'bg-white/[0.13] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)] border border-white/[0.12]' 
                  : 'text-white/50 hover:text-white/90 hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#0A84FF]' : 'text-white/40'}`} />
              <span className="truncate max-w-[160px] tracking-tight">{tab.name}</span>

              {tab.isDirty ? (
                <Circle className="w-2 h-2 fill-[#FF9F0A] text-[#FF9F0A] shrink-0 ml-0.5" />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(idx);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full hover:bg-white/[0.16] text-white/50 hover:text-white flex items-center justify-center transition-all ml-1"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Apple Subtle Breadcrumbs Row */}
      {activeTab && (
        <div className="h-[24px] px-3 flex items-center gap-1.5 text-[11px] text-white/50 bg-[#14151a]/60 border-b border-white/[0.06]">
          <span className="hover:text-white/80 cursor-pointer transition-colors">BlackHat</span>
          {pathParts.map((part, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />
              <span className={`hover:text-white/90 cursor-pointer transition-colors ${i === pathParts.length - 1 ? 'text-white/90 font-medium' : ''}`}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
