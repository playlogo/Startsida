/* Constants */
const API_HOST = (self.location.port !== "4173" && self.location.port !== "5173") ? "" : "http://192.168.178.61:8000"

/* Data */
/** @type {GitInfo} */
let gitInfo;

async function loadGitInfo() {
    if (gitInfo === undefined) {
        const cache = await caches.open('key-value-cache');
        const response = await cache.match(new Request("gitInfo"));

        if (response) {
            gitInfo = await response.json();
        }
    }
}

/* Installing & Cache population */
async function initCache() {
    // Request manifest to get current version
    let manifest;
    try {
        manifest = await (await fetch(`/.vite/manifest.json`)).json()
    } catch (err) {
        console.error(`[sw] Unable to load manifest, likely offline: ${err}`)
        return;
    }

    // Get git information
    gitInfo = manifest.gitInfo;

    // Find and delete older caches
    let cacheExists = false;

    const currentCache = `cache-v${gitInfo.commitCount}`
    const legacyCaches = await caches.keys()

    for (const legacyCache of legacyCaches) {
        if (legacyCache === currentCache) {
            cacheExists = true;
            continue;
        }

        if (legacyCache === "key-value-cache") {
            continue;
        }

        const res = await caches.delete(legacyCache);

        if (!res) {
            console.error(`[sw] Unable to delete cache ${legacyCache}`)
        }
    }

    // Create new cache if necessary
    if (cacheExists) {
        return;
    }

    const cache = await caches.open(currentCache);

    // Add all resource from manifest.json
    await cache.addAll([manifest["index.html"]["file"], ...manifest["index.html"]["css"]]);
    console.log(`[sw] Cache populated with resources from manifest`)

    // Store manifest
    const key_value_cache = await caches.open('key-value-cache');
    await key_value_cache.put(new Request("gitInfo"), new Response(JSON.stringify(gitInfo)));

    // Add all wallpapers
    try {
        // Index file
        const reqWallpaper = await fetch(`${API_HOST}/wallpapers/`);
        await cache.add(reqWallpaper)

        // Individual wallpapers
        let wallpapers = await (reqWallpaper.clone()).json();
        wallpapers = wallpapers.map((entry) => `${API_HOST}/wallpapers/${entry}`)
        await cache.addAll(wallpapers);

        // TODO: Cache & Index file don't update when new wallpapers added
        console.log(`[sw] Cache populated with ${wallpapers.length} wallpapers`)
    } catch (err) {
        console.error(`[sw] Unable to cache wallpapers: ${err}`)
    }

    // Add static resources
    await cache.addAll([
        "/favicon.ico",
        "/favicon.png",
        "/favicon.svg",
        "/index.html",
    ]);
}

self.addEventListener("install", (event) => {
    console.log("[sw] Installing...");
    event.waitUntil(initCache());
    self.skipWaiting()
    console.log("[sw] Installing: Done");
});

/* Activation */
self.addEventListener('activate', function (event) {
    console.log('[sw] Forcing activation');
    return self.clients.claim();
});


/* Fetch caching */
const fetchHandlerOneTimeCache = async (request) => {
    // Ensure gitInfo is loaded
    await loadGitInfo();

    const responseFromCache = await caches.match(request);

    if (responseFromCache) {
        return responseFromCache;
    }

    let responseFromNetwork;
    try {
        responseFromNetwork = await fetch(request);
    } catch (err) {
        console.error(`[sw] Unable to fetch resource: ${err}`)
        return responseFromNetwork;
    }

    // Store in cache
    const cache = await caches.open(`cache-v${gitInfo.commitCount}`);
    cache.put(request, responseFromNetwork.clone());

    return responseFromNetwork;
};

const fetchHandlerCacheFirst = async (request) => {
    // Ensure gitInfo is loaded
    await loadGitInfo();

    const responseFromCache = await caches.match(request);

    // Fetch from network and update cache
    const fetchAndUpdateCache = async () => {
        let responseFromNetwork;
        try {
            responseFromNetwork = await fetch(request);
            const cache = await caches.open(`cache-v${gitInfo.commitCount}`);
            cache.put(request, responseFromNetwork.clone());
        } catch (err) {
            console.error(`[sw] Unable to fetch resource: ${err}`);
        }
        return responseFromNetwork;
    };

    // Return cached response if available, otherwise wait for network
    if (responseFromCache) {
        fetchAndUpdateCache(); // Update cache in the background
        return responseFromCache;
    } else {
        return await fetchAndUpdateCache();
    }
};

const fetchHandlerInternal = async (request) => {
    // Try to use internal
    if (gitInfo !== undefined) {
        return new Response(JSON.stringify(gitInfo))
    }

    // If not load it from cache
    const cache = await caches.open('key-value-cache');
    const response = await cache.match(new Request("gitInfo"));

    if (response) {
        return response;
    } else {
        console.error(`[sw] Unable to fetch gitInfo`)
    }
}

self.addEventListener("fetch", (event) => {
    // Ignore extension requests
    if (!event.request.url.startsWith("http")) {
        return
    }

    // Ignore any other request than post
    if (event.request.method !== "GET") {
        return
    }

    // Handle request
    const url = new URL(event.request.url);

    // Main -> SW Communication
    if (url.pathname === "/gitInfo") {
        event.respondWith(fetchHandlerInternal(event.request))
        return;
    }

    // Own API responses: use and update cache
    if (url.pathname.endsWith("/entries") || url.pathname.endsWith("/wallpapers/")) {
        event.respondWith(fetchHandlerCacheFirst(event.request))
        return;
    }

    // Other resources: use one time cache
    event.respondWith(fetchHandlerOneTimeCache(event.request));
});

/* Types */
/**
 * @typedef GitInfo
 * @type {object}
 * @property {string} commitCount - Count of total commits
 * @property {string} commitHash - Hash of current commit
 */