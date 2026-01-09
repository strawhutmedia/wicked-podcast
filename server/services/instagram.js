const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cache file for persistence across restarts
const CACHE_FILE = path.join(__dirname, '../../data/posts-cache.json');

// In-memory cache
let cachedPosts = [];
let lastUpdated = null;

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load cache from file on startup
function loadCacheFromFile() {
  try {
    ensureDataDir();
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      cachedPosts = data.posts || [];
      lastUpdated = data.lastUpdated || null;
      console.log(`Loaded ${cachedPosts.length} posts from cache file`);
    }
  } catch (error) {
    console.error('Failed to load cache from file:', error.message);
  }
}

// Save cache to file
function saveCacheToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      posts: cachedPosts,
      lastUpdated
    }, null, 2));
  } catch (error) {
    console.error('Failed to save cache to file:', error.message);
  }
}

// Fetch posts from Instagram Graph API
async function fetchFromInstagram() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is not configured');
  }

  const limit = process.env.POST_LIMIT || 12;

  // Instagram Graph API endpoint for user media
  const url = `https://graph.instagram.com/me/media`;

  const response = await axios.get(url, {
    params: {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username',
      access_token: accessToken,
      limit
    }
  });

  if (!response.data || !response.data.data) {
    throw new Error('Invalid response from Instagram API');
  }

  // Transform the data to our format
  const posts = response.data.data.map(post => ({
    id: post.id,
    caption: post.caption || '',
    mediaType: post.media_type, // IMAGE, VIDEO, or CAROUSEL_ALBUM
    mediaUrl: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
    videoUrl: post.media_type === 'VIDEO' ? post.media_url : null,
    permalink: post.permalink,
    timestamp: post.timestamp,
    username: post.username
  }));

  return posts;
}

// Refresh posts from Instagram
async function refreshPosts() {
  console.log('Refreshing posts from Instagram...');
  const posts = await fetchFromInstagram();
  cachedPosts = posts;
  lastUpdated = new Date().toISOString();
  saveCacheToFile();
  console.log(`Cached ${posts.length} posts`);
  return posts;
}

// Get cached posts
function getCachedPosts() {
  return cachedPosts;
}

// Get last updated timestamp
function getLastUpdated() {
  return lastUpdated;
}

// Token refresh - Instagram long-lived tokens last 60 days
// This function can be used to refresh the token before it expires
async function refreshAccessToken() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is not configured');
  }

  const url = `https://graph.instagram.com/refresh_access_token`;

  const response = await axios.get(url, {
    params: {
      grant_type: 'ig_refresh_token',
      access_token: accessToken
    }
  });

  return response.data;
}

// Load cache on module init
loadCacheFromFile();

module.exports = {
  refreshPosts,
  getCachedPosts,
  getLastUpdated,
  refreshAccessToken
};
