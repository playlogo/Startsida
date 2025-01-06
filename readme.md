# Startsida

Custom cross device browser start page

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

## V2 Target features

Backend - Done 05.01.2025:

- [x] Ping endpoint
- [x] Shortcut support
- [x] BumbleCore
- [x] Plugin system
- [x] Custom icons for bookmarks
- [x] Try to fix none loading bookmarks on later start, ~~maybe~~ schedule with Deno.cron
- [x] Wallpapers!
- [x] Fixes

Frontend:

- [ ] Groups!
- [x] Wallpapers!
- [x] Improve Icon component

- [x] Mobile padding margin etc support
- [x] Offline caching of assets
- [x] Status display with git commit

- [x] Module icons

ToDos:

- [x] Mobile fixes, gitInfo fix
- [x] Background image fade in
- [ ] Come up with way to display groups

## V3 Target features

Both:

- [ ] User-Tracking via mongoDB
- [ ] Authentication new clients via one-time token printed to terminal
