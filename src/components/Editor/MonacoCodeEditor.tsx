import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { EditorTab } from '../../types';

interface MonacoCodeEditorProps {
  activeTab?: EditorTab;
  onChangeContent: (content: string) => void;
  onSave: () => void;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  activeTab,
  onChangeContent,
  onSave
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define Antigravity / VS Code Dark Modern Theme for Monaco
    monaco.editor.defineTheme('antigravityDarkModern', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'identifier', foreground: 'd4d4d4' },
        { token: 'delimiter', foreground: 'cccccc' },
        { token: 'function', foreground: 'dcdcaa' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#cccccc',
        'editorCursor.foreground': '#58a6ff',
        'editor.lineHighlightBackground': '#ffffff0a',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#cccccc',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d4180'
      }
    });

    monaco.editor.setTheme('antigravityDarkModern');

    // Add save command shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  };

  if (!activeTab) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1e1e] text-[#858585] select-none">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <div className="w-12 h-12 rounded-lg bg-[#252525] border border-[#2b2b2b] flex items-center justify-center text-[#58a6ff] mb-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-white tracking-wide">BlackHat IDE</h3>
          <p className="text-xs text-[#858585] leading-relaxed">
            Autonomous multi-agent development environment powered by Gemini, Claude, and Codex.
          </p>
          <div className="mt-3 flex flex-col gap-2 text-xs text-[#9d9d9d] w-full max-w-xs">
            <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#222222] border border-[#2b2b2b]">
              <span>Quick Open</span>
              <kbd className="px-1.5 py-0.5 bg-[#181818] border border-[#333333] rounded text-[10px] font-mono text-white">Cmd + P</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#222222] border border-[#2b2b2b]">
              <span>Command Palette</span>
              <kbd className="px-1.5 py-0.5 bg-[#181818] border border-[#333333] rounded text-[10px] font-mono text-white">Cmd + K</kbd>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#222222] border border-[#2b2b2b]">
              <span>Toggle Terminal</span>
              <kbd className="px-1.5 py-0.5 bg-[#181818] border border-[#333333] rounded text-[10px] font-mono text-white">Ctrl + `</kbd>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-[#1e1e1e]">
      <Editor
        path={activeTab.path}
        language={activeTab.language}
        value={activeTab.content}
        theme="antigravityDarkModern"
        onChange={(val) => onChangeContent(val || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          fontFamily: '"JetBrains Mono", Menlo, Monaco, monospace',
          fontLigatures: true,
          lineHeight: 20,
          minimap: { enabled: true, maxColumn: 80, scale: 0.8 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderWhitespace: 'selection',
          padding: { top: 10, bottom: 10 }
        }}
      />
    </div>
  );
};
