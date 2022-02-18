<template>
  <div class="s-map-zoom elevation-2">
    <button
      slot="activator"
      class="s-map-zoom__button"
      type="button"
      aria-label="Zoom in"
      :disabled="zoomInDisabled"
      @click="zoomIn()"
    >
      <v-icon
        size="14"
        color="black"
      >
        add
      </v-icon>
    </button>
    <button
      slot="activator"
      class="s-map-zoom__button"
      type="button"
      aria-label="Zoom out"
      :disabled="zoomOutDisabled"
      @click="zoomOut()"
    >
      <v-icon
        size="14"
        color="black"
      >
        remove
      </v-icon>
    </button>

    <transition name="fade">
      <button
        v-if="showResetZoom"
        class="reset-zoom elevation-2"
        type="button"
        @click="resetZoom()"
      >
        Reset Zoom
      </button>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * Zoom controls
 */
export default Vue.extend({
  name: 'SMapZoomControls',
  components: {},
  props: {
    zoomIn: {
      type: Function,
      required: true,
    },
    zoomOut: {
      type: Function,
      required: true,
    },
    resetZoom: {
      type: Function,
      required: true,
    },
    zoomOutDisabled: {
      type: Boolean,
      required: true,
    },
    zoomInDisabled: {
      type: Boolean,
      required: true,
    },
    showResetZoom: {
      type: Boolean,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.s-map-zoom {
  border-radius: 3px;
  bottom: 10px;
  position: absolute;
  right: 10px;
  z-index: $map_z-index + 1;
  background-color: #fff;
}

.s-map-zoom__button {
  align-items: center;
  display: flex;
  height: 40px;
  justify-content: center;
  padding: 5px;
  transition: background-color 0.1s ease-in, opacity 0.3s ease-in-out;
  width: 40px;

  &:first-child {
    border-bottom: 1px solid $neutral_lighten2;
  }

  &:focus-visible {
    background-color: $neutral_lighten4;
  }

  &:focus {
    outline: 0;
  }

  &:not([disabled]):hover {
    background-color: $neutral_lighten4;
  }

  &[disabled] {
    opacity: 0.25;
  }
}

.reset-zoom {
  background: white;
  border-radius: 3px;
  bottom: 0;
  font-size: 13px;
  line-height: 1;
  margin-right: 10px;
  padding: 6px 10px 5px;
  position: absolute;
  right: 40px;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
