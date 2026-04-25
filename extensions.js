const vscode = require("vscode");

let decorationType = null;
let currentCursorLine = 0;

// 只保留end模式，无需配置

/**
 * 创建装饰器类型
 */
function createDecorationType() {
  if (decorationType) {
    decorationType.dispose();
  }
  decorationType = vscode.window.createTextEditorDecorationType({
    isWholeLine: false,
    after: {
      margin: "0 0 0 10px",
      color: "#888888",
    },
  });
  return decorationType;
}

/**
 * 渲染相对行号（仅end模式）
 * @param {vscode.TextEditor} editor
 */
function renderLineNumbers(editor) {
  if (!editor) return;
  const doc = editor.document;
  const decorations = [];
  const cursorPos = editor.selection.active;
  currentCursorLine = cursorPos.line;
  for (let i = 0; i < doc.lineCount; i++) {
    const line = doc.lineAt(i);
    let displayText;
    if (i === currentCursorLine) {
      displayText = String(i + 1);
    } else {
      displayText = String(Math.abs(i - currentCursorLine));
    }
    let pos = line.range.end;
    let afterOptions = {
      contentText: displayText,
      color: "#888888",
      fontWeight: i === currentCursorLine ? "bold" : "normal",
      backgroundColor: i === currentCursorLine ? "#e0ffe0" : undefined,
      margin: "0 0 0 10px",
    };
    decorations.push({
      range: new vscode.Range(pos, pos),
      renderOptions: { after: afterOptions },
    });
  }
  const type = createDecorationType();
  editor.setDecorations(type, decorations);
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
