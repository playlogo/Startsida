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

- [ ] Mobile friendly
- [ ] Works offline - Use internet only to update
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

Frontend:

- [ ] Groups!
- [ ] Wallpapers!
- [ ] Improve Icon component

- [ ] Mobile padding margin etc support
- [ ] Offline caching of assets
- [ ] Status display with git commit

## V3 Target features

Both:

- [ ] User-Tracking via mongoDB
- [ ] Authentication new clients via one-time token printed to terminal
