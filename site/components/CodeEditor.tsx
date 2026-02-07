"use client";

import Editor from "@monaco-editor/react";
import { useStore } from "@/lib/store";
import { saveFileContent } from "@/lib/storage";
import { useCallback } from "react";

export function CodeEditor() {
  const { openFiles, activeFile, updateFileContent } = useStore();

  const activeFileData = openFiles.find((f) => f.path === activeFile);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFile && value !== undefined) {
        updateFileContent(activeFile, value);
        // Debounced save to IndexedDB
        setTimeout(() => {
          saveFileContent(activeFile, value);
        }, 500);
      }
    },
    [activeFile, updateFileContent],
  );

  const handleEditorMount = (monaco: any) => {
    // Configure TypeScript compiler options to suppress module resolution errors
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // Also configure JavaScript defaults (Monaco sometimes falls back to JS mode)
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      allowJs: true,
    });

    // Configure JavaScript diagnostics as well
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [2792, 2307, 2304, 8006, 8010],
    });

    // Suppress diagnostic errors for 'effect' module
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [
        2792, // Cannot find module
        2307, // Cannot find module or its corresponding type declarations
        2304, // Cannot find name
        8006, // 'Type annotations can only be used in TypeScript files'
        8010, // 'Type annotations can only be used in TypeScript files'
      ],
    });

    // Add extra libraries if needed
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare module 'effect' {
        export * from 'effect';
      }
      declare module 'effect/*' {
        export * from 'effect/*';
      }
      `,
      "ts:effect.d.ts",
    );

    // Define Tokyo Night + Night Owl hybrid theme
    monaco.editor.defineTheme("tokyo-night-owl", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "637777", fontStyle: "italic" },
        { token: "keyword", foreground: "bb9af7" },
        { token: "keyword.control", foreground: "bb9af7" },
        { token: "keyword.operator", foreground: "89ddff" },
        { token: "string", foreground: "9ece6a" },
        { token: "string.escape", foreground: "73daca" },
        { token: "number", foreground: "ff9e64" },
        { token: "regexp", foreground: "b4f9f8" },
        { token: "type", foreground: "7aa2f7" },
        { token: "interface", foreground: "7aa2f7" },
        { token: "class", foreground: "7dcfff" },
        { token: "function", foreground: "7aa2f7" },
        { token: "variable", foreground: "d6deeb" },
        { token: "variable.predefined", foreground: "ff9e64" },
        { token: "operator", foreground: "89ddff" },
        { token: "operator.arrow", foreground: "bb9af7" },
        { token: "tag", foreground: "f7768e" },
        { token: "attribute.name", foreground: "ff9e64" },
        { token: "attribute.value", foreground: "9ece6a" },
        { token: "meta.embedded", foreground: "d6deeb" },
        { token: "source", foreground: "d6deeb" },
        { token: "delimiter", foreground: "89ddff" },
        { token: "delimiter.bracket", foreground: "89ddff" },
        { token: "delimiter.parenthesis", foreground: "89ddff" },
        { token: "storage.type", foreground: "bb9af7" },
        { token: "storage.modifier", foreground: "bb9af7" },
        { token: "constant", foreground: "ff9e64" },
        { token: "constant.language", foreground: "ff9e64" },
        { token: "constant.numeric", foreground: "ff9e64" },
        { token: "support.function", foreground: "7aa2f7" },
        { token: "support.class", foreground: "7dcfff" },
        { token: "support.type", foreground: "7aa2f7" },
        { token: "support.variable", foreground: "d6deeb" },
        { token: "property", foreground: "73daca" },
        { token: "punctuation", foreground: "89ddff" },
        { token: "punctuation.definition.tag", foreground: "f7768e" },
        { token: "punctuation.definition.string", foreground: "9ece6a" },
        { token: "invalid", foreground: "f7768e" },
        {
          token: "invalid.deprecated",
          foreground: "f7768e",
          fontStyle: "underline",
        },
      ],
      colors: {
        "editor.background": "#011627",
        "editor.foreground": "#d6deeb",
        "editor.lineHighlightBackground": "#01111d",
        "editor.lineHighlightBorder": "#01111d",
        "editor.selectionBackground": "#1d3b53",
        "editor.selectionHighlightBackground": "#1d3b53",
        "editor.inactiveSelectionBackground": "#234d70",
        "editor.wordHighlightBackground": "#234d70",
        "editor.wordHighlightStrongBackground": "#234d70",
        "editor.findMatchBackground": "#1d3b53",
        "editor.findMatchHighlightBackground": "#234d70",
        "editor.findRangeHighlightBackground": "#234d70",
        "editor.hoverHighlightBackground": "#234d70",
        "editorLineNumber.foreground": "#4b6479",
        "editorLineNumber.activeForeground": "#d6deeb",
        "editorCursor.foreground": "#80a4c2",
        "editorWhitespace.foreground": "#4b6479",
        "editorIndentGuide.background": "#1d3b53",
        "editorIndentGuide.activeBackground": "#234d70",
        "editorRuler.foreground": "#1d3b53",
        "editorBracketMatch.background": "#1d3b53",
        "editorBracketMatch.border": "#7aa2f7",
        "editorError.foreground": "#f7768e",
        "editorWarning.foreground": "#e0af68",
        "editorInfo.foreground": "#7dcfff",
        "editorHint.foreground": "#9ece6a",
        "editorGutter.background": "#011627",
        "editorGutter.modifiedBackground": "#e0af68",
        "editorGutter.addedBackground": "#9ece6a",
        "editorGutter.deletedBackground": "#f7768e",
        "editorOverviewRuler.border": "#1d3b53",
        "editorOverviewRuler.modifiedForeground": "#e0af68",
        "editorOverviewRuler.addedForeground": "#9ece6a",
        "editorOverviewRuler.deletedForeground": "#f7768e",
        "editorOverviewRuler.errorForeground": "#f7768e",
        "editorOverviewRuler.warningForeground": "#e0af68",
        "editorOverviewRuler.infoForeground": "#7dcfff",
        "editorSuggestWidget.background": "#01111d",
        "editorSuggestWidget.border": "#1d3b53",
        "editorSuggestWidget.foreground": "#d6deeb",
        "editorSuggestWidget.highlightForeground": "#7aa2f7",
        "editorSuggestWidget.selectedBackground": "#1d3b53",
        "editorHoverWidget.background": "#01111d",
        "editorHoverWidget.border": "#1d3b53",
        "editorWidget.background": "#01111d",
        "editorWidget.border": "#1d3b53",
        "editorWidget.resizeBorder": "#7aa2f7",
        "diffEditor.insertedTextBackground": "#9ece6a20",
        "diffEditor.removedTextBackground": "#f7768e20",
      },
    });
  };

  if (!activeFileData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-tokyo-bg">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-tokyo-fg mb-2">
            Welcome to Effect Learning
          </h2>
          <p className="text-tokyo-gray">
            Click on a file from the sidebar to start learning
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-tokyo-bg">
      <Editor
        height="100%"
        path={activeFileData.path}
        defaultLanguage="typescript"
        language="typescript"
        value={activeFileData.content}
        onChange={handleEditorChange}
        theme="tokyo-night-owl"
        beforeMount={handleEditorMount}
        options={{
          fontSize: 20,
          fontFamily: "JetBrains Mono, Fira Code, monospace",
          fontLigatures: true,
          lineNumbers: "off",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          minimap: { enabled: true, scale: 1 },
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "on",
          wrappingIndent: "same",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderLineHighlight: "line",
          renderWhitespace: "selection",
          folding: true,
          foldingStrategy: "indentation",
          matchBrackets: "always",
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: "on",
          snippetSuggestions: "top",
          wordBasedSuggestions: "currentDocument",
          parameterHints: { enabled: true, cycle: true },
          hover: { enabled: true, delay: 300 },
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: "full",
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full text-tokyo-gray">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
