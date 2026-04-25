const vscode = require("vscode");

let decorationType = null;
let currentCursorLine = 0;

/**
 * 检测当前是否为深色主题
 * @returns {boolean}
 */
function isDarkTheme() {
  const colorTheme = vscode.workspace
    .getConfiguration("workbench")
    .get("colorTheme");
  // 常见的深色主题名称关键词
  const darkThemeKeywords = [
    "dark",
    "dim",
    "night",
    "black",
    "monokai",
    "one dark",
    "dracula",
    "synthwave",
    "arc dark",
    "deep",
  ];
  const themeLower = (colorTheme || "").toLowerCase();
  return darkThemeKeywords.some(keyword => themeLower.includes(keyword));
}

/**
 * 获取当前行的背景颜色（根据主题）
 * @returns {string|undefined}
 */
function getCurrentLineBackgroundColor() {
  if (isDarkTheme()) {
    // 深色主题：使用较暗的颜色
    return "#3d3d3d";
  } else {
    // 浅色主题：使用浅绿色
    return "#e0ffe0";
  }
}

/**
 * 获取当前行的文字颜色（根据主题）
 * @returns {string}
 */
function getCurrentLineTextColor() {
  if (isDarkTheme()) {
    // 深色主题：使用亮色文字
    return "#4fc3f7";
  } else {
    // 浅色主题：使用深色文字
    return "#333333";
  }
}
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
      color: i === currentCursorLine ? getCurrentLineTextColor() : "#888888",
      fontWeight: i === currentCursorLine ? "bold" : "normal",
      backgroundColor:
        i === currentCursorLine ? getCurrentLineBackgroundColor() : undefined,
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
