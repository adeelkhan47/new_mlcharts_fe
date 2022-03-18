<template>
  <div class="display-layout">
    <statistics-table />
  </div>
</template>

<script>
import StatisticsTable from "../components/tables/StatisticsTable.vue";

export default {
  name: "DisplayLayout",
  components: {
    StatisticsTable
  }
};
</script>

<style scoped>
.display-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  gap: 10px;
}
</style>
