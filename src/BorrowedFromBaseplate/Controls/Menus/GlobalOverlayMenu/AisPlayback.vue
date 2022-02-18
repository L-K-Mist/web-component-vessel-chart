<template>
  <div>
    <div class="ais-switch-wrap white-background">
      <div class="ais-positions-wrap">
        <v-switch
          v-model="areAisVesselsVisible"
          :disabled="!searchVesselResults.length"
          label="Show positions"
          hide-details
          color="accent"
          class="mb-3"
        />
        <s-input-select
          v-model="defaultLabel"
          :items="chartLabelOptions"
          label="Chart label (displayed when zoomed in)"
          :attach="'.map-controls__content__inner'"
          :filled="false"
          :clear-value-before-destroy="false"
          @input="onChartLabelChanged"
        />
      </div>
      <div class="ais-track-wrap">
        <v-switch
          :input-value="areAisTracksVisible"
          :disabled="!searchVesselResults.length"
          label="Show tracks"
          hide-details
          color="accent"
          class="mb-3"
          @change="onAisTracksVisibilityChanged"
        />

        <s-input-split-select
          :value="aisTrackLookbackUnit"
          label="Time unit"
          reversed
          dense
          :filled="false"
          :clear-value-before-destroy="false"
          :items="timeUnits"
          @input="
            onPastTrackSettingsChanged({ value: lookbackTime, unit: $event })
          "
        >
          <s-input-text
            :value="aisTrackLookback"
            label
            type="number"
            dense
            :filled="false"
            :clear-value-before-destroy="false"
            required
            :rules="[
              rules.required,
              rules.maxValue
            ]"
            @input="
              onPastTrackSettingsChanged({
                value: Number($event),
                unit: lookbackTimeUnit,
              })
            "
          />
        </s-input-split-select>
      </div>
    </div>
    <div class="select-vessels-wrap white-background">
      <div class="select-vessels-btn-wrap">
        <s-button
          colour="#1F5673"
          class="select-vessels-btn"
          @click="$emit('showAisSearchModal')"
        >
          select vessels
        </s-button>
      </div>
      <div class="select-vessels-results">
        <v-expansion-panels
          v-if="searchVesselResults"
          tile
        >
          <v-expansion-panel
            v-for="(result, index) in vesselResultsModified"
            :key="index"
            class="select-vessels-results-panel"
          >
            <v-expansion-panel-header
              class="py-0 select-vessels-results-header"
            >
              <div class="d-flex justify-space-between">
                <div
                  class="select-vessels-results-header-name d-flex align-center"
                >
                  <span class="font-weight-bold">
                    {{ result.name }}
                  </span>
                </div>
                <div class="text-right">
                  <p class="ma-0 select-vessels-results-header-number grey-3">
                    MMSI
                    <span class="grey-1">
                      {{ result.mmsi }}
                    </span>
                  </p>
                  <p class="ma-0 select-vessels-results-header-number grey-3">
                    IMO
                    <span class="grey-1">
                      {{ result.imo }}
                    </span>
                  </p>
                </div>
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-row class="ma-0">
                <v-col cols="12">
                  <v-row
                    v-for="detail in result.details"
                    :key="detail.type"
                    class="ma-0"
                  >
                    <v-col
                      cols="4"
                      class="pa-1 grey-1"
                    >
                      {{ detail.text }}
                    </v-col>
                    <v-col
                      cols="8"
                      class="pa-1 text-right grey-2"
                    >
                      {{ detail.value }}
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <s-button
                        class="remove-vessels-btn"
                        colour="#01426A"
                        outline
                        @click="
                          $emit('vesselRemoved', {
                            mmsi: result.mmsi,
                            name: result.name,
                          })
                        "
                      >
                        remove from list
                      </s-button>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import SInputSelect from '@stratumfive/ui-baseplate/src/components/SInputSelect/SInputSelect.vue';
import SButton from '@stratumfive/ui-baseplate/src/components/SButton/SButton.vue';
import SInputSplitSelect from '@stratumfive/ui-baseplate/src/components/SInputSplitSelect/SInputSplitSelect.vue';

import SInputText from '@stratumfive/ui-baseplate/src/components/SInputText/SInputText.vue';
import { capitalize } from '@stratumfive/ui-baseplate/src/utils/stringUtils';
import { SearchVesselResult } from './selectedAis.interface';

interface SelectOption {
  text: string;
  value: string | number | Date;
}

interface VesselResultModified {
  name: String;
  mmsi: number;
  imo: number;
  details: SelectOption[];
}

const kTimeUnits = {
  minute: 'minute',
  hour: 'hour',
};

const kSixHoursInMinutes = 300;
const kSixHoursInHours = 6;

