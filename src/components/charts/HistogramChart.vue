<template>
  <div class="histogram">
    <h3 class="chart-title">Histogram Chart</h3>
    <template v-if="chartData && chartData.length">
      <v-chart
        :forceFit="true"
        :height="height"
        :data="chartData"
        :scale="scale"
      >
        <v-tooltip :crosshairs="false" :inPlot="false" position="top" />
        <v-axis dataKey="value" :label="label" />
        <v-bar position="value*count" />
      </v-chart>
    </template>
    <template v-else>
      <h4 class="no-data">No Data found</h4>
    </template>
  </div>
</template>

<script>
const DataSet = require("@antv/data-set");
import { mapState } from "vuex";

const formatter = (val) => {
  if (val % 2) {
    return val;
  }
  return "";
};

export default {
  name: "ChartHistogram",
  data() {
    return {
      scale: [
        {
          dataKey: "value",
          nice: false,
          min: 0,
          tickInterval: 1
        }
      ],
      height: 400,
      label: { formatter: formatter }
    };
  },

  computed: {
    ...mapState("xmrChartDataModule", ["dataList", "estimatedStdDev"]),

    chartData() {
      const values = this.dataList.map((obj) => obj.value);
      const binWidth = Math.ceil(this.estimatedStdDev);
      let minScale = Math.min(...values) || 0;

      if (minScale < binWidth) minScale = 0;

      this.scale[0].min = minScale;
      const sourceData = values.map((value) => ({ value }));

      const dv = new DataSet.View().source(sourceData);
      dv.transform({
        type: "bin.histogram",
        field: "value",
        binWidth,
        as: ["value", "count"]
      });
      return dv.rows;
    }
  }
};
</script>

<style scoped>
.histogram {
  margin: 20px 5px;
  position: relative;
  width: 100%;
}

.chart-title {
  text-align: center;
}

.no-data {
  color: grey;
  text-align: center;
}
</style>
