import { ref, onMounted, watch, computed } from "vue";
import { getAll, putTile, destroy } from "@/api/api-pouch";

export function useTileCache(olMap) {
  let sources = [];
  onMounted(() => {
    olMap.value.getLayers().forEach((layer) => {
      const source = layer.getSource();
      if (!source) return;
      console.log("dvdb - .forEach - layer", layer);
      source.setTileLoadFunction(onTileLoad);
      sources.push(source);
    });
    initialiseCache();
    getAll();
  });
  const cacheVersion = 1;
  const cacheName = `map-terrain-${cacheVersion}`;
  const cache = ref();

  async function initialiseCache() {
    cache.value = await caches.open(cacheName);
    const cacheAvailable = "caches" in window;
    if (cacheAvailable) {
      console.log("dvdb - existing cache found", cache.value);
    }

    const estimate = await navigator.storage.estimate();
    console.log(
      "dvdb - estimated total space MB",
      estimate.quota ? estimate.quota / 1000000 : "can't say"
    );
    console.log(
      "dvdb - estimate.usage MB",
      estimate.usage ? estimate.usage / 1000000 : "can't say"
    );
  }
  async function deleteCache() {
    const deleteSuccess = await caches.delete(cacheName);
    destroy();
    console.log("dvdb - deleteCache - deleteSuccess", deleteSuccess);
  }

  async function logCache() {
    await cache.value.matchAll("map-tile-index/");
    findImages();
  }

  async function findImages() {
    // Get a list of all of the caches for this origin
    const cacheNames = await cache.value.keys();
    console.log("dvdb - findImages - cacheNames", cacheNames);
    const result = [];

    for (const name of cacheNames) {
      // Open the cache
      const cache = await caches.open(name);

      // Get a list of entries. Each item is a Request object
      for (const request of await cache.keys()) {
        // If the request URL matches, add the response to the result
        if (request.url.endsWith(".png")) {
          result.push(await cache.match(request));
        }
      }
    }

    return result;
  }

  async function displayTileFromCache(tile, response) {
    const newBlob = await response.blob();
    // eslint-disable-next-line no-param-reassign
    tile.getImage().src = window.URL.createObjectURL(newBlob);
  }

  async function onTileLoad(tile, url) {
    if (cache.value) {
      // The Cache API is supported
      try {
        const cacheResponse = await cache.value.match(url);

        if (cacheResponse) {
          console.log("used local cache");
          displayTileFromCache(tile, cacheResponse);
          putTile({
            id: url,
            lastUsed: +new Date(),
          });
        } else {
          console.log("fetching, caching and loading");
          await cache.value.add(url);
          const newResponse = await cache.value.match(url);
          if (!newResponse) {
            tile.getImage().src = url;
            throw new Error(
              "something went wrong but fetching image online instead"
            );
          }

          displayTileFromCache(tile, newResponse);
          // TODO Pull this out to pouch focussed section. Just emit here
          putTile({
            id: url,
            firstFetched: +new Date(),
            lastUsed: +new Date(),
          });
        }
      } catch (error) {
        console.error({ error });
      }
    } else {
      console.log("fetched online no cache available");
      // We must reassign, that's how OpenLayers does it.
      // eslint-disable-next-line no-param-reassign
      tile.getImage().src = url;
    }
  }

  return {
    deleteCache,
    logCache,
  };
}
