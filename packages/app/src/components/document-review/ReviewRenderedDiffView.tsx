import { Extension, getSchema } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';
import { EditorContent, useEditor } from '@tiptap/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AuthorshipCard,
  RestoreChangeButton,
  StructuralCaption,
} from '@/components/document-review/ReviewOverlays';
import { getSharedMarkdownManager } from '@/editor/utils/md-singleton';
import type { DocumentReviewChange } from '@/lib/document-review/types';
import {
  buildRenderedDiff,
  type RenderedDiff,
  type RenderedDiffResult,
} from '@/lib/rendered-diff/build-rendered-diff';
import {
  buildDiffDecorations,
  RENDERED_DIFF_CHANGE_SELECTOR,
  type ReviewDecorationOptions,
} from '@/lib/rendered-diff/diff-decorations';
import { diffExtensions } from '@/lib/rendered-diff/diff-extensions';

const diffSchema = getSchema(diffExtensions);

export function computeRenderedDiff(before: string, after: string): RenderedDiffResult {
  return buildRenderedDiff(before, after, diffSchema, getSharedMarkdownManager());
}

const DiffDecorations = Extension.create<{ decorations: DecorationSet }>({
  name: 'renderedDiffDecorations',
  addOptions() {
    return { decorations: DecorationSet.empty };
  },
  addProseMirrorPlugins() {
    const decorations = this.options.decorations;
    return [
      new Plugin({
        key: new PluginKey('renderedDiffDecorations'),
        props: { decorations: () => decorations },
      }),
    ];
  },
});

interface ReviewRenderedDiffViewProps {
  diff: RenderedDiff;
  reviewOptions?: ReviewDecorationOptions;
  marksHidden?: boolean;
  selectedChange: DocumentReviewChange | null;
  onRestoreChange?: () => void;
}

export function ReviewRenderedDiffView({
  diff,
  reviewOptions,
  marksHidden = false,
  selectedChange,
  onRestoreChange,
}: ReviewRenderedDiffViewProps) {
  const decorations = marksHidden
    ? DecorationSet.empty
    : buildDiffDecorations(
        diff.afterDoc,
        diff.beforeDoc,
        diff.changes,
        diff.markChanges,
        diffSchema,
        reviewOptions,
      );

  const editor = useEditor(
    {
      editable: false,
      extensions: [...diffExtensions, DiffDecorations.configure({ decorations })],
      content: diff.afterDoc.toJSON(),
      editorProps: {
        attributes: { class: 'pt-4 document-review-editor' },
      },
    },
    [diff, marksHidden, reviewOptions?.selectedChangeId, reviewOptions?.chipPositions],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [portalTarget] = useState(() => {
    const el = document.createElement('div');
    el.style.display = 'contents';
    return el;
  });
  const portalSlotRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const slot = portalSlotRef.current;
    if (!slot) return;
    slot.appendChild(portalTarget);
    return () => {
      if (portalTarget.parentNode === slot) slot.removeChild(portalTarget);
    };
  }, [portalTarget]);

  useLayoutEffect(() => {
    if (selectedChange === null || scrollRef.current === null) return;
    const root = scrollRef.current;
    const target =
      root.querySelector<HTMLElement>(`[data-review-change-id="${selectedChange.id}"]`) ??
      root.querySelector<HTMLElement>(RENDERED_DIFF_CHANGE_SELECTOR);
    if (target === null) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [selectedChange]);

  return (
    <div
      ref={scrollRef}
      className="document-review-scroll editor-doc-scroll min-h-0 flex-1 overflow-auto subtle-scrollbar"
      data-testid="review-rendered-diff-view"
    >
      {selectedChange?.structuralCaption ? (
        <div className="px-6 pt-4">
          <StructuralCaption caption={selectedChange.structuralCaption} />
        </div>
      ) : null}
      <div className="tiptap-editor document-review-body px-6 pb-8">
        <div ref={portalSlotRef} style={{ display: 'contents' }} />
      </div>
      {createPortal(
        // biome-ignore lint/plugin/no-unportaled-editor-content: portaled site — view.dom parent is the exclusively-owned portalTarget per the H6 contract (PRECEDENTS.md #44)
        <EditorContent editor={editor} className="tiptap-editor-portal-content" />,
        portalTarget,
      )}
      {selectedChange !== null ? (
        <div className="sticky bottom-0 border-t border-border bg-background/90 px-6 py-3 backdrop-blur-sm">
          {selectedChange.authorship ? (
            <AuthorshipCard authorship={selectedChange.authorship} />
          ) : null}
          {onRestoreChange ? <RestoreChangeButton onRestore={onRestoreChange} /> : null}
        </div>
      ) : null}
    </div>
  );
}
