# Effect TypeScript Learning Site

An interactive browser-based editor for exploring Effect TypeScript learning materials.

## Features

- **Monaco Editor** - Full-featured code editor with TypeScript support
- **Tokyo Night + Night Owl Theme** - Custom hybrid theme for comfortable coding
- **File Tree** - Browse all learning materials in organized folders
- **Multi-Tab Editing** - Open multiple files with tab switching
- **Persistent Changes** - All edits saved to IndexedDB (browser storage)
- **No Backend Required** - Runs entirely in the browser

## Tech Stack

- **Next.js 14** - React framework
- **Monaco Editor** - VS Code's editor component
- **Zustand** - State management
- **IndexedDB** - Client-side storage via `idb-keyval`
- **Tailwind CSS** - Styling
- **react-resizable-panels** - Resizable sidebar

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## How It Works

1. **File Loading**: All learning files are bundled in `/public/learning-files/`
2. **User Modifications**: When you edit a file, changes are stored in IndexedDB
3. **Persistence**: Your changes persist across browser sessions
4. **Reset**: Clear browser data for this site to reset to original files

## File Structure

```
site/
├── app/                  # Next.js app
├── components/           # React components
│   ├── FileTree.tsx     # Sidebar file browser
│   ├── TabBar.tsx       # Open file tabs
│   └── CodeEditor.tsx   # Monaco editor wrapper
├── lib/                 # Utilities
│   ├── storage.ts       # IndexedDB operations
│   ├── store.ts         # Zustand store
│   ├── fileTree.ts      # File tree utilities
│   └── useFileLoader.ts # File loading hook
├── public/              # Static assets
│   └── learning-files/  # All Effect TS learning files
└── types/               # TypeScript types
```

## Theme Colors

The custom theme combines Tokyo Night syntax highlighting with Night Owl's background:

- Background: `#011627` (Night Owl)
- Foreground: `#d6deeb`
- Keywords: `#bb9af7` (purple)
- Strings: `#9ece6a` (green)
- Functions: `#7aa2f7` (blue)
- Comments: `#565f89` (gray)

## Deployment

Deploy to Vercel, Netlify, or any static hosting:

```bash
# Build for production
npm run build

# Or deploy to Vercel
vercel --prod
```

## Learning Files

The site includes all Effect TypeScript learning materials:

- `00-mental-models/` - Core concepts
- `01-effect-basics/` - Fundamentals
- `02-schema/` through `08-testing/` - Topic guides
- `09-advanced-patterns/` - Advanced techniques
- `projects/expense-crud/` - Real-world project

---

Built for learning Effect TypeScript interactively.
