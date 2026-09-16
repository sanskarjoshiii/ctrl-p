import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce, type Draft } from 'immer';
import { createStore, del, get, set as idbSet, values } from 'idb-keyval';
import { getTemplate } from '@shared/catalog';
import { PAGE_RULES } from '@shared/pricing';
import type { DiaryElement, DiaryPage, DiaryProject } from '@shared/types';
import { buildProject, cloneElement, innerPageCount, newInnerPage, slotStats, uid } from '../editor/factory';
import { deletePhotos, getPhotoMetas, importPhoto, PhotoImportError, type PhotoMeta } from '../lib/photos';
import { forgetPhotos } from '../lib/imageCache';

const projectStore = createStore('book-diaries-projects', 'projects');

export interface ProjectMeta {
  id: string;
  title: string;
  templateSlug: string;
  updatedAt: number;
  pages: number;
  photos: number;
  filled: number;
  slots: number;
}

type SaveState = 'saved' | 'saving' | 'error';
const HISTORY_LIMIT = 60;

interface ProjectState {
  metas: ProjectMeta[];
  project: DiaryProject | null;
  photos: Record<string, PhotoMeta>;
  status: 'idle' | 'loading' | 'ready' | 'missing';
  saveState: SaveState;
  pageId: string | null;
  selectedId: string | null;
  past: DiaryPage[][];
  future: DiaryPage[][];
  lastCoalesce: { key: string; at: number } | null;

  createProject: (templateSlug: string) => Promise<string>;
  openProject: (id: string) => Promise<DiaryProject | null>;
  loadProjectData: (id: string) => Promise<DiaryProject | undefined>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<string | null>;

  /** Mutates the open project. `coalesce` merges rapid edits (sliders, drags) into one undo step. */
  edit: (recipe: (d: Draft<DiaryProject>) => void, opts?: { history?: boolean; coalesce?: string }) => void;
  undo: () => void;
  redo: () => void;

  selectPage: (pageId: string) => void;
  select: (elementId: string | null) => void;

  addPhotos: (files: File[], onProgress?: (done: number, total: number) => void) => Promise<{ added: PhotoMeta[]; errors: string[] }>;
  removePhoto: (photoId: string) => Promise<void>;

  addElement: (el: DiaryElement, pageId?: string) => void;
  updateElement: (id: string, patch: Partial<DiaryElement>, coalesce?: string) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  arrange: (id: string, dir: 'forward' | 'backward' | 'front' | 'back') => void;

  addPages: (afterPageId: string, count?: number) => void;
  duplicatePage: (pageId: string) => void;
  removePage: (pageId: string) => void;
  movePage: (pageId: string, toIndex: number) => void;
}

const findPage = (d: Draft<DiaryProject> | DiaryProject, pageId: string | null) => d.pages.find(p => p.id === pageId);
const findElement = (d: Draft<DiaryProject>, id: string) => {
  for (const page of d.pages) {
    const index = page.elements.findIndex(e => e.id === id);
    if (index >= 0) return { page, index, el: page.elements[index] };
  }
  return null;
};

