# SHM Instagram Widget

A self-hosted Instagram feed widget for Straw Hut Media. This widget fetches and caches your Instagram posts, refreshing them hourly to keep your website up-to-date without hitting API rate limits.

## Features

- **Self-hosted** - No third-party services or monthly fees
- **Hourly refresh** - Keeps posts current via automatic cron job
- **Server-side caching** - Minimizes Instagram API calls
- **Responsive grid** - Looks great on all screen sizes
- **Dark mode support** - Automatic or manual dark theme
- **Lightweight** - ~5KB JavaScript, no jQuery required
- **Easy embedding** - Simple iframe or JavaScript integration

## Prerequisites

- Node.js 16 or higher
- An Instagram Business or Creator account
- A Facebook Developer account

## Quick Start

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd SHM-Widget
   npm install
   ```

2. **Run the setup wizard:**
   ```bash
   npm run setup
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **View your widget:**
   Open `http://localhost:3000/embed` in your browser.

## Getting Your Instagram Access Token

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** or **None** as the app type
4. Fill in your app details and create it

### Step 2: Set Up Instagram Basic Display

1. In your app dashboard, click **Add Product**
2. Find **Instagram Basic Display** and click **Set Up**
3. Scroll down and click **Create New App** under Instagram App ID
4. Add your **Valid OAuth Redirect URIs**: `https://localhost/`
5. Add your Instagram account as a test user:
   - Go to **Roles** → **Instagram Testers**
   - Add your Instagram username
   - On Instagram, go to Settings → Apps and Websites → Tester Invites → Accept

### Step 3: Generate Your Access Token

1. In the Instagram Basic Display settings, find **User Token Generator**
2. Click **Generate Token** next to your Instagram test user
3. Log in and authorize the app
4. Copy the short-lived token

### Step 4: Convert to Long-Lived Token

Short-lived tokens expire in 1 hour. Convert to a long-lived token (60 days):

```bash
curl -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=YOUR_SHORT_LIVED_TOKEN"
```

The response contains your long-lived token. Use this in your `.env` file.

### Token Refresh

Long-lived tokens expire after 60 days. To refresh before expiry, call:

```bash
curl -X GET "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=YOUR_LONG_LIVED_TOKEN"
```

Consider setting up a cron job to refresh your token monthly.

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Your Instagram long-lived access token
INSTAGRAM_ACCESS_TOKEN=your_token_here

# Server port
PORT=3000

# Number of posts to display (max 25)
POST_LIMIT=12

# Restrict CORS to your domains (comma-separated)
ALLOWED_ORIGINS=https://strawhutmedia.com,https://www.strawhutmedia.com

# Admin API key for manual refresh
ADMIN_API_KEY=your_secure_key
```

## Embedding the Widget

### Option 1: Iframe (Easiest)

Add this to your website's footer:

```html
<iframe
  src="https://your-server.com/embed"
  width="100%"
  height="400"
  frameborder="0"
  style="border: none;"
  title="Instagram Feed"
></iframe>
```

### Option 2: JavaScript (More Control)

Include the widget script and CSS:

```html
<link rel="stylesheet" href="https://your-server.com/widget/widget.css">
<script src="https://your-server.com/widget/widget.js"></script>

<div id="instagram-feed"></div>

<script>
  SHMInstagramWidget.init({
    container: '#instagram-feed',
    apiUrl: 'https://your-server.com/api/posts',
    postLimit: 6,
    showHeader: true,
    showFollowButton: true,
    darkMode: false
  });
</script>
```

### Widget Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string | `#shm-instagram-widget` | CSS selector for the widget container |
| `apiUrl` | string | `/api/posts` | URL to your posts API endpoint |
| `postLimit` | number | `12` | Number of posts to display |
| `showHeader` | boolean | `true` | Show the Instagram username header |
| `showFollowButton` | boolean | `true` | Show the follow button at bottom |
| `darkMode` | boolean | `false` | Enable dark mode styling |
| `onLoad` | function | `null` | Callback when posts are loaded |
| `onError` | function | `null` | Callback when an error occurs |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/posts` | GET | Get cached Instagram posts |
| `/api/health` | GET | Health check with cache status |
| `/api/refresh` | POST | Manually trigger refresh (requires `X-API-Key` header) |
| `/embed` | GET | Embeddable widget HTML page |

### Manual Refresh

```bash
curl -X POST https://your-server.com/api/refresh \
  -H "X-API-Key: your_admin_api_key"
```

## Deployment

### Deploy with PM2 (Recommended)

```bash
npm install -g pm2
pm2 start server/index.js --name shm-instagram
pm2 save
pm2 startup
```

### Deploy with Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name instagram.strawhutmedia.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## How It Works

1. **Server starts** → Loads any cached posts from disk
2. **Initial fetch** → Pulls latest posts from Instagram API
3. **Cron job** → Refreshes posts at the top of every hour
4. **API request** → Returns cached posts instantly (no Instagram API call)
5. **Cache persistence** → Posts survive server restarts

This architecture means:
- Your website always loads fast (cached data)
- You only make ~24 Instagram API calls per day
- No rate limits or usage caps to worry about

## Troubleshooting

### "INSTAGRAM_ACCESS_TOKEN is not configured"
Make sure you have a `.env` file with your access token.

### "Invalid response from Instagram API"
Your access token may have expired. Generate a new one.

### Posts not updating
Check the server logs. The cron job runs at minute 0 of each hour.

### CORS errors when embedding
Add your website domain to `ALLOWED_ORIGINS` in `.env`.

## License

MIT License - feel free to modify and use for your projects.
