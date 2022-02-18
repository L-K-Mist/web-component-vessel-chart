<template>
  <div class="d-block">
    <v-expansion-panels
      v-if="allGeoZones.length"
      class="ExpandingList"
      accordion
    >
      <v-expansion-panel class="expansion-panel">
        <v-expansion-panel-header class="accordion-header">
          Geo Zones
          <template
            v-slot:actions
          >
            <s-icon
              icon="expand_more"
              color="white"
            />
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="ExpandingList-panelContent">
          <v-card-text class="py-1">
            <geozones-list
              :all-geo-zones="allGeoZones"
              :selected-geo-zones.sync="localSelectedGeoZones"
            />
          </v-card-text>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel
        v-if="aisPositions"
        class="expansion-panel"
      >
        <v-expansion-panel-header class="accordion-header">
          AIS
          <template
            v-slot:actions
          >
            <s-icon
              icon="expand_more"
              color="white"
            />
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="ExpandingList-panelContent">
          <v-card-text class="py-2">
            <v-switch
              v-model="localShowAisData"
              label="Show global AIS positions"
              hide-details
              color="accent"
              class="mb-3"
            />
            <p class="mb-0 font-weight-bold">
              Chart Label
            </p>
            <v-radio-group v-model="localAisLabelType">
              <v-radio
                v-for="label in chartLabelOptions"
                :key="label"
                :label="label"
                :value="label"
                color="accent"
              />
            </v-radio-group>
            <small>
              <s-icon
                icon="info"
                size="small"
              />
              Labels are only displayed when zoomed in
            </small>
          </v-card-text>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <expanding-list :grouped-fields="groupedFields">
      <template slot-scope="{ field }">
        <!-- template part for the density maps toggle -->
        <v-switch
          v-if="field.type === 'density-switch'"
          v-model="localShowDensityMaps"
          :label="field.label"
          color="accent"
          dense
          hide-details
        />

        <!-- the two selects for density maps: vessel types and dates -->
        <div
          v-if="field.type === 'density-select'"
          :id="`menu-for-${field.key}`"
          class="density-select-container"
          :class="{ 'type-menu': field.key === 'type' }"
        >
          <v-select
            v-if="field.key === 'type'"
            v-model="localDensityMapType"
            :items="field.options"
            :filled="false"
            outlined
            :label="field.label"
            :attach="`#menu-for-${field.key}`"
            dense
            hide-details
            class="mt-2 density-select"
          />

          <v-select
            v-if="field.key === 'dates'"
            v-model="localDensityMapDates"
            :items="field.options"
            :filled="false"
            outlined
            :label="field.label"
            :attach="`#menu-for-${field.key}`"
            persistent-hint
            hint="Select up to 12 months"
            dense
            multiple
            class="mt-2 density-select"
          >
            <!-- determine items between regular month options, and entire year options -->
            <template v-slot:item="data">
              <v-list-item
                v-if="data.item.type === 'yearSelect'"
                v-bind="data.attrs"
                ripple
                v-on="data.on"
                @click="toggleEntireYear(data.item.text)"
              >
                <v-list-item-action>
                  <v-icon
                    :color="entireYearsSelected[data.item.text] ? 'accent' : ''"
                  >
                    {{
                      entireYearsSelected[data.item.text]
                        ? 'check_box'
                        : 'check_box_outline_blank'
                    }}
                  </v-icon>
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title>
                    Select All {{ data.item.text }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>

              <v-list-item
                v-else
                v-bind="data.attrs"
                class="pl-5"
                v-on="data.on"
              >
                <v-list-item-action>
                  <v-checkbox
                    v-model="data.attrs.inputValue"
                    @change="data.parent.$emit('select')"
                  />
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ data.item.text }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>

            <!-- custom selection template -->
            <template v-slot:selection="{ item, index }">
              <span
                v-if="index === 0"
                class="mr-2"
              >
                {{ item.text }}
              </span>
              <span
                v-if="index === 1"
                class="text--small"
              >
                (+{{ localDensityMapDates.length - 1 }} others)
              </span>
            </template>
          </v-select>
        </div>
      </template>
    </expanding-list>
    <slot />
    <v-expansion-panels
      class="ExpandingList"
      accordion
      tile
    >
      <v-expansion-panel
        class="expansion-panel"
        @click.native="aisPlaybackClicked"
      >
        <v-expansion-panel-header
          class="accordion-header"
          :disabled="!isAisPlaybackUnlocked"
        >
          <span @click="aisPlaybackClicked">
            AIS Playback
          </span>
          <template
            v-slot:actions
          >
            <s-icon
              v-if="!isAisPlaybackUnlocked"
              color="white"
              icon="lock"
            />
            <s-icon
              v-else
              icon="expand_more"
              color="white"
            />
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="ExpandingList-panelContent">
          <v-card-text class="pa-0 neutral">
            <ais-playback
              :key="searchVesselResults.length"
              :search-vessel-results="searchVesselResults"
              :are-ais-positions-visible="areAisPositionsVisible"
              :are-ais-tracks-visible="areAisTracksVisible"
              :ais-track-lookback="aisTrackLookback"
              :ais-track-lookback-unit="aisTrackLookbackUnit"
              :chart-label="chartLabel"
              @showAisSearchModal="$emit('showAisSearchModal')"
              @vesselRemoved="vesselRemoved"
              @showSelectedAisPositions="showSelectedAisPositions"
              @hideSelectedAisPositions="$emit('hideSelectedAisPositions')"
              @chartLabelChanged="chartLabelChanged"
              @aisTrackLookbackChanged="onAisTrackLookbackChanged"
              @showAisTracks="showAisTracks"
              @hideAisTracks="$emit('hideAisTracks')"
            />
          </v-card-text>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';

