export type ContentBlockType = 'text' | 'richtext' | 'image' | 'number';

export interface ContentBlock {
  page: string;
  sectionKey: string;
  type: ContentBlockType;
  valueText: string | null;
  valueNumber: number | null;
  valueImagePath: string | null;
}