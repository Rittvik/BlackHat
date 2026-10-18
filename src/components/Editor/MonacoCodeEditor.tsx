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

    // Define Antigravity Dark Theme for Monaco
    monaco.editor.defineTheme('antigravityDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5c6b82', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'type', foreground: '38bdf8' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'delimiter', foreground: '94a3b8' },
        { token: 'function', foreground: '60a5fa' }
      ],
      colors: {
        'editor.background': '#0e1117',
        'editor.foreground': '#e2e8f0',
        'editorCursor.foreground': '#818cf8',
        'editor.lineHighlightBackground': '#181e2b66',
        'editorLineNumber.foreground': '#3f4b61',
        'editorLineNumber.activeForeground': '#818cf8',
        'editor.selectionBackground': '#313f5c',
        'editor.inactiveSelectionBackground': '#232b3d'
      }
    });

    monaco.editor.setTheme('antigravityDark');

    // Add save command shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  };

  if (!activeTab) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-ide-bg text-ide-muted select-none">
        <div className="flex flex-col items-center gap-2 max-w-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-ide-card border border-ide-border flex items-center justify-center text-ide-accent mb-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white tracking-wide">BlackHat IDE</h3>
          <p className="text-xs text-ide-muted leading-relaxed">
            Select a file from the explorer or let either of the simultaneous agents generate code directly into your workspace.
          </p>
          <div className="mt-4 flex flex-col gap-1.5 text-xs text-ide-muted/80">
            <div><kbd className="px-1.5 py-0.5 bg-ide-card border border-ide-border rounded text-[10px]">Cmd + K</kbd> Command Palette</div>
            <div><kbd className="px-1.5 py-0.5 bg-ide-card border border-ide-border rounded text-[10px]">Cmd + S</kbd> Save File</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Editor
        path={activeTab.path}
        language={activeTab.language}
        value={activeTab.content}
        theme="antigravityDark"
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
          padding: { top: 12, bottom: 12 }
        }}
      />
    </div>
  );
};
