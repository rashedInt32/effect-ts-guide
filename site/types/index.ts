export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
  isExpanded?: boolean;
}

export interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  isModified: boolean;
}

export interface EditorState {
  openFiles: OpenFile[];
  activeFile: string | null;
  fileTree: FileNode[];
}
