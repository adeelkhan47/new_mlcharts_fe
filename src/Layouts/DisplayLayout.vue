<template>
  <div class="display-layout">
    <statistics-table />
    <limits />
  </div>
</template>

<script>
import StatisticsTable from "../components/tables/StatisticsTable.vue";
import Limits from "../components/inputs/Limits.vue";

export default {
  name: "DisplayLayout",
  components: {
    StatisticsTable,
    Limits
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
