'use client';

import { useState } from 'react';
import { FileNode } from '@/types';
import { useStore } from '@/lib/store';
import { getFileExtension } from '@/lib/fileTree';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
}

function FileIcon({ name, type }: { name: string; type: 'file' | 'directory' }) {
  if (type === 'directory') {
    return (
      <svg className="w-4 h-4 mr-1 text-tokyo-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }

  const ext = getFileExtension(name);
  
  // TypeScript files
  if (ext === 'ts') {
    return (
      <svg className="w-4 h-4 mr-1 text-tokyo-blue" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" fill="currentColor" opacity="0.2"/>
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M8 12h3M8 15h5M8 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="17" cy="17" r="2" fill="currentColor"/>
      </svg>
    );
  }
  
  // JavaScript files
  if (ext === 'js') {
    return (
      <svg className="w-4 h-4 mr-1 text-tokyo-yellow" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" fill="currentColor" opacity="0.2"/>
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M8 12h3M8 15h5M8 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="17" cy="17" r="2" fill="currentColor"/>
      </svg>
    );
  }
  
  // JSON files
  if (ext === 'json') {
    return (
      <svg className="w-4 h-4 mr-1 text-tokyo-green" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" fill="currentColor" opacity="0.2"/>
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M7 8v8M10 8v8M14 8v8M17 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  
  // Markdown files
  if (ext === 'md') {
    return (
      <svg className="w-4 h-4 mr-1 text-tokyo-purple" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" fill="currentColor" opacity="0.2"/>
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M8 9l3 6 3-6M7 15h4M14 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className="w-4 h-4 mr-1 text-tokyo-gray" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" fill="currentColor" opacity="0.2"/>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FileTreeItem({ node, level }: FileTreeItemProps) {
  const { activeFile, openFile, toggleDirectory } = useStore();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (node.type === 'directory') {
      toggleDirectory(node.path);
    } else {
      openFile(node.path, node.content || '');
    }
  };

  const isActive = node.type === 'file' && activeFile === node.path;

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer select-none transition-colors ${
          isActive ? 'bg-tokyo-blue/20 text-tokyo-blue' : 'hover:bg-tokyo-dark text-tokyo-fg'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {node.type === 'directory' && (
          <svg 
            className={`w-3 h-3 mr-1 text-tokyo-gray transition-transform ${node.isExpanded ? 'rotate-90' : ''}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
        <FileIcon name={node.name} type={node.type} />
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {node.type === 'directory' && node.isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  const { fileTree } = useStore();

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold text-tokyo-gray uppercase tracking-wider">
        Explorer
      </div>
      <div className="pb-4">
        {fileTree.map(node => (
          <FileTreeItem key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
}
