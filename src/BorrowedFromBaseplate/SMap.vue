<template>
  <article class="s-o-map">
    <div
      ref="map-container"
      class="map-container"
    />

    <slot
      v-if="ready"
    />

    <div class="s-o-map__info">
      <div
        v-if="showCoordinates"
        class="s-o-map__lat-lng white--text px-2 py-1"
      >
        {{ mouseCoords.lat | latitude }} - {{ mouseCoords.lon | longitude }}
      </div>
    </div>

    <!-- @slot
      Slot for adding in custom zoom controls. Props:

      zoomIn: Function that will zoom in the map

      zoomOut: Function that will zoom out the map

      zoomDisabled: If the zoom button should be disabled
    -->
    <slot
      v-if="showZoom"
      name="zoom-controls"
      :zoom-in="zoomIn"
      :zoom-out="zoomOut"
      :reset-zoom="resetZoom"
      :zoom-disabled="zoomDisabled"
    >
      <zoom-controls
        :zoom-in="zoomIn"
        :zoom-out="zoomOut"
        :reset-zoom="resetZoom"
        :zoom-in-disabled="zoomDisabled"
        :zoom-out-disabled="zoomDisabled"
        :show-reset-zoom="currentZoomLevel !== initialZoom"
      />
    </slot>

    <s-circular-loader
      v-if="loading"
      class="loading-spinner"
      color="primary"
      :size="20"
      indeterminate
      :style="{
        left: `${loadingSpinnerOffset.x}px`,
        top: `${loadingSpinnerOffset.y}px`,
      }"
    />
  </article>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import throttle from 'lodash/throttle';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { toLonLat, fromLonLat } from 'ol/proj';
import { getBottomRight } from 'ol/extent';
import { defaults as defaultInteractions } from 'ol/interaction';
/* eslint-disable import/no-unresolved */
import { Map as MapInterface, Extent } from 'openlayers';
/* eslint-enable import/no-unresolved */
import { latitude, longitude } from '@stratumfive/ui-baseplate/src/filters/latLong';
import SCircularLoader from '@stratumfive/ui-baseplate/src/components/SCircularLoader/SCircularLoader.vue';
import MapStyles, { CMapOption } from './MapStyles';
import ZoomControls from './ZoomControls.vue';
import { LatLon, MapStyle } from './SMap.interface';

