<template>
  <div class="st-wrapper">
    <md-table v-model="data" md-card md-fixed-header>
      <md-table-row slot="md-table-row" slot-scope="{ item }">
        <md-table-cell md-label="Label">
          {{ item.key }}
        </md-table-cell>
        <md-table-cell md-label="Value">
          {{ item.value }}
        </md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "StatisticsTable",

  computed: {
    ...mapState([
      "dataList",
      "dataAverage",
      "mrAverage",
      "estimatedStdDev",
      "cpu",
      "cpl",
      "cpk"
    ]),

    data() {
      return [
        {
          key: "Avg. Moving Range",
          value: this.mrAverage
        },
        {
          key: "Data Average",
          value: this.dataAverage
        },
        {
          key: "Estimated Std Dev",
          value: this.estimatedStdDev
        },
        {
          key: "Data Count",
          value: this.dataList.length
        },
        {
          key: "Cpu",
          value: this.cpu
        },
        {
          key: "Cpl",
          value: this.cpl
        },
        {
          key: "Cpk",
          value: this.cpk
        }
      ];
    }
  }
};
</script>

<style scoped>
.st-wrapper {
  width: 350px;
}
</style>
