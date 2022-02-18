<template>
  <div class="pt-2">
    <div class="geozone-select-wrapper mb-2">
      <s-input-select
        v-model="filterGroup"
        label="Filter by Group"
        dense
        :filled="false"
        :items="filterOptions"
        :attach="'.map-controls__content__inner'"
        hide-details
      />
    </div>
    <ul class="reset-list">
      <li
        v-for="zone in filteredGeoZones"
        :key="zone.id"
      >
        <v-switch
          v-model="localSelected"
          :label="zone.name"
          :value="zone.id"
          hide-details
          color="accent"
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import SInputSelect from '@stratumfive/ui-baseplate/src/components/SInputSelect/SInputSelect.vue';

export default Vue.extend({
  components: {
    SInputSelect,
  },
  props: {
    allGeoZones: {
      type: Array,
      required: true,
    },
    selectedGeoZones: {
      type: Array,
      required: true,
    } as PropOptions<any[]>,
  },
  data(): any {
    return {
      filterGroup: '', // the name of the group we are showing
    };
  },
  computed: {
    localSelected: {
      get(): number[] { return this.selectedGeoZones; },
      set(val: number[]): void { this.$emit('update:selectedGeoZones', val); },
    },
    filteredGeoZones(): any[] {
      return this.allGeoZones.filter(({ folderName }) => {
        if (!this.filterGroup) return true;
        return folderName === this.filterGroup;
      });
    },
    filterOptions(): string[] {
      const groups = this.allGeoZones
        .map(({ folderName }) => folderName)
        .filter((zone) => !!zone)
        .map((folder) => ({
          text: folder,
          value: folder,
        }));
      return [
        {
          text: 'All Groups',
          value: '',
        },
        ...groups,
      ];
    },
  },
});
</script>

<style lang="scss">
// We have to move the select inputs dropdown in the DOM using the 'attach' prop because of z-index
// WARNING: This CSS is not scoped and will cause issues if we do the same thing with another select
// input. Sorry.
.map-controls__content__inner > .v-menu__content {
  top: 85px !important; // overrides inline styles
  left: 15px !important; // overrides inline styles
}
</style>
