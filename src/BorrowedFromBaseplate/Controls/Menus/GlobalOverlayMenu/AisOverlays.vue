<template>
  <div class="py-2">
    <ul class="reset-list">
      <li>
        <v-switch
          v-model="localEnableOverlay"
          label="Enable AIS Overlay"
          hide-details
          dark
          color="accent"
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: {
    enableOverlay: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    localEnableOverlay: {
      get(): boolean {
        console.log(this.enableOverlay);
        return this.enableOverlay;
      },
      set(value: boolean) {
        console.log(this.enableOverlay);
        this.$emit('update:enableOverlay', value);
      },
    },
  },
});
</script>
