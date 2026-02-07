'use client';

import { useStore } from '@/lib/store';

export function TabBar() {
  const { openFiles, activeFile, setActiveFile, closeFile } = useStore();

  if (openFiles.length === 0) {
    return (
      <div className="h-9 bg-tokyo-darker border-b border-tokyo-dark flex items-center px-4">
        <span className="text-sm text-tokyo-gray">No file open</span>
      </div>
    );
  }

  return (
    <div className="h-9 bg-tokyo-darker border-b border-tokyo-dark flex overflow-x-auto">
      {openFiles.map(file => (
        <div
          key={file.path}
          className={`flex items-center px-3 min-w-fit cursor-pointer select-none group transition-colors ${
            activeFile === file.path 
              ? 'bg-tokyo-bg text-tokyo-fg border-t-2 border-tokyo-blue' 
              : 'bg-tokyo-darker text-tokyo-gray hover:bg-tokyo-dark'
          }`}
          onClick={() => setActiveFile(file.path)}
        >
          <span className="text-sm truncate max-w-[200px]">
            {file.path.split('/').pop()}
          </span>
          {file.isModified && (
            <span className="ml-1 text-tokyo-blue">•</span>
          )}
          <button
            className="ml-2 p-0.5 rounded hover:bg-tokyo-gray/20 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              closeFile(file.path);
            }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
