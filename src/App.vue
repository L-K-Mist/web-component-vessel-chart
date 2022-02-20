<template>
  <div class="h-screen w-screen grid place-items-center">
    <div class="map-card bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
      <div
        class="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap"
      >
        <div class="ml-4 mt-2">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Example Open Layers VUE 3 TS App
          </h3>
        </div>
        <div class="ml-4 mt-2 flex-shrink-0">
          <button
            type="button"
            HEAD
            class="relative inline-flex items-center px-4 mb-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            @click="deleteCache"
          >
            Delete Cache and Index of Cache
          </button>
        </div>
      </div>
      <ol-map
        ref="map"
        :loadTilesWhileAnimating="true"
        :loadTilesWhileInteracting="true"
        :style="`height: ${mapHeight}px`"
      >
        <ol-view
          ref="view"
          :center="center"
          :rotation="rotation"
          :zoom="zoom"
          :projection="projection"
        />

        <ol-tile-layer>
          <ol-source-xyz
            ref="source"
            url="https://cs.stratumfive.com/tile/256/{z}/{y}/{x}/png?layers=cmap"
          />
        </ol-tile-layer>
        <!-- <ol-tile-layer :opacity="0.3">
          <ol-source-xyz
            ref="weatherSource"
            url="https://cs.stratumfive.com/tile/256/{z}/{y}/{x}/png?layers=bg:000;land:021;density:_all:2021-01"
          />
        </ol-tile-layer> -->
      </ol-map>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";

import { OlMap } from "vue3-openlayers";
import "vue3-openlayers/dist/vue3-openlayers.css";
// import SMap from "@/BorrowedFromBaseplate/SMap.vue";
// import HelloWorld from "./components/HelloWorld.vue";
import { useStorage } from "@vueuse/core";

// TODO We need to try some minimal level of debouncing,
// Not too much, that's what the cache is for,
// but some. Start with numbers like 30ms to 100ms.
import { getAll, putTile, destroy } from "@/api/api-pouch";
import { useThrottle } from "@vueuse/core";

export default defineComponent({
  name: "App",
  components: {
    OlMap,
  },
  setup() {
    const center = ref([40, 40]);
    const projection = ref("EPSG:4326");
    const zoom = ref(8);
    const rotation = ref(0);
    const source = ref(null);
    const weatherSource = ref(null);
    const mapHeight = ref(700);
    // const vesselMap = ref(null);

    onMounted(() => {
      source.value.source.tileLoadFunction = tileLoadFunctionTerrain;
      // weatherSource.value.source.tileLoadFunction = tileLoadFunctionWeather;
      console.log("dvdb - onMounted - source", source.value);
    });

    // CACHING
    onMounted(() => {
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
        console.log("dvdb - initialiseCache - cache.value", cache.value);
      }

      const estimate = await navigator.storage.estimate();
      console.log(
        "dvdb - estimated total space MB",
        estimate.quota ? estimate.quota / 1000000 : "can't say"
      );
      console.log(
        "dvdb - estimate - estimate.usage MB",
        estimate.usage ? estimate.usage / 1000000 : "can't say"
      );
    }

    function tileLoadFunctionTerrain(tile, url) {
      onTileLoad(tile, url);
      // tile.getImage().src = src;
    }
    // Tile Loading Starts
    // const input = ref("");

    // function debouncedTileLoadFunctionTerrain(tile, src) {
    //   return useThrottle(
    //     ref(() => {
    //       console.log("dvdb - returnuseThrottle - useThrottle");
    //       tileLoadFunctionTerrain(tile, src);
    //     }),
    //     5000
    //   );
    // }
    // const updated = ref(0);
    // watch(debounced, () => (updated.value += 1));

    function tileLoadFunctionWeather(tile, url) {
      onTileLoad(tile, url);
      // tile.getImage().src = url;
    }
    // function sleep(ms) {
    //   new Promise((resolve) => setTimeout(resolve, ms));
    // }
    async function deleteCache() {
      const deleteSuccess = await caches.delete(cacheName);
      destroy();
      console.log("dvdb - deleteCache - deleteSuccess", deleteSuccess);
    }

    async function logCache() {
      const response = await cache.value.matchAll("map-tile-index/");
      console.log("dvdb - logCache - response", response);
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
        // eslint-disable-next-line no-param-reassign
        tile.getImage().src = url;
      }
    }

    return {
      center,
      projection,
      zoom,
      rotation,
      source,
      weatherSource,
      mapHeight,
      tileLoadFunctionWeather,
      deleteCache,
      logCache,
    };
  },
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.map-card {
  width: 80%;
  max-width: 1500px;
  border: 2px dotted blue;
}
</style>
