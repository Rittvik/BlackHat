import React from 'react';
import { X, Circle } from 'lucide-react';
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

  return (
    <div className="h-9 flex items-center bg-ide-sidebar border-b border-ide-border overflow-x-auto select-none">
      {tabs.map((tab, idx) => {
        const isActive = idx === activeTabIndex;
        return (
          <div
            key={tab.path}
            onClick={() => onSelectTab(idx)}
            className={`group h-full px-3.5 flex items-center gap-2 border-r border-ide-border cursor-pointer text-xs transition-colors shrink-0 ${
              isActive 
                ? 'bg-ide-bg text-white font-medium border-t-2 border-t-ide-accent' 
                : 'bg-ide-sidebar text-ide-muted hover:bg-ide-panel hover:text-ide-text'
            }`}
          >
            <span className="truncate max-w-[150px]">{tab.name}</span>
            {tab.isDirty ? (
              <Circle className="w-2 h-2 fill-ide-amber text-ide-amber shrink-0" />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(idx);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-ide-border text-ide-muted hover:text-white transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
