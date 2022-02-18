<template>
  <div>
    <v-menu
      v-for="(weather, index) in activeOverlays"
      :key="weather.key"
      v-model="showMenu[index]"
      min-width="86"
      max-width="300"
      nudge-right="10"
      nudge-top="-30"
      :disabled="!weatherOverlays[weather.key].hasLegend"
    >
      <template v-slot:activator="{ on }">
        <v-chip
          class="white--text weather-list__item ma-1"
          color="layout_2"
          :disabled="!weatherOverlays[weather.key].hasLegend"
          small
          v-on="on"
        >
          <v-icon
            small
            class="pr-1"
          >
            cloud
          </v-icon>
          {{ weather.name }}
        </v-chip>
      </template>
      <div
        v-if="weatherOverlays[weather.key].hasLegend"
        class="weather-list__dropdown"
      >
        <img
          class="weather-list__dropdown__image"
          :src="
            `${cartoServerUrl()}/legend/s3llg?layer=` +
              weather.key +
              '&bgcolour=fff'
          "
          :alt="weather.name"
        >
      </div>
    </v-menu>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import weatherOverlays from './WeatherOverlays';
import { WeatherOverlay } from '../SMap.interface';

export default Vue.extend({
  name: 'CurrentWeatherList',
  components: {},
  inject: ['cartoServerUrl'],
  props: {
    /**
     * An array of active weather overlays
     */
    activeWeatherOverlays: {
      type: Array,
      required: true,
    } as PropOptions<WeatherOverlay[]>,
  },
  data() {
    return {
      showMenu: [],
      weatherOverlays,
    };
  },
  computed: {
    activeOverlays(): object[] {
      return this.activeWeatherOverlays
        .filter((overlay) => !!overlay)
        .map((key: WeatherOverlay) => weatherOverlays[key]);
    },
  },
});
</script>

<style lang="scss" scoped>
.weather-list__item {
  z-index: $map_z-index + 1;

  ::v-deep .v-chip__content {
    cursor: pointer;
    height: 24px;
    font-size: 10px;
  }

  &.v-chip--disabled,
  &.v-chip--disabled * {
    cursor: default;
  }
}

.weather-list__dropdown {
  padding-top: 6px;
  height: 237px;
  overflow: hidden;
  z-index: 999;
  background-color: #fff;
}

.weather-list__dropdown__image {
  width: 86px !important;
  height: auto;
}
</style>
