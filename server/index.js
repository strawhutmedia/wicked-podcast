require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const instagramService = require('./services/instagram');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow embedding from any domain
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET'],
}));

// Serve static files (widget assets)
app.use('/widget', express.static(path.join(__dirname, '../widget')));

// API endpoint to get cached Instagram posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = instagramService.getCachedPosts();
    const lastUpdated = instagramService.getLastUpdated();

    res.json({
      success: true,
      posts,
      lastUpdated,
      count: posts.length
    });
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    lastUpdated: instagramService.getLastUpdated(),
    postCount: instagramService.getCachedPosts().length
  });
});

// Manual refresh endpoint (protected by API key)
app.post('/api/refresh', async (req, res) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await instagramService.refreshPosts();
    res.json({
      success: true,
      message: 'Posts refreshed successfully',
      count: instagramService.getCachedPosts().length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve the embeddable widget HTML
app.get('/embed', (req, res) => {
  res.sendFile(path.join(__dirname, '../widget/embed.html'));
});

// Schedule hourly refresh (runs at the start of every hour)
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Running hourly Instagram refresh...');
  try {
    await instagramService.refreshPosts();
    console.log('[Cron] Refresh completed successfully');
  } catch (error) {
    console.error('[Cron] Refresh failed:', error.message);
  }
});

// Initial fetch on startup
async function initialize() {
  console.log('Starting SHM Instagram Widget Server...');

  if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
    console.warn('WARNING: INSTAGRAM_ACCESS_TOKEN not set. Please configure your .env file.');
    console.warn('See README.md for setup instructions.');
  } else {
    try {
      await instagramService.refreshPosts();
      console.log(`Loaded ${instagramService.getCachedPosts().length} posts from Instagram`);
    } catch (error) {
      console.error('Failed to load initial posts:', error.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Widget embed URL: http://localhost:${PORT}/embed`);
    console.log(`API endpoint: http://localhost:${PORT}/api/posts`);
  });
}

initialize();
