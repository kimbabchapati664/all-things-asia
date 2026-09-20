/* All Things Asia — front-end helpers. Posts come from Notion via /api/posts. */
window.ATA = (function () {
  const API = '/api';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async function getPosts() {
    if (window.__ATA_POSTS) return window.__ATA_POSTS;
    const r = await fetch(API + '/posts');
    if (!r.ok) throw new Error('posts ' + r.status);
    const j = await r.json();
    window.__ATA_POSTS = j.posts || [];
    return window.__ATA_POSTS;
  }

  function cardHTML(p) {
    const href = 'post.html?slug=' + encodeURIComponent(p.slug || p.id);
    const thumb = p.cover
      ? `<a href="${href}"><div class="thumb" style="background-image:url('${esc(p.cover)}')"></div></a>` : '';
    return `<article class="post-card">
      ${thumb}
      <div class="body">
        ${p.category ? `<div class="cat">${esc(p.category)}</div>` : ''}
        <h3><a href="${href}">${esc(p.title)}</a></h3>
        <div class="ex">${esc(p.excerpt || '')}</div>
        <div class="date">${esc(fmtDate(p.published))}${p.author ? ' &middot; ' + esc(p.author) : ''}</div>
      </div>
    </article>`;
  }

  function emptyHTML(msg) {
    return `<div class="empty" style="grid-column:1/-1">
      <p style="margin:0 0 6px"><b>${esc(msg)}</b></p>
      <p class="small" style="margin:0">New posts appear here automatically once they are marked <b>Published</b> in Notion.</p>
    </div>`;
  }

  async function renderLatest(sel, limit) {
    const el = document.querySelector(sel);
    if (!el) return;
    try {
      const posts = await getPosts();
      el.innerHTML = posts.length
        ? posts.slice(0, limit || 3).map(cardHTML).join('')
        : emptyHTML('No posts published yet.');
    } catch (e) {
      el.innerHTML = emptyHTML('The blog could not load right now.');
    }
  }

  async function renderBlog(listSel, filterSel) {
    const el = document.querySelector(listSel);
    const fEl = filterSel ? document.querySelector(filterSel) : null;
    if (!el) return;
    let posts = [];
    try {
      posts = await getPosts();
    } catch (e) {
      el.innerHTML = emptyHTML('The blog could not load right now.');
      return;
    }
    if (!posts.length) { el.innerHTML = emptyHTML('No posts published yet.'); return; }

    const cats = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];
    let active = 'All';
    function draw() {
      const shown = active === 'All' ? posts : posts.filter(p => p.category === active);
      el.innerHTML = shown.length ? shown.map(cardHTML).join('') : emptyHTML('Nothing in this category yet.');
      if (fEl) fEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c === active));
    }
    if (fEl && cats.length > 2) {
      fEl.innerHTML = cats.map(c => `<button data-c="${esc(c)}">${esc(c)}</button>`).join('');
      fEl.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        active = b.dataset.c; draw();
      });
    }
    draw();
  }

  async function renderPost(headSel, bodySel) {
    const head = document.querySelector(headSel);
    const body = document.querySelector(bodySel);
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) { head.innerHTML = '<h1>Post not found</h1>'; body.innerHTML = '<p><a href="blog.html">Back to the blog</a></p>'; return; }
    try {
      const r = await fetch(API + '/post?slug=' + encodeURIComponent(slug));
      if (!r.ok) throw new Error('post ' + r.status);
      const p = await r.json();
      document.title = p.title + ' — All Things Asia';
      head.innerHTML = `${p.category ? `<div class="cat" style="font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:12px">${esc(p.category)}</div>` : ''}
        <h1>${esc(p.title)}</h1>
        <div class="pmeta">${esc(fmtDate(p.published))}${p.author ? ' &middot; ' + esc(p.author) : ''}</div>
        ${p.cover ? `<img src="${esc(p.cover)}" alt="" style="border-radius:14px;margin-top:26px">` : ''}`;
      body.innerHTML = p.html || '<p class="muted">This post has no content yet.</p>';
    } catch (e) {
      head.innerHTML = '<h1>Post not found</h1>';
      body.innerHTML = '<p>That post may have been unpublished. <a href="blog.html">Back to the blog</a></p>';
    }
  }

  return { getPosts, renderLatest, renderBlog, renderPost, fmtDate, esc };
})();
