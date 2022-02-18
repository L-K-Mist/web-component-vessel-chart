<template>
  <v-expansion-panels
    v-model="panel"
    class="ExpandingList density-map-accordion"
    accordion
  >
    <v-expansion-panel
      v-for="group in groupedFields"
      :key="group.name"
      class="expansion-panel"
    >
      <v-expansion-panel-header class="accordion-header">
        {{ group.name }}
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
          <v-layout
            v-for="field in group.items"
            :key="field.value"
            class="py-1"
            align-center
          >
            <slot :field="field" />
          </v-layout>
        </v-card-text>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';

import SIcon from '@stratumfive/ui-baseplate/src/components/SIcon/SIcon.vue';

interface FieldGroup {
  name: String,
  items: object[],
}

/**
 * Renders mulitple field groups, each in their own expanding panel
 */
export default Vue.extend({
  name: 'SMapExpandingList',

  components: {
    SIcon,
  },

  props: {
    groupedFields: {
      type: Array,
      required: true,
    } as PropOptions<FieldGroup[]>,
  },


  data(): any {
    return {
      panel: null,
    };
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

.density-map-accordion {
  border-radius: 0;
}

.accordion-header {
  background-color: rgba(0, 5, 20, 0.8);
  color: white;
}
</style>
