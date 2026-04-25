import { createElement, useEffect, useState, type CSSProperties, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import type { PageEditorApi } from "../usePageEditor";

interface EditableTextProps {
  editor: PageEditorApi;
  moduleId: string;
  fieldName: string;
  language: "en" | "zh";
  as?: keyof HTMLElementTagNameMap;
  className?: string;
  fallback: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function EditableText({
  editor,
  moduleId,
  fieldName,
  language,
  as = "p",
  className,
  fallback,
  style,
  children
}: EditableTextProps) {
  const field = editor.getTextField(moduleId, fieldName);
  const value = editor.getTextValue(moduleId, fieldName, language, fallback);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  const commit = () => {
    editor.updateTextValue(moduleId, fieldName, language, draft);
    setEditing(false);
  };

  if (editing && editor.isEditMode) {
    if (field?.multiline) {
      return (
        <textarea
          autoFocus
          className={`airs-editable-inline-input ${className || ""}`.trim()}
          value={draft}
          rows={Math.max(3, draft.split("\n").length)}
          style={{ ...editor.getTextStyle(moduleId, fieldName), ...style }}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
        />
      );
    }

    return (
      <input
        autoFocus
        type="text"
        className={`airs-editable-inline-input ${className || ""}`.trim()}
        value={draft}
        style={{ ...editor.getTextStyle(moduleId, fieldName), ...style }}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return createElement(
    as,
    {
      className: `${className || ""} ${editor.isEditMode ? "airs-editable-text" : ""}`.trim(),
      style: { ...editor.getTextStyle(moduleId, fieldName), ...style },
      onDoubleClick: (event: ReactMouseEvent<HTMLElement>) => {
        if (!editor.isEditMode) return;
        event.stopPropagation();
        editor.setSelectedModuleId(moduleId);
        setEditing(true);
      },
      title: editor.isEditMode ? `${field?.label || fieldName}（双击编辑）` : undefined
    },
    children || value
  );
}
