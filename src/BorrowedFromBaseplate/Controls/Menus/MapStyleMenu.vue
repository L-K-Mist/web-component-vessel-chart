<template>
  <div class="map-options-accordion">
    <v-radio-group v-model="selectedStyle">
      <ul class="reset-list">
        <li
          v-for="(group, groupName) in groups"
          :key="groupName"
          class="pa-3 group"
        >
          <h4 class="mb-2 white--text">
            {{ groupName }}
          </h4>
          <v-radio
            v-for="key in group"
            :key="key"
            :label="getLayerName(key)"
            :value="key"
            dark
            color="accent"
          />
          <div v-if="allowCMapOptions && groupName === 'CMap'">
            <fieldset class="reset-fieldset">
              <div class="d-flex">
                <legend>
                  <button
                    type="button"
                    class="white--text d-flex justify-space-between options-toggle"
                    :class="{ 'open': showCMapOptions }"
                    @click="showCMapOptions = !showCMapOptions"
                  >
                    <span>Options</span>
                    <s-icon
                      icon="arrow_drop_down"
                      color="white"
                    />
                  </button>
                </legend>
              </div>
              <ul
                v-show="showCMapOptions"
                class="reset-list additional-options"
              >
                <li
                  v-for="option in cMapLayerOptions"
                  :key="option.label"
                >
                  <v-checkbox
                    v-if="option.type === 'checkbox'"
                    v-model="option.value"
                    :label="option.label"
                    dark
                    color="accent"
                    hide-details
                  />
                  <label
                    v-else-if="option.type === 'number'"
                    class="d-flex white--text mt-1"
                  >
                    <span class="flex-grow-1">
                      {{ option.label }}
                    </span>
                    <input
                      v-model="option.value"
                      type="number"
                      class="tiny-text-input"
                    >
                  </label>
                  <s-input-select
                    v-else-if="option.type === 'select'"
                    v-model="option.value"
                    :label="option.label"
                    :items="option.options"
                    :filled="false"
                    dense
                    dark
                    hide-details
                    class="mt-2"
                  />
                </li>
              </ul>
            </fieldset>
          </div>
        </li>
      </ul>
    </v-radio-group>
    <slot />
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';

import SIcon from '@stratumfive/ui-baseplate/src/components/SIcon/SIcon.vue';
import SInputSelect from '@stratumfive/ui-baseplate/src/components/SInputSelect/SInputSelect.vue';
import availableStyles, {
  groups,
  CMapOption,
  cMapOptions as defaultMapOptions,
} from '@stratumfive/ui-baseplate/src/components/SOMap/MapStyles';
import { MapStyle } from '../../SMap.interface';

interface MapStyleOption {
  key: MapStyle;
  name: String;
}

export default Vue.extend({
  name: 'SMapStyleMenu',

  components: {
    SIcon,
    SInputSelect,
  },

  inheritAttrs: false,

  props: {
    activeMapStyle: {
      type: String,
      required: true,
    },
    allowCMapOptions: {
      type: Boolean,
      default: false,
    },
    cMapOptions: {
      type: Array,
      default: () => [],
    } as PropOptions<CMapOption[]>,
  },

  data(): any {
    return {
      groups,
      menu: false,
      showCMapOptions: false,
    };
  },

  computed: {
    mapStyles(): MapStyleOption[] {
      // for the purpose of this UI, we don't need the tile URL to be correct
      const styles = availableStyles({ cartoServerURL: '' });

      return Object.keys(styles).map((key) => ({
        key: key as MapStyle,
        name: styles[key].name,
      }));
    },
    selectedStyle: {
      get(): string {
        return this.activeMapStyle;
      },
      set(value: string): void {
        this.$emit('change', {
          property: 'activeMapStyle',
          value,
        });
      },
    },
    /**
     * If we have cMap options set from outside this component, use those.
     * If not, use a set of default values we have.
     */
    cMapLayerOptions(): CMapOption[] {
      return (this.cMapOptions.length)
        ? this.cMapOptions
        : defaultMapOptions.map((option) => ({ ...option, value: option.default }));
    },
  },

  watch: {
    cMapLayerOptions: {
      deep: true,
      immediate: true,
      handler(newVal) {
        this.$emit('change', {
          property: 'cMapOptions',
          value: newVal,
        });
      },
    },
  },

  methods: {
    getLayerName(key) {
      return availableStyles({ cartoServerURL: '' })[key].name;
    },
  },

});
</script>

<style scoped lang="scss">
.map-options-accordion {
  background-color: rgba(0, 5, 20, 0.8);
}

.group + .group {
  border-top: 1px solid $neutral_darken3;
}

.additional-options {
  &,
  ::v-deep .v-label,
  ::v-deep .v-select__selection {
    font-size: 13px;
    color: white;
  }
}

legend {
  width: 100%;
}

.options-toggle {
  width: 100%;

  &:focus {
    outline: none;
  }

  &.open {
    ::v-deep .v-icon {
      transform: rotate(180deg);
    }
  }

  ::v-deep .v-icon {
    transition: transform 0.2s;
  }
}

.tiny-text-input {
  width: 40px;
  background: white;
  border: 1px solid $neutral;
  border-radius: 2px;
  padding: 1px 3px;
}
</style>
