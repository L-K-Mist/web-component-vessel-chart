<template>
  <v-layout column>
    <v-flex>
      <expanding-list :grouped-fields="groupedFields">
        <template slot-scope="{ field }">
          <v-switch
            v-model="selectedWeather"
            :label="field.text"
            :value="field.value"
            class="flex-grow-1"
            hide-details
            color="accent"
          />
          <v-icon small>
            {{ getIcon(field.style) }}
          </v-icon>
        </template>
      </expanding-list>
      <slot />
    </v-flex>
    <v-flex shrink>
      <v-card-text class="py-1 accordions-background">
        <v-layout align-center>
          <v-icon
            class="pr-3"
            color="white"
          >
            opacity
          </v-icon>
          <v-slider
            class="mt-0"
            color="white"
            hide-details
            :thumb-size="24"
            :value="opacity"
            :min="0"
            :max="1"
            :step="0.1"
            @input="setOpacity"
          />
        </v-layout>
      </v-card-text>
    </v-flex>
  </v-layout>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import debounce from 'lodash/debounce';
import sortAZ from '@stratumfive/ui-baseplate/src/utils/sortAZ';
import weatherOverlays from '@/components/BorrowedFromBaseplate/WeatherLayer/WeatherOverlays';
import ExpandingList from './ExpandingList.vue';

interface WeatherSelectItem {
  type: string
}
interface WeatherSelectGroup {
  name: string,
  items: WeatherSelectItem[]
}

export default Vue.extend({
  name: 'SMapWeatherMenu',
  components: { ExpandingList },
  filters: {
    capitalizeWords(value) {
      if (!value) return null;
      return value.charAt(0).toUpperCase() + value.substr(1).toLowerCase();
    },
  },
  inheritAttrs: false,
  props: {
    activeWeatherOverlays: {
      type: Array,
      required: true,
    } as PropOptions<string[]>,
    weatherLayerOpacity: {
      type: Number,
      required: true,
    },
  },
  data(): any {
    return {
      menu: false,
      overlayStyle: 'gradient',
      panel: [true, false],
    };
  },
  computed: {
    weatherSelectItems(): WeatherSelectItem[] {
      return Object.keys(weatherOverlays)
        .map((key) => weatherOverlays[key])
        .map((weatherOverlay) => ({
          text: weatherOverlay.name,
          value: weatherOverlay.key,
          type: weatherOverlay.type,
          style: weatherOverlay.style,
        }));
    },
    groupedFields(): WeatherSelectGroup[] {
      const seaItems = this.weatherSelectItems.filter((item) => item.type === 'sea');
      const otherItems = this.weatherSelectItems.filter((item) => item.type !== 'sea');

      return [{
        name: 'Sea state',
        items: sortAZ(seaItems, 'text'),
      },
      {
        name: 'Other Weather',
        items: sortAZ(otherItems, 'text'),
      }];
    },
    selectedWeather: {
      get(): string {
        return this.activeWeatherOverlays;
      },
      set(value: string): void {
        this.$emit('change', {
          value,
          property: 'activeWeatherOverlays',
        });
      },
    },
    opacity(): number {
      return this.weatherLayerOpacity;
    },
  },
  created() {
    this.setOpacity = debounce(this.setOpacity, 200);
  },
  methods: {
    setOpacity(value: number): void {
      this.$emit('change', {
        value,
        property: 'weatherLayerOpacity',
      });
    },
    getIcon(fieldStyle): string {
      if (fieldStyle === 'flat') {
        return 'crop_original';
      }
      if (fieldStyle === 'gradient') {
        return 'gradient';
      }

      return 'image';
    },

  },
});
</script>

<style scoped lang="scss">
.v-card {
  border-radius: 3px;
  overflow: hidden;
}

.toolbar-container {
  flex: 0 1 auto;
  width: 100%;
}

.v-toolbar__title {
  font-weight: 300;
  font-size: 16px;
  line-height: 1.1;
}

.accordions-background {
  background-color: rgba(0, 5, 20, 0.8);
}
</style>
