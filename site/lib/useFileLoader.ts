'use client';

import { useEffect, useState } from 'react';
import { buildFileTree, sortFileTree } from '@/lib/fileTree';
import { getAllModifiedFiles, clearAllFiles as clearIndexedDB } from '@/lib/storage';
import { useStore } from '@/lib/store';
import { FileNode } from '@/types';

// Import all learning files
const learningFiles = [
  '00-mental-models/mental-models.reference.ts',
  '00-mental-models/mental-models.practice.ts',
  '01-effect-basics/effect-basics.reference.ts',
  '01-effect-basics/effect-basics.practice.ts',
  '02-schema/schema.reference.ts',
  '02-schema/schema.practice.ts',
  '03-config/config.reference.ts',
  '03-config/config.practice.ts',
  '04-services-and-layers/services-and-layers.reference.ts',
  '04-services-and-layers/services-and-layers.practice.ts',
  '05-error-handling/error-handling.reference.ts',
  '05-error-handling/error-handling.practice.ts',
  '06-sql-pg/sql-pg.reference.ts',
  '06-sql-pg/sql-pg.practice.ts',
  '07-platform-filesystem/platform-filesystem.reference.ts',
  '07-platform-filesystem/platform-filesystem.practice.ts',
  '08-testing/testing.reference.ts',
  '08-testing/testing.practice.ts',
  '09-advanced-patterns/advanced-patterns.reference.ts',
  '09-advanced-patterns/advanced-patterns.practice.ts',
  'projects/expense-crud/main.ts',
  'projects/expense-crud/domain/Category.ts',
  'projects/expense-crud/domain/Expense.ts',
  'projects/expense-crud/domain/Ids.ts',
  'projects/expense-crud/errors/index.ts',
  'projects/expense-crud/layers/index.ts',
  'projects/expense-crud/repositories/ExpenseRepository.ts',
  'projects/expense-crud/services/ExpenseService.ts',
];

// Force fresh load by adding cache-busting query param in dev
const isDev = process.env.NODE_ENV === 'development';

export function useFileLoader() {
  const { setFileTree, clearAllFiles } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFiles() {
      try {
        // In dev mode, clear everything to always get fresh files
        if (isDev) {
          console.log('🔄 Development mode: Loading fresh files...');
          await clearIndexedDB();
          clearAllFiles(); // Clear open files in store
        }

        // Load files via API route (reads directly from source)
        const files = await Promise.all(
          learningFiles.map(async (path) => {
            try {
              // Use API route to fetch directly from source files
              const cacheBuster = isDev ? `&t=${Date.now()}` : '';
              const response = await fetch(`/api/file?path=${encodeURIComponent(path)}${cacheBuster}`);
              
              if (response.ok) {
                const content = await response.text();
                return { path, content };
              } else {
                console.error(`Failed to load ${path}:`, response.status);
                return { path, content: `// File not found: ${path}` };
              }
            } catch (error) {
              console.error(`Error loading ${path}:`, error);
              return { path, content: `// Error loading file: ${path}` };
            }
          })
        );

        const tree = buildFileTree(files);
        const sortedTree = sortFileTree(tree);
        setFileTree(sortedTree);
        
        if (isDev) {
          console.log('✅ Files loaded successfully from source!');
        }
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFiles();
  }, [setFileTree, clearAllFiles]);

  return { isLoading };
}