import globalOverlays from '@stratumfive/ui-baseplate/src/components/SOMap/GlobalOverlayLayer/GlobalOverlays';
import SIcon from '@stratumfive/ui-baseplate/src/components/SIcon/SIcon.vue';
import ExpandingList from './ExpandingList.vue';
import GeozonesList from './GlobalOverlayMenu/Geozones.vue';
import AisPlayback from './GlobalOverlayMenu/AisPlayback.vue';
import { AisPositionType } from '../../SMap.interface';
import { SearchVesselResult } from './GlobalOverlayMenu/selectedAis.interface';


interface OverlayItem {
  type: string;
  disabled?: boolean;
}

interface OverlayItemGroup {
  name: string;
  items: OverlayItem[];
}

export interface DensityMapItem {
  title: string;
  name: string;
  sources: string[];
}

export default Vue.extend({
  components: {
    ExpandingList,
    GeozonesList,
    SIcon,
    AisPlayback,
  },

  inheritAttrs: false,

  props: {
    activeGlobalOverlays: {
      type: Array,
      required: true,
    } as PropOptions<string[]>,

    densityMaps: {
      type: Array,
      default: () => [],
    } as PropOptions<DensityMapItem[]>,

    allGeoZones: {
      type: Array,
      required: true,
    } as PropOptions<any[]>,

    selectedGeoZones: {
      type: Array,
      required: true,
    } as PropOptions<any[]>,

    /**
     * TODO: Add different layer name for the historic AIS type.
     */
    aisPositions: {
      type: String,
      required: false,
    } as PropOptions<AisPositionType>,

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
      required: false,
    } as PropOptions<SearchVesselResult[]>,

    isAisPlaybackUnlocked: {
      type: Boolean,
      default: false,
    },

    areAisPositionsVisible: {
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

    chartLabel: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      menu: false,
      overlayOptions: Object.values(globalOverlays) as OverlayItem[],
      chartLabelOptions: [
        'Vessel Name',
        'MMSI',
        'Callsign',
        'Vessel Type',
        'Destination',
      ],
    };
  },

  computed: {
    localSelectedGeoZones: {
      get(): number[] {
        return this.selectedGeoZones;
      },
      set(val: number[]) {
        this.$emit('update:selectedGeoZones', val);
      },
    },

    localShowAisData: {
      get(): boolean {
        return this.activeGlobalOverlays.includes('ais');
      },

      set(value: boolean): void {
        this.updateGlobalOverlay({ value, parameter: 'ais' });
      },
    },

    localAisLabelType: {
      get(): string {
        return this.aisLabelType;
      },

      set(value: string): void {
        this.$emit('update:aisLabelType', value);

        if (this.localShowAisData) {
          this.updateGlobalOverlay({
            value: this.localShowAisData,
            parameter: 'ais',
          });
        }
      },
    },

    localShowDensityMaps: {
      get(): boolean {
        return this.activeGlobalOverlays.includes('density');
      },

      set(value: boolean): void {
        const { type, dates } = this.densityMapFields;

        if (type === '') {
          this.$store.commit('sUI/setDensityMapParameters', { type: '_all' });
        }

        if (!dates.length) {
          this.$store.commit('sUI/setDensityMapParameters', {
            dates: [this.dateOptions[0]],
          });
        }

        this.updateGlobalOverlay({ value, parameter: 'density' });
      },
    },

    localDensityMapType: {
      get(): string {
        return this.densityMapType;
      },

      set(value: string): void {
        this.$emit('update:densityMapType', value);

        if (this.localDensityMapType) {
          this.updateGlobalOverlay({
            value: this.localShowDensityMaps,
            parameter: 'density',
          });
        }
      },
    },

    localDensityMapDates: {
      get(): string[] {
        return this.densityMapDates;
      },

      set(value: string[]): void {
        this.$emit('update:densityMapDates', value);

        if (this.localDensityMapDates) {
          this.updateGlobalOverlay({
            value: this.localShowDensityMaps,
            parameter: 'density',
          });
        }
      },
    },

    /**
     * Create an array of select options from the density map
     * array input.
     */
    vesselTypeOptions(): { text: string; value: string }[] {
      return this.densityMaps.map((densityMap) => ({
        text: densityMap.title,
        value: densityMap.name,
      }));
    },

    /**
     * Create an array of possible dates from the density map input.
     */
    dateOptions(): string[] {
      return Array.from(
        new Set(
          this.densityMaps.flatMap((densityMap) => densityMap.sources),
        ),
      ).sort((a, b) => (a > b ? -1 : 1));
    },

    /**
     * Create an array of years based on what date options we have. We can then use
     * these to group the years for easier selecting within the dropdown.
     */
    yearOptions(): string[] {
      return Array.from(
        new Set(this.dateOptions.map((dateItem) => dateItem.substring(0, 4))),
      );
    },

    /**
     * Create a combined instance for our date array so we can add our custom
     * functionality in.
     */
    dateInstances(): { type: string; text: string }[] {
      const dateArrays = this.yearOptions.map((year) => this.dateOptions.filter(
        (dateOption) => dateOption.includes(year),
      ));

      return this.yearOptions
        .map((year, index) => {
          const yearItem = {
            type: 'yearSelect',
            text: year,
          };

          return [yearItem].concat(
            dateArrays[index].map((dateItem) => ({
              type: 'option',
              text: dateItem,
            })),
          );
        })
        .flat(1);
    },

    /**
     * The parent fields with child fields within them to feed to the
     * expansion panels.
     */
    groupedFields(): OverlayItemGroup[] {
      const fieldGroups = [] as any[];

      if (this.densityMaps?.length) {
        fieldGroups.push({
          name: 'Historic Density Maps',
          items: [
            {
              type: 'density-switch',
              label: 'Show density map overlay',
              disabled: false,
            },
            {
              key: 'type',
              type: 'density-select',
              label: 'Select vessel type',
              disabled: false,
              options: this.vesselTypeOptions,
            },
            {
              key: 'dates',
              type: 'density-select',
              label: 'Select date range',
              disabled: false,
              options: this.dateInstances,
            },
          ],
        });
      }

      return fieldGroups;
    },

    selectedStyles: {
      get(): string[] {
        return this.activeGlobalOverlays;
      },

      set(value: string): void {
        this.$emit('change', {
          value,
          property: 'activeGlobalOverlays',
        });
      },
    },

    densityMapFields: {
      get(): any {
        return this.$store.state?.sUI?.densityMapParameters
          ? this.$store.state.sUI.densityMapParameters
          : { type: '', dates: [] };
      },

      set(value: any) {
        this.$store.commit('sUI/setDensityMapParameters', value);
      },
    },

    /**
     * Show whether all items for each year have been selected.
     * e.g: 2019: false,
     */
    entireYearsSelected(): object {
      const yearsObject = {};

      this.yearOptions.forEach((year) => {
        const allYearInstances = this.dateOptions.filter((dateOption) => dateOption.includes(year));
        yearsObject[year] = allYearInstances.every((i) => this.densityMapFields.dates.includes(i));
      });

      return yearsObject;
    },
  },

  watch: {
    /**
     * 1. Watch the dates field, we shouldn't allow any more than 12 months selected.
     * 2. Every time a setting is changed, we need to create an updated string to
     *     request from the carto server.
     */
    densityMapFields: {
      deep: true,
      handler(newValue) {
        if (newValue.dates.length > 12) {
          this.$store.commit('sUI/setDensityMapParameters', {
            dates: this.densityMapFields.dates.shift(),
          });
        }

        this.$store.commit('sUI/setDensityMapParameters', newValue);
      },
    },
  },

  created() {
    if (!this.aisPositions) {
      this.updateGlobalOverlay({ value: false, parameter: 'ais' });
    }
  },

  methods: {
    /**
     * Toggle all date options that belong to a year.
     */
    toggleEntireYear(year: string): void {
      const yearDateOptions = this.dateOptions.filter((dateOption) => dateOption.includes(year));

      const currentlySelectedOptions = this.densityMapFields.dates.filter(
        (dateOption) => dateOption.includes(year),
      );

      this.$nextTick(() => {
        if (currentlySelectedOptions.length === yearDateOptions.length) {
          this.$store.commit('sUI/setDensityMapParameters', { dates: [] });
        } else {
          const newDates = [...yearDateOptions];
          this.$store.commit('sUI/setDensityMapParameters', {
            dates: newDates,
          });
        }
      });
    },

    /**
     * Set a global overlay to either be shown/hidden in the global array.
     */
    updateGlobalOverlay({
      value,
      parameter,
    }: {
      value: boolean;
      parameter: string;
    }): void {
      // previous value
      let overlays = this.activeGlobalOverlays;

      if (value) {
        // if we switch on overlay that is not visible
        // -> add parameter to overlays
        if (!this.activeGlobalOverlays.includes(parameter)) {
          overlays = this.activeGlobalOverlays.concat([parameter]);
        }
        // if we switch on overlay that is already visible
        // -> do nothing and use the existing overlays
        // (this is to prevent switching the same overlay multiple times)
      } else {
        // if we switch off parameter
        // -> remove parameter from overlays
        overlays = this.activeGlobalOverlays.filter(
          (prop) => prop !== parameter,
        );
      }

      this.$emit('change', {
        property: 'activeGlobalOverlays',
        value: overlays,
      });
    },

    vesselRemoved(value) {
      this.$emit('vesselRemoved', value);
    },

    onAisTrackLookbackChanged(value) {
      this.$emit('aisTrackLookbackChanged', value);
    },

    showGlobalAisPositions(value) {
      this.$emit('showGlobalAisPositions', value);
    },

    showSelectedAisPositions(value) {
      this.$emit('showSelectedAisPositions', value);
    },

    showAisTracks(value) {
      this.$emit('showAisTracks', value);
    },

    chartLabelChanged(value) {
      this.$emit('chartLabelChanged', value);
    },

    aisPlaybackClicked(): void {
      if (!this.isAisPlaybackUnlocked) {
        this.$emit('aisPlaybackLockClicked');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.ExpandingList-panelContent ::v-deep .v-expansion-panel-content__wrap {
  padding: 0;
}

.expansion-panel {
  background-color: transparent !important;
}

.ExpandingList-panelContent {
  background-color: white !important;
}

.accordion-header {
  background-color: rgba(0, 5, 20, 0.8);
  color: white;
}

.density-select-container {
  position: relative;
  width: 100%;

  ::v-deep {
    .v-menu__content {
      top: 15px !important;
    }

    .v-list-item {
      padding: 0 5px;
    }

    .v-list-item__action {
      margin: 0;
    }

    .v-list-item__action:first-child {
      margin-right: 10px;
    }

    .density-select {
      span {
        padding-top: 4px;
      }

      .v-select__selections input {
        height: 0;
      }
    }
  }
}

.type-menu {
  ::v-deep {
    .v-list-item {
      padding: 0 16px;
    }
  }
}
</style>
