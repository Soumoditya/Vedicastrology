'use client';

import { useActionState, useRef, useState } from 'react';

import { savePost, type PostState } from '@/lib/blog/actions';
import type { Category, Post } from '@/lib/supabase/types';

const empty: PostState = {};

/**
 * Post editor.
 *
 * Markdown with a formatting toolbar and a live preview, rather than a rich
 * text editor. The stored text stays readable and portable, a draft can be
 * pasted in from anywhere, and there is no editor state to corrupt. The
 * toolbar means nobody has to remember the syntax.
 */
export function PostEditor({
  post,
  categories,
}: {
  post: (Post & { content: { markdown?: string } | null }) | null;
  categories: Category[];
}) {
  const [state, action, pending] = useActionState(savePost, empty);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initial = post?.content?.markdown ?? '';
  const [body, setBody] = useState(initial);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState(post?.status ?? 'draft');

  /** Wrap the selection, or insert at the caret when nothing is selected. */
  function wrap(before: string, after = before, placeholder = 'text') {
    const el = textareaRef.current;
    if (!el) return;

    const { selectionStart: start, selectionEnd: end } = el;
    const selected = body.slice(start, end) || placeholder;
    const next = body.slice(0, start) + before + selected + after + body.slice(end);

    setBody(next);

    // Restore a sensible selection so typing continues where expected.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function prefixLine(prefix: string) {
    const el = textareaRef.current;
    if (!el) return;

    const start = body.lastIndexOf('\n', el.selectionStart - 1) + 1;
    setBody(body.slice(0, start) + prefix + body.slice(start));
    requestAnimationFrame(() => el.focus());
  }

  return (
    <form action={action} className="space-y-5">
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="body" value={body} />

      <Field label="Title" htmlFor="post-title">
        <input
          id="post-title"
          name="title"
          required
          defaultValue={post?.title ?? ''}
          placeholder="What Sade Sati actually does"
          className={`${input} text-lg`}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Web address" htmlFor="post-slug" hint="Blank builds it from the title">
          <input
            id="post-slug"
            name="slug"
            defaultValue={post?.slug ?? ''}
            className={input}
          />
        </Field>

        <Field label="Category" htmlFor="post-category">
          <select
            id="post-category"
            name="category_id"
            defaultValue={post?.category_id ?? ''}
            className={input}
            style={{ colorScheme: 'dark' }}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Writing area */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span
            className="text-xs font-medium uppercase tracking-[0.12em]"
            style={{ color: 'var(--text-secondary)' }}
          >
            The post
          </span>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="text-xs underline underline-offset-4"
            style={{ color: 'var(--color-gold-400)' }}
          >
            {preview ? 'Back to writing' : 'Preview'}
          </button>
        </div>

        {!preview && (
          <div
            className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 p-2"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-sunken)' }}
          >
            <ToolButton onClick={() => prefixLine('## ')} title="Heading">H2</ToolButton>
            <ToolButton onClick={() => prefixLine('### ')} title="Sub-heading">H3</ToolButton>
            <ToolButton onClick={() => wrap('**', '**', 'bold')} title="Bold">
              <strong>B</strong>
            </ToolButton>
            <ToolButton onClick={() => wrap('*', '*', 'italic')} title="Italic">
              <em>I</em>
            </ToolButton>
            <ToolButton onClick={() => prefixLine('- ')} title="Bullet list">List</ToolButton>
            <ToolButton onClick={() => prefixLine('> ')} title="Quote">Quote</ToolButton>
            <ToolButton onClick={() => wrap('[', '](https://)', 'link text')} title="Link">
              Link
            </ToolButton>
          </div>
        )}

        {preview ? (
          <div
            className="prose-vedic min-h-[24rem] rounded-lg border p-5"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-sunken)' }}
            dangerouslySetInnerHTML={{ __html: previewHtml(body) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={22}
            placeholder={'Write here.\n\n## A heading\n\nA paragraph.'}
            className={`${input} rounded-t-none font-mono text-[0.9rem] leading-relaxed`}
          />
        )}
      </div>

      <Field label="Excerpt" htmlFor="post-excerpt" hint="Blank uses the opening paragraph">
        <textarea
          id="post-excerpt"
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt ?? ''}
          className={input}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="post-status">
          <select
            id="post-status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className={input}
            style={{ colorScheme: 'dark' }}
          >
            <option value="draft">Draft, only you can see it</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </Field>

        {(status === 'scheduled' || status === 'published') && (
          <Field
            label={status === 'scheduled' ? 'Appears at' : 'Published at'}
            htmlFor="post-date"
            hint={status === 'published' ? 'Blank uses now' : undefined}
          >
            <input
              id="post-date"
              name="published_at"
              type="datetime-local"
              defaultValue={
                post?.published_at
                  ? new Date(post.published_at).toISOString().slice(0, 16)
                  : ''
              }
              className={input}
              required={status === 'scheduled'}
            />
          </Field>
        )}
      </div>

      <details>
        <summary className="cursor-pointer text-xs" style={{ color: 'var(--color-gold-400)' }}>
          Search engine settings
        </summary>
        <div className="mt-4 space-y-4">
          <Field label="Title for search" htmlFor="post-seo-title" hint="Blank uses the post title">
            <input
              id="post-seo-title"
              name="seo_title"
              defaultValue={post?.seo_title ?? ''}
              className={input}
            />
          </Field>
          <Field label="Description for search" htmlFor="post-seo-desc">
            <textarea
              id="post-seo-desc"
              name="seo_description"
              rows={2}
              defaultValue={post?.seo_description ?? ''}
              className={input}
            />
          </Field>
        </div>
      </details>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'color-mix(in oklab, var(--color-malefic) 40%, transparent)',
            background: 'color-mix(in oklab, var(--color-malefic) 8%, transparent)',
            color: 'var(--color-malefic)',
          }}
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-70"
        style={{
          background: 'linear-gradient(120deg, var(--color-gold-300), var(--color-gold-500))',
          color: '#150e00',
        }}
      >
        {pending ? 'Saving…' : post ? 'Save changes' : 'Create post'}
      </button>
    </form>
  );
}

/**
 * A deliberately small markdown renderer for the preview only.
 *
 * The real rendering happens on the server at save time. Pulling the full
 * parser into the browser purely for a preview would add weight to every admin
 * page load for no gain.
 */
function previewHtml(source: string): string {
  const escaped = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .split(/\n{2,}/)
    .map((block) =>
      /^<(h2|h3|blockquote|li)/.test(block.trim()) ? block : `<p>${block}</p>`,
    )
    .join('\n');
}

const input =
  'w-full rounded-lg border bg-[var(--surface-sunken)] px-3 py-2.5 text-sm ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ' +
  'focus:border-[var(--color-gold-500)]';

function ToolButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded px-2.5 py-1 text-xs transition-colors"
      style={{ color: 'var(--text-secondary)', background: 'var(--surface-raised)' }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
        {hint && (
          <span className="text-[0.7rem]" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
