<template>
  <div
    v-click-outside="() => toggleMenu(activeMenu)"
    class="map-controls"
  >
    <div class="map-controls__toggles elevation-2">
      <v-tooltip
        v-for="menu in menuItems"
        :key="menu.type"
        color="layout_1"
        z-index="2"
        left
      >
        <template v-slot:activator="{ on }">
          <button
            :key="menu.type"
            :aria-label="`${menu.text} menu`"
            :class="[
              'toggle',
              {
                active: activeMenu !== null && activeMenu.type === menu.type,
              },
            ]"
            type="button"
            v-on="{
              ...on,
              click: toggleMenu.bind(this, menu),
            }"
          >
            <span v-if="menu.icon === 'anchor'">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                version="1.1"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                class="anchor-icon"
              >
                <path
                  d="M12,2C10.34,2 9,3.34 9,5C9,6.66 9.34,7.83 11,
                  7.83V9H8V11H11V19.92C10.26,19.79 9.5,19.58 8.79,19.27C8.05,18.95
                  7.4,18.56 6.82,18.09C6.24,17.62 5.78,17.11 5.44,16.55L7,15L3,12V15C3,15.97
                  3.27,16.88 3.82,17.72C4.37,18.56 5.09,19.31 6,19.95C6.87,20.59 7.84,21.09
                  8.88,21.45C9.93,21.81 10.97,22 12,22C13.03,22 14.07,21.8 15.12,21.44C16.16,21.08
                   17.13,20.58 18,19.95C18.92,19.31 19.63,18.57 20.18,17.72C20.73,16.88 21,15.97 21
                   ,15V12L17,15L18.56,16.55C18.22,17.11 17.76,17.62 17.18,18.09C16.6,18.56 15.95,
                   18.95 15.21,19.27C14.5,19.58 13.74,19.79 13,19.92V11H16V9H13V7.82C14.66,
                   7.82 15,6.66 15,5C15,3.34 13.66,2 12,2M12,4C12.55,4 13,4.45 13,5C13,5.55 12.55,
                   6 12,6C11.45,6 11,5.55 11,5C11,4.45 11.45,4 12,4Z"
                />
              </svg>
            </span>
            <s-icon
              v-else
              :icon="menu.icon"
              size="small"
            />
          </button>
        </template>
        <span>{{ menu.text }}</span>
      </v-tooltip>
    </div>

    <div class="map-controls__content">
      <transition
        v-show="activeMenu !== null"
        name="controls-transition"
        mode="out-in"
      >
        <slot
          name="map-controls-content"
        >
          <component
            :is="activeMenu !== null ? activeMenu.type : null"
            v-if="activeMenu && activeMenu.type !== 'ports'"
            :menu-name="activeMenu !== null ? activeMenu.text : null"
            class="map-controls__content__inner"
            :active-map-style="activeMapStyle"
            :allow-c-map-options="allowCMapOptions"
            :c-map-options="cMapOptions"
            :active-weather-overlays="activeWeatherOverlays"
            :weather-layer-opacity="weatherLayerOpacity"
            :active-global-overlays="activeGlobalOverlays"
            :density-maps="densityMaps"
            :density-map-type.sync="localDensityMapType"
            :density-map-dates.sync="localDensityMapDates"
            :all-geo-zones="allGeoZones"
            :selected-geo-zones.sync="localSelectedGeoZones"
            :ais-positions="aisPositions"
            :ais-label-type.sync="localAisLabelType"
            :search-vessel-results="searchVesselResults"
            :is-ais-playback-unlocked="isAisPlaybackUnlocked"
            :are-ais-positions-visible="areAisPositionsVisible"
            :ais-track-lookback="aisTrackLookback"
            :ais-track-lookback-unit="aisTrackLookbackUnit"
            :are-ais-tracks-visible="areAisTracksVisible"
            :chart-label="chartLabel"
            @change="$emit('change', $event)"
            @showAisSearchModal="$emit('showAisSearchModal')"
            @vesselRemoved="vesselRemoved"
            @showSelectedAisPositions="showSelectedAisPositions"
            @hideSelectedAisPositions="$emit('hideSelectedAisPositions')"
            @showAisTracks="showAisTracks"
            @hideAisTracks="$emit('hideAisTracks')"
            @aisPlaybackLockClicked="$emit('aisPlaybackLockClicked')"
            @chartLabelChanged="chartLabelChanged"
            @aisTrackLookbackChanged="onAisTrackLookbackChanged"
          >
            <slot :name="`after-${activeMenu.type}`" />
          </component>
        </slot>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import SIcon from '@stratumfive/ui-baseplate/src/components/SIcon/SIcon.vue';
