const vscode = require("vscode");

// 双缓冲区，确保渲染平滑
let decorationTypeA = createType();
let decorationTypeB = createType();
let useTypeA = true;

function createType() {
  return vscode.window.createTextEditorDecorationType({
    isWholeLine: false,
    after: { margin: "0 0 0 12px" }
  });
}

function isDarkTheme() {
  return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark || 
         vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;
}

function getLineOptions(lineIndex, currentCursorLine) {
  const isCurrentLine = lineIndex === currentCursorLine;
  const displayText = isCurrentLine ? String(lineIndex + 1) : String(Math.abs(lineIndex - currentCursorLine));
  const isDark = isDarkTheme();
  
  const textColor = isCurrentLine ? (isDark ? "#4fc3f7" : "#005cc5") : "#888888";
  const bgColor = isCurrentLine ? (isDark ? "#3d3d3d" : "#f0f0f0") : undefined;

  return {
    contentText: displayText,
    color: textColor,
    fontWeight: isCurrentLine ? "bold" : "normal",
    backgroundColor: bgColor,
  };
}

function renderLineNumbers(editor) {
  if (!editor || !editor.document) return;

  const doc = editor.document;
  const decorations = [];
  const cursorPos = editor.selection.active;
  const currentCursorLine = cursorPos.line;

  const lineIndices = new Set();

  // 1. 收集可见区域的行
  editor.visibleRanges.forEach(range => {
    for (let i = range.start.line; i <= range.end.line; i++) {
      lineIndices.add(i);
    }
  });

  // 2. 确保光标行也被包含（利用 Set 自动去重）
  if (currentCursorLine >= 0 && currentCursorLine < doc.lineCount) {
    lineIndices.add(currentCursorLine);
  }

  // 3. 统一生成装饰器
  lineIndices.forEach(i => {
    const line = doc.lineAt(i);
    decorations.push({
      range: new vscode.Range(line.range.end, line.range.end),
      renderOptions: {
        after: getLineOptions(i, currentCursorLine)
      },
    });
  });

  const currentType = useTypeA ? decorationTypeA : decorationTypeB;
  const oldType = useTypeA ? decorationTypeB : decorationTypeA;

  editor.setDecorations(currentType, decorations);
  editor.setDecorations(oldType, []);
  useTypeA = !useTypeA;
}

function activate(context) {
  let activeEditor = vscode.window.activeTextEditor;

  function triggerUpdate() {
    if (activeEditor) renderLineNumbers(activeEditor);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(e => {
      if (activeEditor && e.textEditor === activeEditor) triggerUpdate();
    }),
    vscode.window.onDidChangeActiveTextEditor(e => {
      activeEditor = e;
      if (e) triggerUpdate();
    }),
    vscode.workspace.onDidChangeTextDocument(e => {
      if (activeEditor && e.document === activeEditor.document) triggerUpdate();
    }),
    // 滚动时实时重绘，确保 Sticky Scroll 区域保持干净
    vscode.window.onDidChangeTextEditorVisibleRanges(e => {
      if (activeEditor && e.textEditor === activeEditor) triggerUpdate();
    })
  );

  if (activeEditor) triggerUpdate();
}

function deactivate() {
  decorationTypeA.dispose();
  decorationTypeB.dispose();
}

exports.activate = activate;
exports.deactivate = deactivate;
