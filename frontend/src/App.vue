<script setup lang="ts">
</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
  </nav>

  <RouterView />
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
</style>
