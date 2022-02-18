<template>
  <current-weather-list
    class="active-weather"
    :active-weather-overlays="layers"
  />
</template>

<script lang="ts">
/* eslint-disable no-param-reassign */
import Vue, { PropOptions } from 'vue';
import dayjs from 'dayjs';
import throttle from 'lodash/throttle';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import ImageSource from 'ol/source/Image';
import { WeatherOverlay } from '../SMap.interface';
import WeatherOverlays from './WeatherOverlays';
import { getDateForImage, getImageUrl } from '../helpers/carto-server';
import CurrentWeatherList from './CurrentWeatherList.vue';

interface BufferLayer {
  date: dayjs.Dayjs | null,
  imageSource: Static | null,
  imageLayer: ImageLayer<ImageSource> | null,
}

/**
 * How many layers do we want to cache the different frames of weather
 * We should adjust this to tune performance. More layers means smoother playback
 * over larger times spans but will use more memory.
 */
const BUFFER_LAYER_COUNT = 20;

export default Vue.extend({
  name: 'WeatherLayer',
  components: {
    CurrentWeatherList,
  },
  inject: ['mapProvider'],
  props: {
    layers: {
      required: true,
      type: Array,
    } as PropOptions<WeatherOverlay[]>,
    currentDateTime: {
      required: false,
      type: String,
      default: (): string => dayjs().toISOString(),
    },
    opacity: {
      required: false,
      type: Number,
      default: 0.3,
    },
    zIndex: {
      required: false,
      type: Number,
      default: 1,
    },
  },
  data(): any {
    return {};
  },
  computed: {
    layerDefinitions(): any[] {
      return this.layers.map((layer) => WeatherOverlays[layer]);
    },
    theMap(): any {
      // injected from the parent s-map
      const mapProvider = this.mapProvider() as any;
      return mapProvider.map;
    },
    dimensions(): any {
      // injected from the parent s-map
      const mapProvider = this.mapProvider() as any;
      return mapProvider.dimensions();
    },
    extent(): any {
      // injected from the parent s-map
      const mapProvider = this.mapProvider() as any;
      return mapProvider.extent();
    },
    cartoServerUrl(): any {
      // injected from the parent s-map
      const mapProvider = this.mapProvider() as any;
      return mapProvider.cartoServerUrl();
    },
  },
  watch: {
    dimensions(newDimensions, oldDimensions) {
      if (
        newDimensions.width !== oldDimensions.width
        || newDimensions.height !== oldDimensions.height
      ) {
        this.updateLayers();
      }
    },
    extent(newExtent, oldExtent) {
      if (
        newExtent[0] !== oldExtent[0]
        || newExtent[1] !== oldExtent[1]
        || newExtent[2] !== oldExtent[2]
        || newExtent[3] !== oldExtent[3]
      ) {
        this.updateLayers();
      }
    },
    opacity(newOpacity, oldOpacity) {
      if (newOpacity !== oldOpacity) {
        this.loadLayers();
      }
    },
    layers(newLayers, oldLayers) {
      if (newLayers.length !== oldLayers.length) {
        this.updateLayers();
      }

      if (newLayers.length === 0) {
        this.removeLayers();
        this.createLayers();
      }
    },
    currentDateTime(newDateTime, oldDateTime) {
      if (newDateTime !== oldDateTime) {
        this.loadLayers();
      }
    },
  },
  created() {
    this.bufferLayers = [] as BufferLayer[];
    this.loadLayers = throttle(this.loadLayers, 33);
  },
  mounted() {
    this.createLayers();
    this.loadLayers();
  },
  beforeDestroy() {
    this.removeLayers();
  },
  methods: {
    createLayers() {
      for (let i = 0; i < BUFFER_LAYER_COUNT; i += 1) {
        const bufferLayer: BufferLayer = {
          date: null,
          imageSource: null,
          imageLayer: new ImageLayer({
            zIndex: this.zIndex,
            opacity: 0,
          }),
        };
        this.bufferLayers.push(bufferLayer);
        this.theMap.addLayer(bufferLayer.imageLayer);
      }
    },
    loadLayers() {
      if (this.layers.length === 0) {
        return;
      }

      const currentAdjustedDate = getDateForImage(0, this.currentDateTime);
      const previousDate = getDateForImage(-1, this.currentDateTime);
      const nextDate = getDateForImage(1, this.currentDateTime);

      const datesToLoad = [
        currentAdjustedDate, // The current date will load first
        nextDate, // Current time + 3 hours
        getDateForImage(2, this.currentDateTime), // Current time + 6 hours
        previousDate, // Current time - 3 hours
        getDateForImage(-2, this.currentDateTime), // Current time - 6 hours
      ];

      datesToLoad.forEach((date) => this.loadDate(date, currentAdjustedDate));

      // Get the dates of the two layers the current date sits between
      const activeDates = [currentAdjustedDate];
      if (currentAdjustedDate.isBefore(dayjs(this.currentDateTime))) {
        activeDates.push(nextDate);
      } else {
        activeDates.push(previousDate);
      }

      // Set the current dates opacity to 1 and the rest to 0
      this.bufferLayers.forEach((bufferLayer: BufferLayer) => {
        const activeLayer = bufferLayer.date
          ? activeDates.some((date) => date.isSame(bufferLayer.date!)) : false;
        if (!activeLayer) {
          bufferLayer.imageLayer?.setOpacity(0);
        } else {
          // Here we will set the opacity of the two layers the current date sits between
          // We use the diff from the current time to modify the opacity allowing us to crossfade
          // the two layers. The closer to the current time the layer is, the more opaque it will be
          const maxDiff = activeDates.length === 2
            ? Math.abs(activeDates[0].diff(activeDates[1])) : 0;
          const diffFromCurrentTime = Math.abs(bufferLayer.date!.diff(dayjs(this.currentDateTime)));
          const opacityModifier = 1 - diffFromCurrentTime / maxDiff;
          bufferLayer.imageLayer?.setOpacity(this.opacity * opacityModifier);
        }
      });
    },
    /**
     * Get a buffer layer. This will return empty layers first, then it will recycle
     * layers that are far away from the current date/time
     * @param currentDateTime
     */
    getAvailableBufferLayer(currentDateTime: dayjs.Dayjs): BufferLayer {
      // If there is a layer thats not being used return that
      const emptyLayer = this.bufferLayers.find((layer) => !layer.date);
      if (emptyLayer) {
        return emptyLayer;
      }

      // Otherwise find a bucket that has the date the furthest away from the current date
      let chosenLayer: BufferLayer = this.bufferLayers[0];
      let maxDiff = chosenLayer.date
        ? Math.abs(dayjs(currentDateTime).diff(chosenLayer.date)) : 0;

      this.bufferLayers
        .filter((bufferLayer) => bufferLayer.date)
        .forEach((bufferLayer: BufferLayer) => {
          const diff = Math.abs(dayjs(currentDateTime).diff(bufferLayer.date!));

          if (diff > maxDiff) {
            maxDiff = diff;
            chosenLayer = bufferLayer;
          }
        });

      return chosenLayer;
    },
    loadDate(date: dayjs.Dayjs, currentDateTime: dayjs.Dayjs): Promise<BufferLayer> {
      // eslint-disable-next-line consistent-return
      return new Promise((resolve) => {
        // Check if the date is already loaded
        const existingLayer = this.bufferLayers
          .find((layer: BufferLayer) => layer.date && date.isSame(layer.date));

        if (existingLayer) {
          return resolve(existingLayer);
        }
        const bufferLayer = this.getAvailableBufferLayer(currentDateTime);
        bufferLayer.date = date;
        const url = getImageUrl({
          layers: this.layerDefinitions,
          date,
          dimensions: this.dimensions,
          extent: this.extent,
          cartoServerUrl: this.cartoServerUrl,
        });

        if (url) {
          bufferLayer.imageSource = new Static({
            url,
            imageExtent: this.extent,
          });
          bufferLayer.imageLayer.setSource(bufferLayer.imageSource);
          bufferLayer.imageSource.on('imageloadend', () => resolve(bufferLayer));
        }
      });
    },
    updateLayers() {
      // Remove the current date on each of the layers, this will cause them to be
      // reload when we call loadLayers
      this.bufferLayers.forEach((bufferLayer: BufferLayer) => {
        bufferLayer.date = null;
      });
      this.loadLayers();
    },
    removeLayers() {
      const { bufferLayers } = this;
      bufferLayers.forEach((layer) => this.theMap.removeLayer(layer.imageLayer));
      this.bufferLayers = [];
    },
  },
});
</script>

<style scoped lang="scss">
.active-weather {
  left: 0;
  position: absolute;
  top: 0;
  z-index: $map_z-index + 1;
}
</style>