export default Vue.extend({
  components: {
    SInputSelect,
    SButton,
    SInputSplitSelect,
    SInputText,
  },

  props: {
    searchVesselResults: {
      type: Array,
      default: () => [],
    } as PropOptions<SearchVesselResult[]>,

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
      default: kTimeUnits.minute,
    },

    chartLabel: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      defaultLabel: this.chartLabel,
      areAisVesselsVisible: this.areAisPositionsVisible,
      showAisTracks: false,
      timeUnits: [
        {
          text: 'Minutes',
          value: kTimeUnits.minute,
        },
        {
          text: 'Hours',
          value: kTimeUnits.hour,
        },
      ],
      lookbackTime: this.aisTrackLookback,
      lookbackTimeUnit: this.aisTrackLookbackUnit,

      chartLabelOptions: [
        {
          text: 'None',
          value: '',
        },
        {
          text: 'Vessel Name',
          value: 'name',
        },
        {
          text: 'MMSI',
          value: 'mmsi',
        },
        {
          text: 'Callsign',
          value: 'callsign',
        },
        {
          text: 'Vessel Type',
          value: 'type',
        },
        {
          text: 'Destination',
          value: 'destination',
        },
      ],

      rules: {
        required: (value) => !!value || 'Required',
        maxValue: (value) => (
          this.aisTrackLookbackUnit === kTimeUnits.minute && value <= kSixHoursInMinutes)
          || (this.aisTrackLookbackUnit === kTimeUnits.hour && value <= kSixHoursInHours)
          || 'Max 6 hours',
      },
    };
  },

  computed: {
    vesselResultsModified(): VesselResultModified[] {
      if (this.searchVesselResults) {
        return this.searchVesselResults.map((result) => ({
          name: result.name,
          mmsi: result.mmsi,
          imo: result.imo,
          details: [
            {
              text: 'Time',
              value: result.time,
            },
            {
              text: 'Vessel type',
              value: result.type ? result.type : '-',
            },
            {
              text: 'Latitude',
              value: result.latitude,
            },
            {
              text: 'Longitude',
              value: result.longitude,
            },
            {
              text: 'Callsign',
              value: result.callsign ? result.callsign : '-',
            },
            {
              text: 'HDG (T)',
              value: result.heading ? result.heading : '-',
            },
            {
              text: 'COG (T)',
              value: result.cog ? result.cog : '-',
            },
            {
              text: 'SOG (KTS)',
              value: result.sog ? result.sog : '-',
            },
            {
              text: 'Status',
              value: result.navigationStatus ? capitalize(result.navigationStatus) : '-',
            },
            {
              text: 'Destination',
              value: result.destination ? result.destination : '-',
            },
            {
              text: 'ETA',
              value: result.eta ? result.eta : '-',
            },
          ],
        }));
      }

      return [];
    },
  },

  watch: {
    areAisVesselsVisible: {
      handler() {
        this.$emit(
          this.areAisVesselsVisible
            ? 'showSelectedAisPositions'
            : 'hideSelectedAisPositions',
          this.defaultLabel,
        );
      },
    },
  },

  methods: {
    onAisTracksVisibilityChanged() {
      this.$emit(this.areAisTracksVisible ? 'hideAisTracks' : 'showAisTracks', {
        timeNumber: this.lookbackTime,
        timeUnit: this.lookbackTimeUnit,
      });
    },

    onPastTrackSettingsChanged({ value, unit }) {
      // Restrict to maximum 6 hrs
      let correctedValue = value;

      if (unit === kTimeUnits.minute && value > kSixHoursInMinutes) {
        correctedValue = kSixHoursInMinutes;
      }

      if (unit === kTimeUnits.hour && value > kSixHoursInHours) {
        correctedValue = kSixHoursInHours;
      }

      this.lookbackTimeUnit = unit;

      this.$emit('aisTrackLookbackChanged', { value: correctedValue, unit });
    },

    onChartLabelChanged(value) {
      this.$emit('chartLabelChanged', value);
    },
  },
});
</script>

<style lang="scss">
.ais-switch-wrap {
  padding: 16px;
}

.select-vessels-results {
  height: auto;
}

.select-vessels-results-panel {
  margin-top: 0 !important;
}

.select-vessels-btn-wrap {
  padding: 16px;
}

.select-vessels-btn {
  color: white !important;
  width: 100%;
}

.remove-vessels-btn {
  width: 100%;
}

.select-vessels-results-header-number {
  font-size: 13px;
}

.grey-1 {
  color: #6b7280;
}

.grey-2 {
  color: #1f2937;
}

.grey-3 {
  color: #9ca3af;
}

.white-background {
  background-color: white;
}
</style>
