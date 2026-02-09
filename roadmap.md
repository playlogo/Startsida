# Roadmap

## V1 Target features - Reached 01.01.2025

Backend:

- [x] Serve bookmarks
  - [x] Download and serve icons
- [x] Serve frontend
- [x] Ethernet wake for clients
- [x] Terminal: Script execution

Frontend:

- [x] Mobile friendly
- [x] Works offline - Use internet only to update - Service workers!
- [ ] Groups:
  - [ ] Shows bookmarks with icons and text
  - [ ] Shows actions (ethernet wake, script execution) with icons
- [x] Icons look like from a apple app

## V2 Target features - Reached 05.01.2025

Backend:

- [x] Ping endpoint
- [x] Shortcut support
- [x] BumbleCore
- [x] Plugin system
- [x] Custom icons for bookmarks
- [x] Try to fix none loading bookmarks on later start, ~~maybe~~ schedule with Deno.cron
- [x] Wallpapers!
- [x] Fixes

Frontend:

- [x] Wallpapers!
- [x] Improve Icon component

- [x] Mobile padding margin etc support
- [x] Offline caching of assets
- [x] Status display with git commit

- [x] Module icons

## V3 Target features - Reached 06.02.2025

- [x] Resize background images
- [x] Improve page load experience (black body/meta background maybe)
- [x] Grid! Somehow feel good when resizing

## V4 Target features

- [ ] Edit bookmarks (only bookmarks!) from UI (add new ones, change group, change name) -> Rewrite config!
- [ ] Groups!
- [ ] Groups: Row / Grid Setting, "grid" snapping position

- [ ] User-Tracking via mongoDB
- [ ] Authentication new clients via one-time token printed to terminal
- [x] Search bar via ~~F1 to find bookmarks~~ just typing in the browser tab & enter to goto!
  - [x] Possible improvements: Animation when clicking, loading animation for endpoints, signal that there's only one
