'use client';

import { useState, useEffect } from 'react';
import { FileTree } from '@/components/FileTree';
import { TabBar } from '@/components/TabBar';
import { CodeEditor } from '@/components/CodeEditor';
import { useFileLoader } from '@/lib/useFileLoader';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function Home() {
  const { isLoading } = useFileLoader();
  const [zenMode, setZenMode] = useState(false);

  // Escape key to exit Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zenMode) {
        setZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-tokyo-bg">
        <div className="text-tokyo-fg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tokyo-blue mx-auto mb-4"></div>
          <p>Loading learning files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-tokyo-bg">
      {/* Header - Hidden in Zen Mode */}
      {!zenMode && (
        <header className="h-12 bg-tokyo-darker border-b border-tokyo-dark flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-tokyo-blue">Effect Learning</h1>
            <span className="text-xs text-tokyo-gray">Interactive TypeScript Environment</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://effect.website/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-tokyo-cyan hover:underline"
            >
              Effect Docs
            </a>
            <a 
              href="https://github.com/Effect-TS/effect" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-tokyo-cyan hover:underline"
            >
              GitHub
            </a>
            <button
              onClick={() => setZenMode(true)}
              className="text-xs px-3 py-1.5 bg-tokyo-dark hover:bg-tokyo-gray/20 text-tokyo-fg rounded transition-colors flex items-center gap-1"
              title="Enter Zen Mode"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Zen
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Sidebar - Hidden in Zen Mode */}
          {!zenMode && (
            <>
              <Panel defaultSize={15} minSize={12} maxSize={35} className="bg-tokyo-bg">
                <div className="h-full border-r border-tokyo-dark">
                  <FileTree />
                </div>
              </Panel>
              <PanelResizeHandle className="w-1 bg-tokyo-dark hover:bg-tokyo-blue transition-colors" />
            </>
          )}
          
          {/* Editor Area */}
          <Panel defaultSize={zenMode ? 100 : 80}>
            <div className="h-full flex flex-col">
              {!zenMode && <TabBar />}
              <CodeEditor />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Status Bar - Hidden in Zen Mode */}
      {!zenMode && (
        <footer className="h-6 bg-tokyo-blue text-tokyo-bg text-xs flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <span>TypeScript</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Changes saved locally</span>
            <span>Effect v3.19.x</span>
          </div>
        </footer>
      )}

      {/* Zen Mode Exit Button - Floating */}
      {zenMode && (
        <button
          onClick={() => setZenMode(false)}
          className="fixed bottom-6 right-6 px-4 py-2 bg-tokyo-darker hover:bg-tokyo-dark text-tokyo-fg text-sm rounded-lg shadow-lg border border-tokyo-dark transition-all z-50 flex items-center gap-2 opacity-50 hover:opacity-100"
          title="Exit Zen Mode (Esc)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit Zen
        </button>
      )}
    </div>
  );
}