import { CMapOption } from '@stratumfive/ui-baseplate/src/components/SOMap/MapStyles';
import { ControlsToggle, AisPositionType } from '../SMap.interface';
import SMapWeatherMenu from './Menus/WeatherMenu.vue';
import SMapStyleMenu from './Menus/MapStyleMenu.vue';
import SMapOverlayMenu, { DensityMapItem } from './Menus/GlobalOverlayMenu.vue';
import { SearchVesselResult } from './Menus/GlobalOverlayMenu/selectedAis.interface';

type Menuitem = null | { text: string; type: string };

export default Vue.extend({
  name: 'SMapControls',

  components: {
    SIcon,
    SMapWeatherMenu,
    SMapOverlayMenu,
    SMapStyleMenu,
  },

  props: {
    /**
     * Current style applied to the map
     */
    activeMapStyle: {
      type: String,
      required: false,
    },

    /**
     * An array of weather overlays that should be displayed on the map
     */
    activeWeatherOverlays: {
      type: Array,
      required: false,
    } as PropOptions<string[]>,

    /**
     * The opacity of the weather overlays that should be displayed on the map
     */
    weatherLayerOpacity: {
      type: Number,
      required: false,
      default: 0.5,
    },

    activeGlobalOverlays: {
      type: Array,
      required: false,
    } as PropOptions<string[]>,

    allowCMapOptions: {
      type: Boolean,
      default: false,
    },

    cMapOptions: {
      type: Array,
      default: (): any[] => [],
    } as PropOptions<CMapOption[]>,

    densityMaps: {
      type: Array,
      required: false,
      default: () => [],
    } as PropOptions<DensityMapItem[]>,

    allGeoZones: {
      type: Array,
      required: true,
    },

    selectedGeoZones: {
      type: Array,
      required: true,
    } as PropOptions<number[]>,

    showPortsButton: {
      type: Boolean,
      default: false,
    },

    showPortsOverlay: {
      type: Boolean,
      default: false,
    },

    // What type of AIS Positions should we show?
    aisPositions: {
      type: String,
      required: false,
    } as PropOptions<AisPositionType>,

    // What should the AIS global vessels be labelled with? (e.g. IMO)
    aisLabelType: {
      type: String,
      default: '',
    },

    densityMapType: {
      type: String,
      default: '',
    },

    densityMapDates: {
      type: Array,
      default: () => [],
    } as PropOptions<string[]>,

    searchVesselResults: {
      type: Array,
      default: () => [],
    } as PropOptions<SearchVesselResult[]>,

    isAisPlaybackUnlocked: {
      type: Boolean,
      default: false,
    },

    areAisTracksVisible: {
      type: Boolean,
      default: false,
    },

    aisTrackLookback: {
      type: Number,
      default: 30,
    },

    aisTrackLookbackUnit: {
      type: String,
      default: 'minute',
    },

    areAisPositionsVisible: {
      type: Boolean,
      default: false,
    },

    chartLabel: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      activeMenu: null as Menuitem,
    };
  },

  computed: {
    localShowPortsOverlay: {
      get(): boolean {
        return this.showPortsOverlay;
      },

      set(value: boolean) {
        this.$emit('update:showPortsOverlay', value);
        if (!value) {
          this.activeMenu = null;
        }
      },
    },

    menuItems(): ControlsToggle[] {
      const items = [] as ControlsToggle[];

      if (this.activeMapStyle) {
        items.push({
          type: 'SMapStyleMenu',
          text: 'Map Style',
          icon: 'map',
        });
      }

      if (this.activeWeatherOverlays) {
        items.push({
          type: 'SMapWeatherMenu',
          text: 'Weather',
          icon: 'cloud',
        });
      }

      if (this.activeGlobalOverlays) {
        items.push({
          type: 'SMapOverlayMenu',
          text: 'Global Overlays',
          icon: 'public',
        });
      }

      if (this.showPortsButton) {
        items.push({
          type: 'ports',
          text: 'Ports',
          icon: 'anchor',
        });
      }

      return items;
    },

    localSelectedGeoZones: {
      get(): number[] {
        return this.selectedGeoZones;
      },

      set(val: number[]) {
        this.$emit('update:selectedGeoZones', val);
      },
    },

    localAisLabelType: {
      get(): string {
        return this.aisLabelType;
      },

      set(value: string) {
        this.$emit('update:aisLabelType', value);
      },
    },

    localDensityMapType: {
      get(): string {
        return this.densityMapType;
      },

      set(value: string) {
        this.$emit('update:densityMapType', value);
      },
    },

    localDensityMapDates: {
      get(): string[] {
        return this.densityMapDates;
      },

      set(value: string[]) {
        this.$emit('update:densityMapDates', value);
      },
    },
  },

  methods: {
    toggleMenu(buttonClicked: Menuitem): void {
      // The user clicked the currently open menu toggle, close all menus
      if (
        this.activeMenu && buttonClicked && this.activeMenu.type === buttonClicked.type
      ) {
        this.activeMenu = null;
        this.localShowPortsOverlay = false;
        return;
      }

      this.localShowPortsOverlay = buttonClicked?.type === 'ports';

      this.activeMenu = buttonClicked;
    },

    vesselRemoved(value) {
      this.$emit('vesselRemoved', value);
    },

    showSelectedAisPositions(value) {
      this.$emit('showSelectedAisPositions', value);
    },

    showAisTracks(value) {
      this.$emit('showAisTracks', value);
    },

    onAisTrackLookbackChanged(value) {
      this.$emit('aisTrackLookbackChanged', value);
    },

    chartLabelChanged(value) {
      this.$emit('chartLabelChanged', value);
    },
  },

});
</script>