interface Vector2D {
  x: number;
  y: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface MapProvider {
  map: MapInterface;
  dimensions: () => Dimensions | null;
  extent: () => Extent;
  cartoServerUrl: () => string;
  currentZoomLevel: () => number;
}

export default Vue.extend({
  name: 'SMap',

  components: {
    ZoomControls,
    SCircularLoader,
  },

  filters: {
    latitude,
    longitude,
  },

  props: {
    cartoServerUrl: {
      required: false,
      type: String,
      default: 'https://cs.stratumfive.com',
    },

    /**
     * An array of CMap image tile options,
     * toggles different CMap features on/off in cartoserver image
     */
    cMapOptions: {
      type: Array,
      required: false,
      default: (): any[] => [],
    } as PropOptions<CMapOption[]>,

    /**
     * Higher numbers are more zoomed in
     */
    initialZoom: {
      required: false,
      type: Number,
      default: 0,
    },

    /**
     * Show an indeterminate loading spinner
     */
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },

    loadingSpinnerOffset: {
      type: Object,
      required: false,
      default: (): Vector2D => ({
        x: 0,
        y: 0,
      }),
    } as PropOptions<Vector2D>,

    location: {
      type: Object,
      required: false,
      default: (): LatLon => ({
        lat: 0,
        lon: 0,
      }),
    } as PropOptions<LatLon>,

    mapStyle: {
      required: false,
      type: String,
      default: 'openStreetMap',
    } as PropOptions<MapStyle>,

    scrollToZoom: {
      type: Boolean,
      required: false,
      default: true,
    },

    showCoordinates: {
      required: false,
      type: Boolean,
      default: true,
    },

    showZoom: {
      type: Boolean,
      required: false,
      default: true,
    },

    zoomDisabled: {
      required: false,
      type: Boolean,
      default: false,
    },
  },

  inject: {
    mapProvider: {
      default() {
        return {
          map: null,
          dimensions: () => this.dimensions,
          extent: () => this.extent,
          cartoServerUrl: () => this.cartoServerUrl,
          currentZoomLevel: () => this.currentZoomLevel,
        };
      },
    },
  },

  data(): any {
    return {
      currentZoomLevel: this.initialZoom,
      mouseCoords: {},
      extent: null,
      dimensions: null,
      // share cache where needed in component
      cache: null,
      cacheName: null,
      tileLayer: null,
    };
  },

  computed: {
    ready(): boolean {
      return (this.extent && this.dimensions);
    },

    /**
     * returns the map tile URL based on the mapStyle prop
     */
    mapUrl(): string {
      const { url } = MapStyles({ cartoServerURL: this.cartoServerUrl })[this.mapStyle];

      // Add the CMap options
      if (this.cMapOptions.length && (this.mapStyle === 'cmap' || this.mapStyle === 'cmapTerrain')) {
        const options = this.cMapOptions.map((option: CMapOption) => `${option.cmapId}:${option.value}`);
        return `${url}&cmapparams=${options.join(';')}`;
      }

      return url;
    },
  },

  provide(): any {
    return {
      // A function so that it's reactive
      // See https://github.com/vuejs/vue/issues/7017#issuecomment-480906691
      mapProvider: () => this.mapProvider as MapProvider,
      cartoServerUrl: () => this.cartoServerUrl,
    };
  },

  watch: {
    mapUrl(newUrl, oldUrl) {
      if (newUrl !== oldUrl) {
        this.tileLayer.setSource(new XYZ({ url: this.mapUrl }));
      }
    },

    initialZoom(newVal) {
      const view = (this.mapProvider as MapProvider).map.getView();
      view.setZoom(newVal);
    },

    location(newVal: LatLon) {
      const view = (this.mapProvider as MapProvider).map.getView();
      const newLocation = fromLonLat([newVal.lon, newVal.lat]);

      view.setCenter(newLocation as [number, number]);
    },
  },

  async created() {
    this.updateMouseCoords = throttle(this.updateMouseCoords, 200);

    // Listen for children emitting 'changeCursor'
    this.$on('changeCursor', this.changeCursor);

    this.initialiseCache();
  },

  mounted() {
    this.source = new XYZ({
      // Hardcoded use of cartoserver for terrain,
      // because cors issues with existing cmap provider with this approach.
      url: 'https://cs.stratumfive.com/tile/256/{z}/{y}/{x}/png?layers=cmap',
      tileLoadFunction: this.onTileLoad,
    });

    this.tileLayer = new TileLayer({
      source: this.source,
      // TODO potentially delete - was attempt to fix cors issue with cmap server.
      tileOptions: { crossOriginKeyword: 'anonymous' },
    });

    const { lat, lon } = this.location as LatLon;

    const map = new Map({
      target: this.$refs['map-container'],
      layers: [
        this.tileLayer,
      ],
      view: new View({
        center: fromLonLat([lon, lat]),
        zoom: this.initialZoom,
      }),
      interactions: defaultInteractions({
        mouseWheelZoom: this.scrollToZoom,
      }),
      controls: [],
    });

    this.mapProvider.map = map;

    // Set up listeners
    map.on('pointermove', this.updateMouseCoords);
    map.on('moveend', this.setExtentZoomAndDimensions);

    // Setup complete ready to rock and roll 🎸
    this.$nextTick(() => {
      setTimeout(() => {
        this.$emit('ready', { map });
      }, 200);
    });
  },

  beforeDestroy() {
    this.mapProvider.map.un('moveend', this.setExtentZoomAndDimensions);
    this.mapProvider.map.un('pointermove', this.updateMouseCoords);
    this.mapProvider.map.setTarget(null);
  },

  methods: {
    zoomIn() {
      this.changeZoom(1);
    },

    zoomOut() {
      this.changeZoom(-1);
    },

    changeZoom(value) {
      const view = this.mapProvider.map.getView();
      const newZoom = view.getZoom() + value;
      view.setZoom(newZoom);
    },

    resetZoom() {
      const view = this.mapProvider.map.getView();
      view.setZoom(this.initialZoom);
    },

    /**
     * Fires on map 'move end' event, that includes dragging and zooming
     */
    setExtentZoomAndDimensions() {
      const { map } = this.mapProvider as MapProvider;
      const view = map.getView();

      /**
       * Map Size
       */
      this.extent = view.calculateExtent();
      const bottomRightCoords = getBottomRight(this.extent);

      const bottomRightPixelCoords = map.getPixelFromCoordinate(
        bottomRightCoords as [number, number],
      );

      if (bottomRightPixelCoords) {
        const [width, height] = bottomRightPixelCoords;
        this.dimensions = {
          width: Math.round(width),
          height: Math.round(height),
        };
      }

      /**
       * Map Position (lat/lon)
       */
      const newPosition = view.getCenter();
      const [lon, lat] = toLonLat(newPosition);
      this.$emit('update:location', { lat, lon });

      /**
       * Map Zoom
       */
      const newZoom = view.getZoom();
      this.currentZoomLevel = newZoom;
      this.$emit('update:initialZoom', newZoom);
    },

    updateMouseCoords(ev) {
      const [lon, lat] = toLonLat(ev.coordinate);
      this.mouseCoords = {
        lat,
        lon,
      };
    },

    changeCursor(type: string): void {
      const el = this.$el;

      if (el.style.cursor !== type) {
        el.style.cursor = type;
      }
    },

    async initialiseCache() {
      const cacheAvailable = 'caches' in window;
      if (cacheAvailable) {
        const cacheVersion = 1;
        this.cacheName = `map-terrain-${cacheVersion}`;
        this.cache = await caches.open(this.cacheName);
        console.log('dvdb - initialiseCache - this.cache', this.cache);
      }
      const estimate = await navigator.storage.estimate();
      console.log('dvdb - estimated total space MB', estimate.quota ? estimate.quota / 1000000 : "can't say");
      console.log('dvdb - estimate - estimate.usage MB', estimate.usage ? estimate.usage / 1000000 : "can't say");
    },

    async onTileLoad(tile, url) {
      if (this.cache) {
        // The Cache API is supported
        try {
          const cacheResponse = await this.cache.match(url);

          if (cacheResponse) {
            console.log('used local cache');
            const blob = await cacheResponse.blob();
            // eslint-disable-next-line no-param-reassign
            tile.getImage().src = window.URL.createObjectURL(blob);
          } else {
            await this.cache.add(url);
            const newResponse = await this.cache.match(url);
            if (newResponse) {
              const newBlob = await newResponse.blob();
              // eslint-disable-next-line no-param-reassign
              tile.getImage().src = window.URL.createObjectURL(newBlob);
              console.log('fetched and cached');
            } else {
              console.log('something went wrong but fetching image instead');
              // eslint-disable-next-line no-param-reassign
              tile.getImage().src = url;
            }
          }
        } catch (error) {
          console.error({ error });
        }
      } else {
        console.log('fetched online no cache available');
        // eslint-disable-next-line no-param-reassign
        tile.getImage().src = url;
      }
    },
  },
});
</script>

<style scoped lang="scss">
.s-o-map,
.map-container {
  height: 100%;
  width: 100%;
  position: relative;
}

.s-o-map__info {
  align-items: center;
  bottom: 10px;
  display: flex;
  left: 10px;
  position: absolute;
  z-index: 1;
}

.s-o-map__lat-lng {
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  font-size: 12px;
  height: 26px;
  text-align: center;
  width: 250px;
  margin-right: 5px;
}

.loading-spinner {
  position: absolute;
  left: 0;
  top: 0;
}
</style>
