# NANTI ♡ — Our Memories, Calendar, Map, Photos

Branch: `feature/date-memories-mood-drive-links`  
Prepared for: React/Vite on Cloudflare Pages + Supabase project `nanti.`.

## Feature status

| Feature | Status |
| --- | --- |
| Date Memories CRUD, emoji moods and stories | Implemented |
| Our Memories: Gallery / Calendar | Implemented |
| Our Map with Visited/Wishlist filters | Implemented. Coordinates are entered in Edit Place |
| TikTok place cover | Best-effort via authenticated `place-preview` Supabase Edge Function |
| Instagram/Threads cover | Not guaranteed; fallback to manually entered HTTPS image URL |
| Cute page transition, hover, mood effects | Implemented; respects Reduced Motion |
| Upload photos from NANTI to Google Drive | Client-side OAuth implementation ready; **requires Google OAuth setup below** |
| Show Drive photo thumbnails inside NANTI | Requires both accounts to connect Google Drive |
| Supabase file storage for images | **Not used** — photo bytes go to Google Drive |

## Database

Migrations added:
- `supabase/migrations/20261104_date_memories.sql` (already run previously).
- `supabase/migrations/20261104_nanti_visuals_drive.sql` (adds `places.cover_url`, `latitude`, `longitude`, `profiles.google_drive_email`, `memory_photos`; applied using connected Supabase project).
- `supabase/migrations/20261104_secure_rpc_privileges.sql` (narrows anonymous EXECUTE permissions).

**Do not run these again if already applied.** No original table has been dropped. `memory_photos` stores private Drive file IDs and metadata, not image bytes.

## One-time Google Cloud configuration (required for real photo uploads)

The existing Google Drive connection in **ChatGPT** does not automatically authorize the deployed NANTI website. Set up Google OAuth for NANTI in Google Cloud Console:

1. Choose or create a Google Cloud project.
2. Enable **Google Drive API**.
3. Under **Google Auth Platform**, configure the app name, support email and OAuth consent. Use External/Testing for a personal app and add the **two Google account emails** to Test users.
4. Create OAuth client ID of type **Web application**.
5. Add these **Authorized JavaScript origins** as needed:
   - `https://nanti.pages.dev`
   - `https://feature-date-memories-mood-d.nanti.pages.dev` (branch preview, if testing)
   - `http://localhost:5173` (optional local development)
6. Copy the **OAuth Client ID** (ends in `.apps.googleusercontent.com`). It is a public browser identifier; do **not** copy a client secret.
7. In Cloudflare Pages project `nanti` → Settings → Environment variables, configure:
   `VITE_GOOGLE_CLIENT_ID=<YOUR_WEB_OAUTH_CLIENT_ID>`.
   Set it for Production and Preview if you use both, then redeploy.
8. Login to NANTI as each member on their own device, open Our Memories, and click **Connect Google Drive**.
9. Once both Google emails appear on partner profiles, **Add a memory**, then **Add photos** on its card. NANTI saves photo bytes to each uploader's Drive `NANTI Memories` folder, shares each photo privately with the partner's Google account, and stores the Drive file ID in Supabase.

Browser OAuth access tokens are ephemeral and never persisted in Supabase, GitHub or localStorage. To open thumbnails after a refresh or token expiry, reconnect Google Drive. **Do not configure a service account private key, OAuth client secret, or refresh token in `VITE_...` variables.**

Google OAuth uses `drive.file` and `userinfo.email`, not full Drive access. Depending on Google's consent-screen status and test-user rules, connected accounts may need to grant access again. Google Drive itself has API, sharing, and free storage limits. If an account cannot read an image in NANTI, use its **View in Drive** link and check that Google's sharing permissions include the other account.

## Daily usage

- **Our Places:** paste TikTok / Instagram / Threads / Google Maps link. TikTok previews are best effort; cover URL may expire. Optionally provide an HTTPS cover URL manually. For Our Map, enter both latitude and longitude for the exact location under Edit Place.
- **Our Memories:** add a memory with date, mood (no stars), story, optional wishlist place. After saving, add up to five photos from iPhone/iPad directly within NANTI. Their bytes stay in Google Drive.
- **Gallery / Calendar:** switch between a photo memory view and a monthly calendar with mood stickers. Click a marked date to jump to a memory.
- **Our Map:** filter Visited, Wishlist, or All Places. Click a map pin to see related memories.

## Important limitations

- Photos do not appear until Google OAuth is properly configured and the user connects the account.
- Instagram does not reliably provide direct Reel thumbnails via the public API. No credentials are bundled for scraping, and private content is never scraped.
- Google Drive is a file store, not a public image CDN. Private photo thumbnails require an OAuth token from an authorized Google account.
- Memories deletion removes metadata from Supabase, but does not delete the underlying files from Drive.
- Our Map uses Leaflet and OpenStreetMap tiles through a third-party provider with usage limitations. Treat it as a personal-use prototype.
- Map coordinates are manual for now; the app does **not** continuously track phone GPS.
- Cloudflare preview build success is not equivalent to testing with both personal accounts; test from both devices before considering the release fully verified.
