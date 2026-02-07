import { get, set, del, keys, createStore } from 'idb-keyval';

const customStore = createStore('effect-learning-db', 'files');

const FILE_TREE_KEY = 'file-tree';
const FILE_CONTENT_PREFIX = 'file-content:';

export async function saveFileContent(path: string, content: string): Promise<void> {
  await set(`${FILE_CONTENT_PREFIX}${path}`, content, customStore);
}

export async function getFileContent(path: string): Promise<string | undefined> {
  return await get(`${FILE_CONTENT_PREFIX}${path}`, customStore);
}

export async function deleteFileContent(path: string): Promise<void> {
  await del(`${FILE_CONTENT_PREFIX}${path}`, customStore);
}

export async function getAllModifiedFiles(): Promise<Map<string, string>> {
  const allKeys = await keys(customStore);
  const modifiedFiles = new Map<string, string>();
  
  for (const key of allKeys) {
    const keyStr = String(key);
    if (keyStr.startsWith(FILE_CONTENT_PREFIX)) {
      const path = keyStr.replace(FILE_CONTENT_PREFIX, '');
      const content = await get(key, customStore);
      if (content) {
        modifiedFiles.set(path, content);
      }
    }
  }
  
  return modifiedFiles;
}

export async function clearAllFiles(): Promise<void> {
  const allKeys = await keys(customStore);
  for (const key of allKeys) {
    await del(key, customStore);
  }
}
