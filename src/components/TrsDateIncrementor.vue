<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">
        TRS Date Cycler
      </h3>
      <div class="mt-2 max-w-xl text-sm text-gray-500">
        <p>Increment between 202110250202 and 202110250214</p>
        <p>Expect Malou to jump at 202110250203, for correct behaviour.</p>
      </div>
      <form class="mt-5 sm:flex sm:items-center">
        <div class="w-full sm:max-w-xs">
          <label for="email" class="sr-only">Email</label>
          <input
            type="number"
            name="dateNumber"
            id="dateNumber"
            v-model="value"
            @input="$emit('input', value)"
            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  props: {
    modelValue: {
      type: Number,
    },
  },
  setup(props, { emit }) {
    const value = computed({
      get: () => props.modelValue,
      set: (value) => emit("update:modelValue", value),
    });

    return { value };
  },
});
</script>

<style scoped></style>
