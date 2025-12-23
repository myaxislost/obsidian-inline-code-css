<script setup lang="ts">
const props = defineProps<{
  clsNames: string[];
  value?: string;
}>();
</script>

<template>
  <span class="inline-test"  :class="props.clsNames">
    {{ props.value }}
  </span>
</template>

<style>
.inline-test {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
  margin: 0;
  border-radius: 5px;
  font-size: 0.9em;

  border: 1px solid var(--background-modifier-border);
  color: var(--text-normal);
  margin-bottom: 4px;
}

</style>
