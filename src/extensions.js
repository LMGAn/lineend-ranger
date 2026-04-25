const vscode = require("vscode");

let decorationType = vscode.window.createTextEditorDecorationType({
  isWholeLine: false,
});

/**
 * 检测当前是否为深色主题
 */
function isDarkTheme() {
  const colorTheme = vscode.workspace.getConfiguration("workbench").get("colorTheme");
  const darkThemeKeywords = ["dark", "dim", "night", "black", "monokai", "one dark", "dracula", "synthwave", "arc dark", "deep"];
  const themeLower = (colorTheme || "").toLowerCase();
  return darkThemeKeywords.some(keyword => themeLower.includes(keyword));
}

/**
 * 获取渲染选项
 */
function getLineOptions(lineIndex, currentCursorLine) {
  const isCurrentLine = lineIndex === currentCursorLine;
  const displayText = isCurrentLine ? String(lineIndex + 1) : String(Math.abs(lineIndex - currentCursorLine));
  
  const isDark = isDarkTheme();
  const textColor = isCurrentLine ? (isDark ? "#4fc3f7" : "#333333") : "#888888";
  const bgColor = isCurrentLine ? (isDark ? "#3d3d3d" : "#e0ffe0") : undefined;

  return {
    contentText: displayText,
    color: textColor,
    fontWeight: isCurrentLine ? "bold" : "normal",
    backgroundColor: bgColor,
    margin: "0 0 0 10px",
  };
}

/**
 * 渲染相对行号
 */
function renderLineNumbers(editor) {
  if (!editor) return;

  const doc = editor.document;
  const decorations = [];
  const cursorPos = editor.selection.active;
  const currentCursorLine = cursorPos.line;

  // 仅针对可见区域进行渲染，提高性能
  // 注意：为了平滑滚动，我们可以稍微扩大一点渲染范围
  editor.visibleRanges.forEach(range => {
    const startLine = Math.max(0, range.start.line - 10);
    const endLine = Math.min(doc.lineCount - 1, range.end.line + 10);

    for (let i = startLine; i <= endLine; i++) {
      const line = doc.lineAt(i);
      const pos = line.range.end;
      
      decorations.push({
        range: new vscode.Range(pos, pos),
        renderOptions: {
          after: getLineOptions(i, currentCursorLine)
        },
      });
    }
  });

  editor.setDecorations(decorationType, decorations);
}

/**
 * 激活扩展
 */

function activate(context) {
  let activeEditor = vscode.window.activeTextEditor;
  console.log("[LineEndRanger] 插件已激活，仅end模式");
  function triggerUpdateDecorations() {
    if (activeEditor) {
      renderLineNumbers(activeEditor);
    }
  }

  // 监听配置变化
  // 移除配置监听

  // 监听编辑器切换
  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      activeEditor = editor;
      triggerUpdateDecorations();
    },
    null,
    context.subscriptions,
  );

  // 监听文档变化
  vscode.workspace.onDidChangeTextDocument(
    event => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions,
  );

  // 监听可见区域变化（滚动）
  vscode.window.onDidChangeTextEditorVisibleRanges(
    event => {
      if (activeEditor && event.textEditor === activeEditor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions,
  );

  // 监听光标位置变化
  vscode.window.onDidChangeTextEditorSelection(
    event => {
      if (activeEditor && event.textEditor === activeEditor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions,
  );

  // 初始渲染
  if (activeEditor) {
    triggerUpdateDecorations();
  }
}

exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
