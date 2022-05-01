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
import util from "../../utils";
const DataSet = require("@antv/data-set");
import { mapGetters, mapState } from "vuex";

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
      height: 300,
      label: {
        formatter: formatter
      }
    };
  },

  computed: {
    ...mapState("xmrChartDataModule", ["dataList"]),

    ...mapGetters("xmrChartDataModule", ["cumulativeStdDev"]),

    chartData() {
      const values = this.dataList.map((obj) => obj.value);
      const binWidth = Math.ceil(this.cumulativeStdDev);
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
      return dv.rows.map((obj) => {
        if (obj.value && obj.value.length) {
          obj.value = obj.value.map((v) => util.formatNumber(v));
        }
        return obj;
      });
    }
  }
};
</script>

<style scoped>
.histogram {
  margin: 25px 5px;
  position: relative;
  width: 100%;
  margin-bottom: 0px;
}

.chart-title {
  text-align: center;
}

.no-data {
  color: grey;
  text-align: center;
}
</style>
