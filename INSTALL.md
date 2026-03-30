# Installation Guide for BiPin

This guide walks through deploying the SHM Instagram Widget and embedding it on strawhutmedia.com.

## Overview

Since the main site is hosted on GoDaddy with ASP.NET (which doesn't run Node.js), we'll:

1. **Deploy the widget server** to a free cloud service (Railway)
2. **Get an Instagram access token** from Facebook Developer Portal
3. **Embed the widget** on strawhutmedia.com using an iframe

---

## Part 1: Deploy the Widget Server to Railway (Free)

Railway offers free hosting for Node.js apps - perfect for this widget.

### Step 1.1: Create a Railway Account

1. Go to [railway.app](https://railway.app/)
2. Click **Login** → Sign in with GitHub
3. If you don't have GitHub, create one at github.com first

### Step 1.2: Deploy from GitHub

1. Fork or clone this repository to the Straw Hut Media GitHub account
2. In Railway dashboard, click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose the **SHM-Widget** repository
5. Railway will auto-detect it's a Node.js app and start deploying

### Step 1.3: Add Environment Variables

1. In Railway, click on your deployed service
2. Go to the **Variables** tab
3. Add these variables (click **+ New Variable** for each):

| Variable | Value |
|----------|-------|
| `INSTAGRAM_ACCESS_TOKEN` | (see Part 2 below) |
| `PORT` | `3000` |
| `POST_LIMIT` | `12` |
| `ALLOWED_ORIGINS` | `https://strawhutmedia.com,https://www.strawhutmedia.com` |
| `ADMIN_API_KEY` | (generate a random string - use https://randomkeygen.com/) |

### Step 1.4: Generate a Public URL

1. In Railway, go to **Settings** tab
2. Under **Networking**, click **Generate Domain**
3. You'll get a URL like: `shm-widget-production.up.railway.app`
4. Save this URL - you'll need it for embedding

---

## Part 2: Get Your Instagram Access Token

### Step 2.1: Create a Facebook Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Log in with the Facebook account connected to @strawhutmedia Instagram
3. Click **My Apps** → **Create App**
4. Select app type: **Consumer** (or **None**)
5. Enter app name: `SHM Instagram Widget`
6. Click **Create App**

### Step 2.2: Add Instagram Basic Display

1. In your new app's dashboard, scroll down to **Add Products**
2. Find **Instagram Basic Display** and click **Set Up**
3. Scroll to the bottom and click **Create New App** (under Instagram App ID)
4. In **Valid OAuth Redirect URIs**, enter: `https://localhost/`
5. In **Deauthorize Callback URL**, enter: `https://localhost/`
6. In **Data Deletion Request URL**, enter: `https://localhost/`
7. Click **Save Changes**

### Step 2.3: Add Instagram Test User

1. In the left sidebar, go to **App Roles** → **Roles**
2. Scroll down to **Instagram Testers**
3. Click **Add Instagram Testers**
4. Enter the Instagram username: `strawhutmedia`
5. Click **Submit**

### Step 2.4: Accept the Tester Invite on Instagram

1. Log into Instagram as @strawhutmedia
2. Go to **Settings** → **Website Permissions** → **Apps and Websites**
   - On mobile: Settings → Security → Apps and Websites
3. Click **Tester Invites**
4. Accept the invitation from your Facebook app

### Step 2.5: Generate Access Token

1. Back in Facebook Developers, go to **Instagram Basic Display** → **Basic Display**
2. Scroll down to **User Token Generator**
3. Click **Generate Token** next to the strawhutmedia user
4. Log in and authorize when prompted
5. Copy the token that appears

### Step 2.6: Convert to Long-Lived Token (IMPORTANT!)

The token from Step 2.5 expires in 1 hour. Convert it to a 60-day token:

1. Go to your Facebook App → **Settings** → **Basic**
2. Copy your **App Secret** (click Show, enter password)
3. Open terminal or use an online tool like [reqbin.com](https://reqbin.com/)
4. Make this request (replace the placeholders):

```
GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=YOUR_SHORT_TOKEN
```

5. Copy the `access_token` from the response - this is your long-lived token
6. Add this token to Railway as `INSTAGRAM_ACCESS_TOKEN`

### Token Refresh Reminder

The long-lived token expires after 60 days. Set a calendar reminder to refresh it monthly:

```
GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=YOUR_LONG_LIVED_TOKEN
```

---

## Part 3: Embed on strawhutmedia.com

Once your Railway app is running, embed the widget on the website.

### Option A: Simple Iframe (Recommended)

Add this HTML where you want the Instagram feed to appear (likely in the footer):

```html
<iframe
  src="https://YOUR-RAILWAY-URL.up.railway.app/embed"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; max-width: 1200px; margin: 0 auto; display: block;"
  title="Straw Hut Media Instagram Feed"
  loading="lazy">
</iframe>
```

Replace `YOUR-RAILWAY-URL` with your actual Railway domain.

### Option B: JavaScript Embed (More Control)

For more customization, add this to the page:

```html
<!-- Instagram Widget Styles -->
<link rel="stylesheet" href="https://YOUR-RAILWAY-URL.up.railway.app/widget/widget.css">

<!-- Widget Container -->
<div id="shm-instagram-feed"></div>

<!-- Instagram Widget Script -->
<script src="https://YOUR-RAILWAY-URL.up.railway.app/widget/widget.js"></script>
<script>
  SHMInstagramWidget.init({
    container: '#shm-instagram-feed',
    apiUrl: 'https://YOUR-RAILWAY-URL.up.railway.app/api/posts',
    postLimit: 12,
    showHeader: true,
    showFollowButton: true,
    darkMode: false
  });
</script>
```

---

## Part 4: Verify It's Working

1. **Check the API**: Visit `https://YOUR-RAILWAY-URL.up.railway.app/api/health`
   - Should show: `{"status":"ok","lastUpdated":"...","postCount":12}`

2. **Check the embed**: Visit `https://YOUR-RAILWAY-URL.up.railway.app/embed`
   - Should show the Instagram grid with recent posts

3. **Check the website**: Visit strawhutmedia.com and confirm the feed appears in the footer

---

## Troubleshooting

### "Unable to load Instagram feed"
- Check Railway logs for errors
- Verify `INSTAGRAM_ACCESS_TOKEN` is set correctly
- Make sure the token hasn't expired

### Widget shows but no images
- Instagram token may be invalid or expired
- Check Railway logs: click on deployment → View Logs

### CORS errors in browser console
- Make sure `ALLOWED_ORIGINS` includes both `https://strawhutmedia.com` and `https://www.strawhutmedia.com`

### Posts not updating
- The feed refreshes automatically every hour
- To force refresh: `POST https://YOUR-RAILWAY-URL.up.railway.app/api/refresh` with header `X-API-Key: your_admin_key`

---

## Summary Checklist

- [ ] Railway account created
- [ ] Repository deployed to Railway
- [ ] Facebook Developer app created
- [ ] Instagram Basic Display API added
- [ ] @strawhutmedia added as tester and invite accepted
- [ ] Access token generated and converted to long-lived
- [ ] Environment variables added to Railway
- [ ] Railway app has public URL
- [ ] Widget embedded on strawhutmedia.com
- [ ] Calendar reminder set to refresh token in 50 days

---

## Questions?

If you run into issues, check the Railway logs first - they usually show exactly what's wrong. The most common issue is an expired or invalid Instagram token.
