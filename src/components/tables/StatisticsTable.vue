<template>
  <div class="st-wrapper">
    <md-table md-card>
      <md-table-row>
        <md-table-head>Label</md-table-head>
        <md-table-head>Value</md-table-head>
      </md-table-row>
      <md-table-row slot="md-table-row">
        <md-table-cell md-label="Label">
          Upper Spec Limit (optional)
        </md-table-cell>
        <md-table-cell md-label="Value">
          <md-field class="input-field">
            <md-input
              :value="upperSpecLimit"
              @change="upperLimitChanged"
              type="number"
              class="spec-input"
            ></md-input>
          </md-field>
        </md-table-cell>
      </md-table-row>
      <md-table-row slot="md-table-row">
        <md-table-cell md-label="Label">
          Lower Spec Limit (optional)
        </md-table-cell>
        <md-table-cell md-label="Value">
          <md-field class="input-field">
            <md-input
              :value="lowerSpecLimit"
              @change="lowerLimitChanged"
              type="number"
              class="spec-input"
            ></md-input>
          </md-field>
        </md-table-cell>
      </md-table-row>
      <md-table-row
        slot="md-table-row"
        v-for="item of tableData"
        :key="item.key"
      >
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
import { mapActions, mapState } from "vuex";
export default {
  name: "StatisticsTable",

  computed: {
    ...mapState("xmrChartDataModule", [
      "dataList",
      "dataAverage",
      "mrAverage",
      "estimatedStdDev",
      "cpu",
      "cpl",
      "cpk",
      "upperSpecLimit",
      "lowerSpecLimit"
    ]),

    tableData() {
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
  },

  methods: {
    ...mapActions("xmrChartDataModule", [
      "setUpperSpecLimit",
      "setLowerSpecLimit"
    ]),

    upperLimitChanged(event) {
      this.setUpperSpecLimit(Number.parseInt(event.target.value));
    },

    lowerLimitChanged(event) {
      this.setLowerSpecLimit(Number.parseInt(event.target.value));
    }
  }
};
</script>

<style scoped>
.st-wrapper {
  width: 350px;
}

.spec-input {
  background: red;
  width: 100px;
}
</style>
