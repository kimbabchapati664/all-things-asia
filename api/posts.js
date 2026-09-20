const { listPublished } = require('./_notion');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const posts = await listPublished();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({ count: posts.length, posts });
  } catch (e) {
    res.status(500).json({ error: e.message, posts: [] });
  }
};
