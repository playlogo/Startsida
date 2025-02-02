# Startsida

A modern, customizable browser startpage that works offline and synchronizes across devices. Perfect when you use lot's of awesome self hosted software across many devices.

![Banner](https://raw.githubusercontent.com/playlogo/Startsida/main/docs/banner.png)

## Features

✨ **Core Features**

- **Offline support**: Full functional clients even without an internet connection
- **Auto-Sync**: Clients automatically update when online
- **Easy Configuration**: Everything is configured via simple JSON files on the server
- **Custom Wallpapers**: Simply place them under the `wallpapers` folder and restart the server
- **Easy deployment**: [Just start one docker container](#tutorial)

🚀 **Advanced features using `modules`**

- **Shortcuts**: Execute shell commands on the server
- **Wake-on-LAN**: Turn on your PCs remotely
- **Smart-Home**: Activate scenes from your *bumbleCore* Smarthome (Home-Assistant support coming soon tm)

🕑 **Planed features**

- **Groups**: Organize your bookmarks and more using groups
- **Authentication**: Simple one-time authentication for  new devices

## Tutorial

Server installation:

1. Clone this repo: `git clone https://github.com/playlogo/Startsida.git`

Optional: Setup automatic git synchronization of your bookmarks: Create and edit `data/config.toml`:

```toml
[repo]
url = "" # Git clone URL to your repo, can be empty if git repo already cloned
branch = "main" # Remote main branch
interval = 5 # Fetch interval in minutes
```

2. Start the docker container: `sudo docker compose up -d --build`
3. Startsida is now running on: `http://your-ip:8000/`
Optional: Use a reverse proxy like Nginx to add SSL

Configuration:

1. Edit the JSON config files inside `data/`
(Tip: Use an editor with JSON support like VSCode for autocomplete!)
2. Restart the server

Browser Setup:

- **Firefox**: [How to set the homepage | Mozilla Support](https://support.mozilla.org/en-US/kb/how-to-set-the-home-page)
- **Chrome/Brave/Opera**: [Choose your homepage | Google Help](https://support.google.com/chrome/answer/95314#:~:text=Choose%20your%20homepage)
- **iOS Safari**: [Use this awesome extension | Github](https://github.com/infinitepower18/Homepage-MobileSafari)
