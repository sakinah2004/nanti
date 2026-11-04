# NANTI ♡ — Simpler everyday flow

## Just two actions

**1. Save to NANTI**
- Find a place on Instagram, TikTok, or Google Maps.
- Paste its link (or open NANTI using the existing `?save=` share workflow).
- Tap **Save to NANTI ♡**.
- All other inputs are optional. TikTok cover/title and map coordinates are detected when source metadata allows.

**2. We've Been Here**
- Find the place in **Our Places**.
- Tap **We've Been Here**.
- NANTI marks the place visited and fills the memory's place and date automatically.
- Choose a mood. Optionally choose photos and add a story.
- Tap **Save Memory ♡**.
- Memory then appears in Gallery and Calendar. Map shows places with known coordinates.

### Privacy and photo limitations
- Original photo bytes are **never stored in Supabase Storage**.
- Direct-from-form photo upload works only after Google OAuth is configured for the website and both people have connected their Google accounts. The OAuth Client ID isn't available from ChatGPT's Google Drive connection.
- Each photo gets uploaded to the uploader's Google Drive and shared privately with their partner.
- If Drive is not configured, memories can still be saved without photos.
- Locations from social videos cannot always be inferred accurately. Never invent a map pin; accept coordinates embedded in a Google Maps link or let the user deliberately set their current location while at the place.
- Instagram/TikTok covers are best-effort and may expire or be blocked by the platform.
- Share Sheet support on iPhone/iPad may require the existing Apple Shortcuts one-time setup; a website cannot silently install a shortcut.

### Verification checklist
- Save a place with only a link; duplicate URLs remain blocked.
- Save a Google Maps link containing coordinates; verify map pin appears.
- Tap **We've Been Here**; place changes to Visited and a memory opens with prefilled title/date/place.
- Save memory with only one mood; verify Gallery + Calendar.
- Tap **Add a Memory** on a previously visited place; confirm multiple memories are possible.
- With Drive OAuth configured, choose photos while creating memory; verify both users can view the images.
- Confirm previously saved places, memories, and partner accounts remain unchanged.

No new database migrations required; the app reuses the existing `places`, `memories`, and `memory_photos` structures.
