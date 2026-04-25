import type { ChangeEvent } from "react";
import type { PageEditorApi } from "../usePageEditor";
import type { EditorTextAlign, EditorTextField } from "../schema";

interface EditorChromeProps {
  editor: PageEditorApi;
  language: "en" | "zh";
}

function NumberInput({
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  return (
    <input
      type="number"
      className="airs-editor-input"
      value={typeof value === "number" ? value : ""}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(Number(event.target.value || 0))}
    />
  );
}

function renderFieldInput(
  field: EditorTextField,
  value: string,
  onChange: (next: string) => void
) {
  if (field.multiline) {
    return (
      <textarea
        className="airs-editor-input airs-editor-textarea"
        value={value}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      type="text"
      className="airs-editor-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function AlignmentSelect({
  value,
  onChange
}: {
  value?: EditorTextAlign;
  onChange: (next: EditorTextAlign) => void;
}) {
  return (
    <select
      className="airs-editor-input"
      value={value || "left"}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as EditorTextAlign)}
    >
      <option value="left">left</option>
      <option value="center">center</option>
      <option value="right">right</option>
    </select>
  );
}

export function EditorChrome({ editor, language }: EditorChromeProps) {
  if (!editor.isEditMode) return null;

  const selectedModule = editor.selectedModule;
  const selectedMetrics = selectedModule ? editor.getModuleMetrics(selectedModule.moduleId) : null;

  return (
    <>
      <div className="airs-editor-toolbar">
        <div className="flex items-center gap-2">
          <button type="button" className="airs-editor-button" onClick={editor.exitEditMode}>
            退出编辑模式
          </button>
          <button type="button" className="airs-editor-button" onClick={editor.undo} disabled={!editor.canUndo}>
            撤销
          </button>
          <button type="button" className="airs-editor-button" onClick={editor.redo} disabled={!editor.canRedo}>
            重做
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`airs-editor-status ${editor.dirty ? "is-dirty" : "is-clean"}`}>
            {editor.dirty ? "未保存" : "已保存"}
          </span>
          <button type="button" className="airs-editor-button is-primary" onClick={() => void editor.save()}>
            保存
          </button>
          <button type="button" className="airs-editor-button" onClick={editor.exportCurrentConfig}>
            导出配置
          </button>
        </div>
      </div>

      <aside className="airs-editor-sidepanel">
        <div className="airs-editor-panel-block">
          <p className="airs-editor-panel-title">页面编辑</p>
          <p className="airs-editor-panel-copy">
            单击模块选中，拖拽顶部手柄移动，右下角手柄缩放，双击文字可直接编辑。
          </p>
        </div>

        {selectedModule ? (
          <>
            <div className="airs-editor-panel-block">
              <p className="airs-editor-panel-title">模块信息</p>
              <div className="airs-editor-field">
                <span>moduleId</span>
                <code>{selectedModule.moduleId}</code>
              </div>
              <div className="airs-editor-field">
                <span>moduleType</span>
                <code>{selectedModule.moduleType}</code>
              </div>
              <div className="airs-editor-field">
                <span>grid</span>
                <code>
                  c{selectedModule.layout.colStart} / r{selectedModule.layout.rowStart} / span {selectedModule.layout.colSpan} x {selectedModule.layout.rowSpan}
                </code>
              </div>
              <div className="airs-editor-field">
                <span>width / height</span>
                <code>
                  {selectedMetrics ? `${selectedMetrics.width}px / ${selectedMetrics.height}px` : "--"}
                </code>
              </div>
            </div>

            <div className="airs-editor-panel-block">
              <p className="airs-editor-panel-title">布局</p>
              <label className="airs-editor-row">
                <span>x / colStart</span>
                <NumberInput
                  value={selectedModule.layout.colStart}
                  min={1}
                  max={12}
                  onChange={(next) => editor.updateModuleLayout(selectedModule.moduleId, { colStart: next })}
                />
              </label>
              <label className="airs-editor-row">
                <span>y / rowStart</span>
                <NumberInput
                  value={selectedModule.layout.rowStart}
                  min={1}
                  max={24}
                  onChange={(next) => editor.updateModuleLayout(selectedModule.moduleId, { rowStart: next })}
                />
              </label>
              <label className="airs-editor-row">
                <span>width / colSpan</span>
                <NumberInput
                  value={selectedModule.layout.colSpan}
                  min={selectedModule.layout.minColSpan || 1}
                  max={selectedModule.layout.maxColSpan || 12}
                  onChange={(next) => editor.updateModuleLayout(selectedModule.moduleId, { colSpan: next })}
                />
              </label>
              <label className="airs-editor-row">
                <span>height / rowSpan</span>
                <NumberInput
                  value={selectedModule.layout.rowSpan}
                  min={selectedModule.layout.minRowSpan || 1}
                  max={selectedModule.layout.maxRowSpan || 8}
                  onChange={(next) => editor.updateModuleLayout(selectedModule.moduleId, { rowSpan: next })}
                />
              </label>
              <label className="airs-editor-row">
                <span>minHeight</span>
                <NumberInput
                  value={selectedModule.layout.minHeight}
                  min={120}
                  max={1200}
                  onChange={(next) => editor.updateModuleLayout(selectedModule.moduleId, { minHeight: next })}
                />
              </label>
            </div>

            <div className="airs-editor-panel-block">
              <p className="airs-editor-panel-title">模块样式</p>
              <label className="airs-editor-row">
                <span>background</span>
                <input
                  type="text"
                  className="airs-editor-input"
                  value={selectedModule.style.background || ""}
                  onChange={(event) => editor.updateModuleStyle(selectedModule.moduleId, { background: event.target.value })}
                />
              </label>
              <label className="airs-editor-row">
                <span>borderRadius</span>
                <NumberInput
                  value={selectedModule.style.borderRadius}
                  min={0}
                  max={80}
                  onChange={(next) => editor.updateModuleStyle(selectedModule.moduleId, { borderRadius: next })}
                />
              </label>
              <label className="airs-editor-row">
                <span>padding</span>
                <NumberInput
                  value={selectedModule.style.padding}
                  min={0}
                  max={120}
                  onChange={(next) => editor.updateModuleStyle(selectedModule.moduleId, { padding: next })}
                />
              </label>
              <label className="airs-editor-row">
                <span>textColor</span>
                <input
                  type="text"
                  className="airs-editor-input"
                  value={selectedModule.style.textColor || ""}
                  onChange={(event) => editor.updateModuleStyle(selectedModule.moduleId, { textColor: event.target.value })}
                />
              </label>
            </div>

            <div className="airs-editor-panel-block">
              <p className="airs-editor-panel-title">文案内容</p>
              {Object.entries(selectedModule.content).map(([fieldName, field]) => (
                <div key={field.key} className="airs-editor-content-card">
                  <p className="airs-editor-content-title">{field.label}</p>
                  {renderFieldInput(field, field.value[language] || "", (next) =>
                    editor.updateTextValue(selectedModule.moduleId, fieldName, language, next)
                  )}
                  <div className="airs-editor-grid-2">
                    <label className="airs-editor-row">
                      <span>fontSize</span>
                      <NumberInput
                        value={field.style?.fontSize}
                        min={10}
                        max={120}
                        onChange={(next) => editor.updateTextStyle(selectedModule.moduleId, fieldName, { fontSize: next })}
                      />
                    </label>
                    <label className="airs-editor-row">
                      <span>fontWeight</span>
                      <NumberInput
                        value={field.style?.fontWeight}
                        min={300}
                        max={900}
                        step={100}
                        onChange={(next) => editor.updateTextStyle(selectedModule.moduleId, fieldName, { fontWeight: next })}
                      />
                    </label>
                    <label className="airs-editor-row">
                      <span>lineHeight</span>
                      <NumberInput
                        value={field.style?.lineHeight}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(next) => editor.updateTextStyle(selectedModule.moduleId, fieldName, { lineHeight: next })}
                      />
                    </label>
                    <label className="airs-editor-row">
                      <span>color</span>
                      <input
                        type="text"
                        className="airs-editor-input"
                        value={field.style?.color || ""}
                        onChange={(event) => editor.updateTextStyle(selectedModule.moduleId, fieldName, { color: event.target.value })}
                      />
                    </label>
                    <label className="airs-editor-row airs-editor-row-span-2">
                      <span>align</span>
                      <AlignmentSelect
                        value={field.style?.textAlign}
                        onChange={(next) => editor.updateTextStyle(selectedModule.moduleId, fieldName, { textAlign: next })}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="airs-editor-panel-block">
              <p className="airs-editor-panel-title">当前模块操作</p>
              <div className="airs-editor-actions">
                <button type="button" className="airs-editor-button is-primary" onClick={() => void editor.save()}>
                  保存
                </button>
                <button type="button" className="airs-editor-button" onClick={editor.resetSelectedModule}>
                  重置当前模块
                </button>
                <button type="button" className="airs-editor-button" onClick={editor.revertSelectedModule}>
                  撤销本次改动
                </button>
                <button type="button" className="airs-editor-button" onClick={editor.exportCurrentConfig}>
                  导出 JSON
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="airs-editor-panel-block">
            <p className="airs-editor-panel-title">未选中模块</p>
            <p className="airs-editor-panel-copy">从页面中点击任意可编辑方框后，这里会显示它的属性和文案配置。</p>
          </div>
        )}
      </aside>
    </>
  );
}
