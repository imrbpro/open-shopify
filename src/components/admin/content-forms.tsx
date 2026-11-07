import Link from "next/link";

function dateValue(date: Date | undefined): string {
  if (!date) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function PageForm({
  action,
  shopSlug,
  page,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  shopSlug: string;
  page?: {
    id?: string;
    title?: string;
    handle?: string;
    body?: string;
    published?: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-4 lg:grid-cols-3">
      <input type="hidden" name="shopSlug" value={shopSlug} />
      {page?.id ? <input type="hidden" name="id" value={page.id} /> : null}
      <div className="card card-pad space-y-4 lg:col-span-2">
        <div>
          <label htmlFor="title" className="label">
            Title *
          </label>
          <input id="title" name="title" className="input" defaultValue={page?.title} required />
        </div>
        <div>
          <label htmlFor="body" className="label">
            Content
          </label>
          <textarea
            id="body"
            name="body"
            className="input min-h-[320px] font-mono text-[13px]"
            defaultValue={page?.body}
            placeholder="Write your page content. Blank lines become paragraphs."
          />
          <p className="hint">Line breaks are preserved on the storefront. HTML is rendered as text.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="card card-pad space-y-4">
          <div>
            <label htmlFor="handle" className="label">
              URL handle
            </label>
            <input id="handle" name="handle" className="input" defaultValue={page?.handle} placeholder="about" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="published"
              defaultChecked={page?.published ?? true}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Visible on storefront
          </label>
          <button type="submit" className="btn btn-primary w-full">
            {submitLabel}
          </button>
          <Link href={`/admin/${shopSlug}/content/pages`} className="btn btn-ghost w-full text-xs">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}

export function PostForm({
  action,
  shopSlug,
  post,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  shopSlug: string;
  post?: {
    id?: string;
    title?: string;
    handle?: string;
    excerpt?: string;
    body?: string;
    author?: string;
    image?: string | null;
    publishedAt?: Date;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-4 lg:grid-cols-3">
      <input type="hidden" name="shopSlug" value={shopSlug} />
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <div className="card card-pad space-y-4 lg:col-span-2">
        <div>
          <label htmlFor="title" className="label">
            Title *
          </label>
          <input id="title" name="title" className="input" defaultValue={post?.title} required />
        </div>
        <div>
          <label htmlFor="excerpt" className="label">
            Excerpt
          </label>
          <textarea id="excerpt" name="excerpt" className="input min-h-[70px]" defaultValue={post?.excerpt} />
        </div>
        <div>
          <label htmlFor="body" className="label">
            Content
          </label>
          <textarea
            id="body"
            name="body"
            className="input min-h-[280px] font-mono text-[13px]"
            defaultValue={post?.body}
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="card card-pad space-y-4">
          <div>
            <label htmlFor="author" className="label">
              Author
            </label>
            <input id="author" name="author" className="input" defaultValue={post?.author} />
          </div>
          <div>
            <label htmlFor="handle" className="label">
              URL handle
            </label>
            <input id="handle" name="handle" className="input" defaultValue={post?.handle} />
          </div>
          <div>
            <label htmlFor="image" className="label">
              Cover image URL
            </label>
            <input id="image" name="image" className="input" defaultValue={post?.image ?? ""} />
          </div>
          <div>
            <label htmlFor="publishedAt" className="label">
              Publish date
            </label>
            <input
              id="publishedAt"
              name="publishedAt"
              type="date"
              className="input"
              defaultValue={dateValue(post?.publishedAt)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            {submitLabel}
          </button>
          <Link href={`/admin/${shopSlug}/content/blog`} className="btn btn-ghost w-full text-xs">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
