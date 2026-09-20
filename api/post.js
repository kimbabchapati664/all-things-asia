const { listPublished, blocksToHTML } = require('./_notion');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const slug = (req.query && req.query.slug) || '';
  if (!slug) return res.status(400).json({ error: 'slug is required' });
  try {
    const posts = await listPublished();
    const post = posts.find((p) => p.slug === slug || p.id === slug.replace(/-/g, ''));
    if (!post) return res.status(404).json({ error: 'not found' });
    const html = await blocksToHTML(post.id);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ ...post, html });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