<style lang="scss" scoped>
.map-controls {
  bottom: 10px;
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: $map_z-index + 1;
}

.map-controls__toggles {
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toggle {
  background-color: white;
  color: $neutral_darken2;
  flex: 0 1 auto;
  height: 40px;
  width: 40px;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  & .anchor-icon {
    transition: fill 0.2s ease-in-out;
    fill: $neutral_darken2;
    height: auto;
    width: 20px;
    margin-top: 5px;
  }

  &:hover {
    background-color: $neutral_lighten4;
  }

  &:focus-visible {
    background-color: $neutral_lighten4;
  }

  &:focus {
    outline: 0;
  }

  &.active {
    color: $accent;
    background-color: $neutral_lighten4;

    & .anchor-icon {
      fill: $accent;
    }
  }

  ::v-deep .v-icon {
    color: inherit;
  }
}

.map-controls__content {
  height: auto;
  overflow: auto;
  bottom: 0;
  padding-right: 40px;
  position: absolute;
  right: 10px;
  top: 0;
  pointer-events: none;
  // Stops the items from going behind the transparent .map-menu bar when closed
  clip-path: polygon(0 0, 0 100%, calc(100% - 40px) 100%, calc(100% - 40px) 0);

  // Fix nested items
  .map-controls__content__inner {
    transform: none;
  }
}

.map-controls__content__inner {
  border-radius: 5px;
  max-height: 100%;
  width: 300px;
  overflow: auto;
  position: relative;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  pointer-events: all;
}

.controls-transition {
  &-enter-active,
  &-leave-active {
    transition: opacity 0.2s ease-in-out;
  }

  &-enter,
  &-leave-to {
    opacity: 0;
  }
}

::v-deep .v-input--selection-controls {
  margin-top: 0;
}

::v-deep .v-expansion-panel__header {
  padding-left: 16px;
  padding-right: 16px;
}

::v-deep .v-expansion-panel__container {
  border-radius: 0 !important;
  background-color: transparent !important;
}
</style>