const toMeta = (p: DiaryProject): ProjectMeta => {
  const s = slotStats(p);
  return { id: p.id, title: p.title, templateSlug: p.templateSlug, updatedAt: p.updatedAt, pages: innerPageCount(p), photos: p.photoIds.length, filled: s.filled, slots: s.slots };
};

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const useProjects = create<ProjectState>()(
  persist(
    (set, getState) => {
      const scheduleSave = () => {
        clearTimeout(saveTimer);
        set({ saveState: 'saving' });
        saveTimer = setTimeout(async () => {
          const { project } = getState();
          if (!project) return;
          try {
            await idbSet(project.id, project, projectStore);
            set(s => ({ saveState: 'saved', metas: [toMeta(project), ...s.metas.filter(m => m.id !== project.id)] }));
          } catch {
            set({ saveState: 'error' });
          }
        }, 450);
      };

      return {
        metas: [],
        project: null,
        photos: {},
        status: 'idle',
        saveState: 'saved',
        pageId: null,
        selectedId: null,
        past: [],
        future: [],
        lastCoalesce: null,

        async createProject(templateSlug) {
          const tpl = getTemplate(templateSlug) ?? getTemplate('blank')!;
          const project = buildProject(tpl);
          await idbSet(project.id, project, projectStore);
          set(s => ({ metas: [toMeta(project), ...s.metas], project, photos: {}, status: 'ready', pageId: project.pages[0].id, selectedId: null, past: [], future: [] }));
          return project.id;
        },

        async openProject(id) {
          const current = getState().project;
          if (current?.id === id) return current;
          set({ status: 'loading' });
          const project = await get<DiaryProject>(id, projectStore);
          if (!project) {
            set(s => ({ status: 'missing', project: null, metas: s.metas.filter(m => m.id !== id) }));
            return null;
          }
          const metas = await getPhotoMetas(project.photoIds);
          set({
            project, status: 'ready', pageId: project.pages[0]?.id ?? null, selectedId: null, past: [], future: [], saveState: 'saved',
            photos: Object.fromEntries(metas.map(m => [m.id, m])),
          });
          return project;
        },

        loadProjectData: id => (getState().project?.id === id ? Promise.resolve(getState().project!) : get<DiaryProject>(id, projectStore)),

        async deleteProject(id) {
          const project = await get<DiaryProject>(id, projectStore);
          await del(id, projectStore);
          if (project) {
            // Duplicated diaries share photos, so only delete photos nothing else references.
            const others = await values<DiaryProject>(projectStore);
            const inUse = new Set(others.flatMap(p => p.photoIds));
            const orphaned = project.photoIds.filter(pid => !inUse.has(pid));
            await deletePhotos(orphaned);
            forgetPhotos(orphaned);
          }
          set(s => ({ metas: s.metas.filter(m => m.id !== id), ...(s.project?.id === id ? { project: null, status: 'idle' as const } : {}) }));
        },

        async duplicateProject(id) {
          const source = await get<DiaryProject>(id, projectStore);
          if (!source) return null;
          const copy: DiaryProject = { ...structuredClone(source), id: uid(), title: `${source.title} (copy)`, createdAt: Date.now(), updatedAt: Date.now() };
          await idbSet(copy.id, copy, projectStore);
          set(s => ({ metas: [toMeta(copy), ...s.metas] }));
          return copy.id;
        },

        edit(recipe, opts = {}) {
          const { project, lastCoalesce } = getState();
          if (!project) return;
          const next = produce(project, d => { recipe(d); d.updatedAt = Date.now(); });
          if (next === project) return;
          const now = Date.now();
          const coalescing = opts.coalesce && lastCoalesce?.key === opts.coalesce && now - lastCoalesce.at < 800;
          const recordHistory = opts.history !== false && !coalescing && next.pages !== project.pages;
          set(s => ({
            project: next,
            past: recordHistory ? [...s.past.slice(-HISTORY_LIMIT + 1), project.pages] : s.past,
            future: recordHistory ? [] : s.future,
            lastCoalesce: opts.coalesce ? { key: opts.coalesce, at: now } : null,
          }));
          scheduleSave();
        },

        undo() {
          const { project, past, future } = getState();
          if (!project || !past.length) return;
          const prev = past[past.length - 1];
          set({ project: { ...project, pages: prev, updatedAt: Date.now() }, past: past.slice(0, -1), future: [project.pages, ...future], lastCoalesce: null });
          const { pageId, selectedId } = getState();
          if (!prev.some(p => p.id === pageId)) set({ pageId: prev[0]?.id ?? null });
          if (selectedId && !prev.some(p => p.elements.some(e => e.id === selectedId))) set({ selectedId: null });
          scheduleSave();
        },

        redo() {
          const { project, past, future } = getState();
          if (!project || !future.length) return;
          const [nextPages, ...rest] = future;
          set({ project: { ...project, pages: nextPages, updatedAt: Date.now() }, past: [...past, project.pages], future: rest, lastCoalesce: null });
          const { pageId } = getState();
          if (!nextPages.some(p => p.id === pageId)) set({ pageId: nextPages[0]?.id ?? null });
          scheduleSave();
        },

        selectPage: pageId => set({ pageId, selectedId: null }),
        select: selectedId => set({ selectedId }),

        async addPhotos(files, onProgress) {
          const added: PhotoMeta[] = [];
          const errors: string[] = [];
          let done = 0;
          const queue = [...files];
          const worker = async () => {
            for (let file = queue.shift(); file; file = queue.shift()) {
              try {
                const meta = await importPhoto(file);
                added.push(meta);
                set(s => ({ photos: { ...s.photos, [meta.id]: meta } }));
              } catch (e) {
                errors.push(e instanceof PhotoImportError ? e.message : `${file.name}: could not be imported`);
              }
              onProgress?.(++done, files.length);
            }
          };
          await Promise.all([worker(), worker(), worker()]);
          added.sort((a, b) => files.findIndex(f => f.name === a.name) - files.findIndex(f => f.name === b.name));
          if (added.length) getState().edit(d => { d.photoIds.push(...added.map(a => a.id)); }, { history: false });
          return { added, errors };
        },

        async removePhoto(photoId) {
          const projectId = getState().project?.id;
          getState().edit(d => {
            d.photoIds = d.photoIds.filter(id => id !== photoId);
            for (const page of d.pages) for (const el of page.elements) if (el.type === 'photo' && el.photoId === photoId) el.photoId = null;
          });
          set(s => { const photos = { ...s.photos }; delete photos[photoId]; return { photos }; });
          const others = (await values<DiaryProject>(projectStore)).filter(p => p.id !== projectId);
          if (!others.some(p => p.photoIds.includes(photoId))) {
            await deletePhotos([photoId]);
            forgetPhotos([photoId]);
          }
        },

        addElement(el, pageId) {
          const target = pageId ?? getState().pageId;
          getState().edit(d => { findPage(d, target)?.elements.push(el); });
          set({ selectedId: el.id });
        },

        updateElement(id, patch, coalesce) {
          getState().edit(d => {
            const hit = findElement(d, id);
            if (hit) Object.assign(hit.el, patch);
          }, { coalesce: coalesce ? `${coalesce}:${id}` : undefined });
        },

        removeElement(id) {
          getState().edit(d => { const hit = findElement(d, id); if (hit) hit.page.elements.splice(hit.index, 1); });
          if (getState().selectedId === id) set({ selectedId: null });
        },

        duplicateElement(id) {
          let copyId: string | null = null;
          getState().edit(d => {
            const hit = findElement(d, id);
            if (!hit) return;
            const copy = cloneElement(hit.el as DiaryElement);
            copyId = copy.id;
            hit.page.elements.splice(hit.index + 1, 0, copy);
          });
          if (copyId) set({ selectedId: copyId });
        },

        arrange(id, dir) {
          getState().edit(d => {
            const hit = findElement(d, id);
            if (!hit) return;
            const list = hit.page.elements;
            const [el] = list.splice(hit.index, 1);
            const to = dir === 'front' ? list.length : dir === 'back' ? 0 : dir === 'forward' ? Math.min(list.length, hit.index + 1) : Math.max(0, hit.index - 1);
            list.splice(to, 0, el);
          });
        },

        addPages(afterPageId, count = PAGE_RULES.step) {
          const { project } = getState();
          if (!project) return;
          const tpl = getTemplate(project.templateSlug) ?? getTemplate('blank')!;
          const inner = innerPageCount(project);
          const n = Math.min(count, PAGE_RULES.max - inner);
          if (n <= 0) return;
          const created = Array.from({ length: n }, (_, i) => newInnerPage(tpl, i % 2 ? 'duo-stack' : 'single'));
          getState().edit(d => {
            let at = d.pages.findIndex(p => p.id === afterPageId);
            const backIndex = d.pages.findIndex(p => p.kind === 'back');
            if (at < 0 || d.pages[at].kind === 'back') at = backIndex - 1;
            d.pages.splice(at + 1, 0, ...created);
          });
          set({ pageId: created[0].id, selectedId: null });
        },

        duplicatePage(pageId) {
          const { project } = getState();
          const page = project && findPage(project, pageId);
          if (!project || !page || page.kind !== 'inner' || innerPageCount(project) >= PAGE_RULES.max) return;
          const copy: DiaryPage = { ...structuredClone(page), id: uid() };
          copy.elements = copy.elements.map(e => ({ ...e, id: uid() }));
          getState().edit(d => { d.pages.splice(d.pages.findIndex(p => p.id === pageId) + 1, 0, copy); });
          set({ pageId: copy.id, selectedId: null });
        },

        removePage(pageId) {
          const { project } = getState();
          if (!project) return;
          const index = project.pages.findIndex(p => p.id === pageId);
          if (index < 0 || project.pages[index].kind !== 'inner' || innerPageCount(project) <= PAGE_RULES.min) return;
          getState().edit(d => { d.pages.splice(index, 1); });
          const pages = getState().project!.pages;
          set({ pageId: pages[Math.min(index, pages.length - 2)].id, selectedId: null });
        },

        movePage(pageId, toIndex) {
          getState().edit(d => {
            const from = d.pages.findIndex(p => p.id === pageId);
            if (from < 0 || d.pages[from].kind !== 'inner') return;
            const last = d.pages.length - 2;
            const to = Math.max(1, Math.min(last, toIndex));
            const [page] = d.pages.splice(from, 1);
            d.pages.splice(to, 0, page);
          });
        },
      };
    },
    { name: 'bd-projects', version: 1, partialize: s => ({ metas: s.metas }) },
  ),
);

export const useCurrentPage = () => useProjects(s => s.project?.pages.find(p => p.id === s.pageId) ?? null);
export const useSelectedElement = () =>
  useProjects(s => {
    if (!s.selectedId || !s.project) return null;
    for (const page of s.project.pages) {
      const el = page.elements.find(e => e.id === s.selectedId);
      if (el) return el;
    }
    return null;
  });
