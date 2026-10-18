import React from 'react';
import { X, Circle, ChevronRight, FileCode, FileText } from 'lucide-react';
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
    <div className="flex flex-col shrink-0 select-none bg-[#181818]">
      {/* Tabs Row */}
      <div className="h-[35px] flex items-center bg-[#181818] border-b border-[#2b2b2b] overflow-x-auto">
        {tabs.map((tab, idx) => {
          const isActive = idx === activeTabIndex;
          return (
            <div
              key={tab.path}
              onClick={() => onSelectTab(idx)}
              className={`group h-full px-3.5 flex items-center gap-2 border-r border-[#2b2b2b] cursor-pointer text-[12px] transition-colors shrink-0 relative ${
                isActive 
                  ? 'bg-[#1e1e1e] text-white font-normal' 
                  : 'bg-[#181818] text-[#969696] hover:bg-[#1e1e1e] hover:text-[#cccccc]'
              }`}
            >
              {/* Active top line indicator */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0078d4]" />
              )}
              
              <span className="truncate max-w-[160px]">{tab.name}</span>

              {tab.isDirty ? (
                <Circle className="w-2 h-2 fill-[#d29922] text-[#d29922] shrink-0" />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(idx);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[rgba(255,255,255,0.12)] text-[#858585] hover:text-white transition-all ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Breadcrumbs Row */}
      {activeTab && (
        <div className="h-[22px] px-3 flex items-center gap-1.5 text-[11px] text-[#858585] bg-[#1e1e1e] border-b border-[#262626]">
          <span className="hover:text-[#cccccc] cursor-pointer">BlackHat</span>
          {pathParts.map((part, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3 h-3 text-[#555555] shrink-0" />
              <span className={`hover:text-[#cccccc] cursor-pointer ${i === pathParts.length - 1 ? 'text-[#cccccc] font-medium' : ''}`}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
