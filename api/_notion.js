// Shared Notion helpers. Requires env NOTION_TOKEN and NOTION_DB_ID.
const NOTION_VERSION = '2022-06-28';

function token() {
  const t = process.env.NOTION_TOKEN;
  if (!t) throw new Error('NOTION_TOKEN is not set');
  return t;
}

function dbId() {
  const d = process.env.NOTION_DB_ID;
  if (!d) throw new Error('NOTION_DB_ID is not set');
  return d;
}

async function notion(path, options = {}) {
  const res = await fetch('https://api.notion.com/v1' + path, {
    method: options.method || 'GET',
    headers: {
      Authorization: 'Bearer ' + token(),
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || 'Notion error ' + res.status);
    err.status = res.status;
    throw err;
  }
  return json;
}

const plain = (arr) => (arr || []).map((t) => t.plain_text).join('');

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function coverOf(page) {
  const url = page.properties?.['Cover Image URL']?.url;
  if (url) return url;
  const c = page.cover;
  if (!c) return null;
  return c.type === 'external' ? c.external.url : c.file?.url || null;
}

function mapPage(page) {
  const p = page.properties || {};
  const title = plain(p.Title?.title) || plain(p.Name?.title) || 'Untitled';
  return {
    id: page.id.replace(/-/g, ''),
    title,
    slug: plain(p.Slug?.rich_text) || slugify(title),
    excerpt: plain(p.Excerpt?.rich_text),
    category: p.Category?.select?.name || null,
    tags: (p.Tags?.multi_select || []).map((t) => t.name),
    author: plain(p.Author?.rich_text),
    featured: !!p.Featured?.checkbox,
    published: p.Published?.date?.start || page.created_time,
    cover: coverOf(page),
  };
}

async function listPublished() {
  const out = [];
  let cursor;
  do {
    const body = {
      page_size: 100,
      filter: { property: 'Status', select: { equals: 'Published' } },
      sorts: [{ property: 'Published', direction: 'descending' }],
    };
    if (cursor) body.start_cursor = cursor;
    const data = await notion('/databases/' + dbId() + '/query', { method: 'POST', body });
    out.push(...data.results.map(mapPage));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return out;
}

// ---------------- block -> HTML ----------------
const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function rich(arr) {
  return (arr || [])
    .map((t) => {
      let h = esc(t.plain_text);
      const a = t.annotations || {};
      if (a.code) h = '<code>' + h + '</code>';
      if (a.bold) h = '<strong>' + h + '</strong>';
      if (a.italic) h = '<em>' + h + '</em>';
      if (a.strikethrough) h = '<s>' + h + '</s>';
      if (a.underline) h = '<u>' + h + '</u>';
      if (t.href) h = '<a href="' + esc(t.href) + '" target="_blank" rel="noopener">' + h + '</a>';
      return h;
    })
    .join('');
}

async function childrenOf(blockId) {
  const out = [];
  let cursor;
  do {
    const qs = '?page_size=100' + (cursor ? '&start_cursor=' + cursor : '');
    const data = await notion('/blocks/' + blockId + '/children' + qs);
    out.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return out;
}

async function blocksToHTML(blockId, depth = 0) {
  if (depth > 3) return '';
  const blocks = await childrenOf(blockId);
  let html = '';
  let listType = null;

  const closeList = () => {
    if (listType) { html += listType === 'ul' ? '</ul>' : '</ol>'; listType = null; }
  };

  for (const b of blocks) {
    const t = b.type;
    const v = b[t] || {};

    if (t === 'bulleted_list_item' || t === 'numbered_list_item' || t === 'to_do') {
      const want = t === 'numbered_list_item' ? 'ol' : 'ul';
      if (listType !== want) { closeList(); html += want === 'ol' ? '<ol>' : `<ul${t === 'to_do' ? ' class="todo"' : ''}>`; listType = want; }
      const mark = t === 'to_do' ? (v.checked ? '☑ ' : '☐ ') : '';
      let inner = mark + rich(v.rich_text);
      if (b.has_children) inner += await blocksToHTML(b.id, depth + 1);
      html += '<li>' + inner + '</li>';
      continue;
    }
    closeList();

    switch (t) {
      case 'paragraph': {
        const c = rich(v.rich_text);
        if (c.trim()) html += '<p>' + c + '</p>';
        break;
      }
      case 'heading_1': html += '<h2>' + rich(v.rich_text) + '</h2>'; break;
      case 'heading_2': html += '<h2>' + rich(v.rich_text) + '</h2>'; break;
      case 'heading_3': html += '<h3>' + rich(v.rich_text) + '</h3>'; break;
      case 'quote': html += '<blockquote>' + rich(v.rich_text) + '</blockquote>'; break;
      case 'divider': html += '<hr>'; break;
      case 'callout': {
        const icon = v.icon?.emoji ? '<div>' + esc(v.icon.emoji) + '</div>' : '';
        html += '<div class="callout">' + icon + '<div>' + rich(v.rich_text) + '</div></div>';
        break;
      }
      case 'code':
        html += '<pre><code>' + esc((v.rich_text || []).map((x) => x.plain_text).join('')) + '</code></pre>';
        break;
      case 'image': {
        const src = v.type === 'external' ? v.external.url : v.file?.url;
        if (src) html += '<figure><img src="' + esc(src) + '" alt="' + esc(rich(v.caption).replace(/<[^>]+>/g, '')) + '">' +
          (v.caption?.length ? '<figcaption class="small muted">' + rich(v.caption) + '</figcaption>' : '') + '</figure>';
        break;
      }
      case 'bookmark':
      case 'embed':
      case 'link_preview': {
        const url = v.url;
        if (url) html += '<p><a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + '</a></p>';
        break;
      }
      case 'video': {
        const src = v.type === 'external' ? v.external.url : v.file?.url;
        const yt = src && src.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
        if (yt) html += '<p><iframe width="100%" height="380" style="border:0;border-radius:14px" src="https://www.youtube.com/embed/' + yt[1] + '" allowfullscreen></iframe></p>';
        else if (src) html += '<p><a href="' + esc(src) + '" target="_blank" rel="noopener">Watch video</a></p>';
        break;
      }
      case 'table': {
        const rows = await childrenOf(b.id);
        html += '<div class="tscroll"><table class="data">';
        rows.forEach((r, i) => {
          const cells = (r.table_row?.cells || []).map((c) => rich(c));
          const tag = i === 0 && v.has_column_header ? 'th' : 'td';
          html += (i === 0 && v.has_column_header ? '<thead>' : '') + '<tr>' +
            cells.map((c) => '<' + tag + '>' + c + '</' + tag + '>').join('') + '</tr>' +
            (i === 0 && v.has_column_header ? '</thead>' : '');
        });
        html += '</table></div>';
        break;
      }
      case 'toggle': {
        html += '<details><summary>' + rich(v.rich_text) + '</summary>' + (b.has_children ? await blocksToHTML(b.id, depth + 1) : '') + '</details>';
        break;
      }
      default:
        if (b.has_children) html += await blocksToHTML(b.id, depth + 1);
    }
  }
  closeList();
  return html;
}

module.exports = { notion, listPublished, mapPage, blocksToHTML, slugify, plain, dbId };
