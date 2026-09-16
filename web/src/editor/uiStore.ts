import { create } from 'zustand';

export type EditorTab = 'photos' | 'layouts' | 'frames' | 'text' | 'elements' | 'background';

interface EditorUi {
  tab: EditorTab;
  panelOpen: boolean;
  zoom: number;
  editingTextId: string | null;
  setTab: (tab: EditorTab) => void;
  togglePanel: (open?: boolean) => void;
  setZoom: (zoom: number) => void;
  setEditingText: (id: string | null) => void;
}

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2.5;

export const useEditorUi = create<EditorUi>(set => ({
  tab: 'photos',
  panelOpen: true,
  zoom: 1,
  editingTextId: null,
  setTab: tab => set(s => ({ tab, panelOpen: s.tab === tab ? !s.panelOpen : true })),
  togglePanel: open => set(s => ({ panelOpen: open ?? !s.panelOpen })),
  setZoom: zoom => set({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(zoom * 100) / 100)) }),
  setEditingText: editingTextId => set({ editingTextId }),
}));
