import { create } from 'zustand';
import { FileNode, OpenFile } from '@/types';

interface StoreState {
  fileTree: FileNode[];
  openFiles: OpenFile[];
  activeFile: string | null;
  setFileTree: (tree: FileNode[]) => void;
  openFile: (path: string, content: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  toggleDirectory: (path: string) => void;
  clearAllFiles: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  fileTree: [],
  openFiles: [],
  activeFile: null,
  
  clearAllFiles: () => set({ openFiles: [], activeFile: null }),

  setFileTree: (tree) => set({ fileTree: tree }),

  openFile: (path, content) => {
    const { openFiles } = get();
    const existingFile = openFiles.find(f => f.path === path);
    
    if (!existingFile) {
      // File not open yet - add it
      set({
        openFiles: [...openFiles, { path, content, originalContent: content, isModified: false }],
        activeFile: path
      });
    } else {
      // File already open - ALWAYS update content to latest from filesystem
      // This ensures edits to source files are reflected
      const newOpenFiles = openFiles.map(f => 
        f.path === path 
          ? { ...f, content, originalContent: content, isModified: false }
          : f
      );
      set({ openFiles: newOpenFiles, activeFile: path });
    }
  },

  closeFile: (path) => {
    const { openFiles, activeFile } = get();
    const newOpenFiles = openFiles.filter(f => f.path !== path);
    const newActiveFile = activeFile === path 
      ? (newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].path : null)
      : activeFile;
    set({ openFiles: newOpenFiles, activeFile: newActiveFile });
  },

  setActiveFile: (path) => set({ activeFile: path }),

  updateFileContent: (path, content) => {
    const { openFiles } = get();
    const newOpenFiles = openFiles.map(f => 
      f.path === path 
        ? { ...f, content, isModified: content !== f.originalContent }
        : f
    );
    set({ openFiles: newOpenFiles });
  },

  toggleDirectory: (path) => {
    const { fileTree } = get();
    const toggleNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    set({ fileTree: toggleNode(fileTree) });
  },
}));
