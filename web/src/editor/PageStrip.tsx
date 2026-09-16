import { Fragment, memo, useState } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import { PAGE_RULES } from '@shared/pricing';
import { PAGE_W, type DiaryPage } from '@shared/types';
import { IconCopy, IconPlus, IconTrash } from '../components/Doodles';
import { useProjects } from '../store/projects';
import { innerPageCount } from './factory';
import { BackgroundNode, ElementNode } from './render/nodes';

export const PageThumb = memo(function PageThumb({ page, width }: { page: DiaryPage; width: number }) {
  const s = width / PAGE_W;
  return (
    <Stage width={width} height={Math.round((width * 4) / 3)} listening={false}>
      <Layer listening={false}>
        <Group scaleX={s} scaleY={s}>
          <BackgroundNode bg={page.background} variant="thumb" />
          {page.elements.map(el => <ElementNode key={el.id} el={el} variant="thumb" placeholders />)}
        </Group>
      </Layer>
    </Stage>
  );
});

export default function PageStrip() {
  const project = useProjects(s => s.project);
  const pageId = useProjects(s => s.pageId);
  const { selectPage, addPages, duplicatePage, removePage, movePage } = useProjects.getState();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (!project) return null;
  const inner = innerPageCount(project);
  const lastInner = project.pages.findLastIndex(p => p.kind === 'inner');

  return (
    <div className="strip" aria-label="Pages">
      <div className="strip__meta">
        <strong>{inner} pages</strong>
        <span>{inner >= PAGE_RULES.max ? 'maximum reached' : `add up to ${PAGE_RULES.max - inner} more`}</span>
      </div>
      <ol className="strip__list">
        {project.pages.map((page, index) => {
          const label = page.kind === 'cover' ? 'Cover' : page.kind === 'back' ? 'Back' : String(index);
          const canEdit = page.kind === 'inner';
          return (
            <Fragment key={page.id}>
            <li
              className={`strip__item ${page.id === pageId ? 'is-active' : ''} ${overIndex === index && dragId ? 'is-over' : ''} ${index % 2 === 0 && page.kind === 'inner' ? 'is-spread-end' : ''}`}
              draggable={canEdit}
              onDragStart={e => { setDragId(page.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', page.id); }}
              onDragOver={e => { if (dragId && canEdit) { e.preventDefault(); setOverIndex(index); } }}
              onDragEnd={() => { setDragId(null); setOverIndex(null); }}
              onDrop={e => { e.preventDefault(); if (dragId) movePage(dragId, index); setDragId(null); setOverIndex(null); }}
            >
              <button type="button" className="strip__thumb" onClick={() => selectPage(page.id)} aria-label={`Open ${page.kind === 'inner' ? `page ${index}` : `${label} cover`}`} aria-current={page.id === pageId ? 'page' : undefined}>
                <PageThumb page={page} width={72} />
              </button>
              <span className="strip__label">{label}</span>
              {canEdit && (
                <span className="strip__actions">
                  <button type="button" title="Duplicate page" aria-label={`Duplicate page ${index}`} disabled={inner >= PAGE_RULES.max} onClick={() => duplicatePage(page.id)}><IconCopy width={14} /></button>
                  <button type="button" title="Delete page" aria-label={`Delete page ${index}`} disabled={inner <= PAGE_RULES.min} onClick={() => removePage(page.id)}><IconTrash width={14} /></button>
                </span>
              )}
            </li>
            {index === lastInner && (
              <li className="strip__item strip__item--add">
                <button type="button" className="strip__add" onClick={() => addPages(page.id)} disabled={inner >= PAGE_RULES.max} title="Add two pages">
                  <IconPlus width={22} /><span>add 2</span>
                </button>
              </li>
            )}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
