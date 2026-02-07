import { FileNode } from '@/types';

// Build file tree from flat list of paths
export function buildFileTree(files: { path: string; content: string }[]): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // Sort paths to ensure directories are created before files
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentPath = '';
    let parent: FileNode[] = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (!map.has(currentPath)) {
        const node: FileNode = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isLast ? 'file' : 'directory',
          content: isLast ? file.content : undefined,
          children: isLast ? undefined : [],
        };

        map.set(currentPath, node);
        parent.push(node);
      }

      if (!isLast) {
        const node = map.get(currentPath)!;
        if (!node.children) node.children = [];
        parent = node.children;
      }
    }
  }

  return root;
}

// Sort tree: directories first, then files alphabetically
export function sortFileTree(nodes: FileNode[]): FileNode[] {
  return nodes.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  }).map(node => ({
    ...node,
    children: node.children ? sortFileTree(node.children) : undefined
  }));
}

// Get file extension for icon
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}
