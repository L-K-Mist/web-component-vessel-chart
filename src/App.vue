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
      <div
        id="map-container"
        ref="mapContainer"
        :style="`height: ${mapHeight}px`"
      ></div>
    </div>
    <trs-date-incrementor v-model="trsDate"></trs-date-incrementor>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed, watch } from "vue";

// import SMap from "@/BorrowedFromBaseplate/SMap.vue";
// import HelloWorld from "./components/HelloWorld.vue";
import { useStorage } from "@vueuse/core";

// TODO We need to try some minimal level of debouncing,
// Not too much, that's what the cache is for,
// but some. Start with numbers like 30ms to 100ms.
import { getAll, putTile, destroy } from "@/api/api-pouch";
// import { useThrottle } from "@vueuse/core";
import TrsDateIncrementor from "@/components/TrsDateIncrementor.vue";
import { useMap } from "@/composables/WeatherMap";
import { useTileCache } from "@/composables/TileCache";

export default defineComponent({
  name: "App",
  components: {
    TrsDateIncrementor,
  },
  setup() {
    const mapContainer = ref(null);
    const mapHeight = ref(700);

    const myMap = useMap(mapContainer);

    // So myMap goes in as an input to useFuction,
    // which extends the existing map with
    // setTileLoadFunction.
    const myTileCache = useTileCache(myMap);
    const { deleteCache, logCache } = myTileCache;

    return {
      mapContainer,
      mapHeight,
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
