export type EditorLanguage = "en" | "zh";
export type EditorTextAlign = "left" | "center" | "right";

export interface EditorTextStyle {
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  color?: string;
  textAlign?: EditorTextAlign;
}

export interface EditorTextField {
  key: string;
  label: string;
  value: Record<EditorLanguage, string>;
  style?: EditorTextStyle;
  multiline?: boolean;
}

export interface EditorModuleLayout {
  sectionId: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  minHeight: number;
  minColSpan?: number;
  maxColSpan?: number;
  minRowSpan?: number;
  maxRowSpan?: number;
}

export interface EditorModuleStyle {
  background?: string;
  borderRadius?: number;
  padding?: number;
  textColor?: string;
}

export interface EditorPageModule {
  pageId: string;
  moduleId: string;
  moduleType: string;
  content: Record<string, EditorTextField>;
  layout: EditorModuleLayout;
  style: EditorModuleStyle;
  updatedAt: string;
}

export interface EditorPageConfig {
  schemaVersion: 1;
  pageId: string;
  updatedAt: string;
  modules: EditorPageModule[];
}

export interface EditorModuleMetrics {
  width: number;
  height: number;
}

export interface EditorGuideLine {
  orientation: "vertical" | "horizontal";
  start: number;
  end: number;
}
