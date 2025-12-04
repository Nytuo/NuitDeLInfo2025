<script setup lang="ts">
defineProps<{ msg?: string }>()
</script>

<template>
  <h1>{{ msg ?? 'Hello World' }}</h1>
</template>

<style scoped>
h1 {
  color: #42b883;
  font-family: Arial, sans-serif;
}
</style>
