<template>
  <div class="x-chart">
    <h3 class="chart-title">
      X Chart
    </h3>
    <template v-if="chartData && chartData.length">
      <v-chart :forceFit="true" :height="400" :data="chartData" :scale="scale">
        <v-tooltip />
        <!-- <v-axis :label="label" data-key="key" /> -->
        <v-line position="key*value" color="id" />
        <v-point position="key*value" color="id" />
        <v-legend position="bottom" />
      </v-chart>
    </template>
    <template v-else>
      <h4 class="no-data">
        No Data found
      </h4>
    </template>
  </div>
</template>

<script>
const DataSet = require("@antv/data-set");
import colors from "../../utils/colors.util";
import { mapState } from "vuex";

export default {
  name: "ChartX",
  data() {
    return {
      colors,
      scale: [
        {
          dataKey: "key",
          min: 0,
          max: 1
        }
      ],
      label: {
        autoRotate: false,
        textStyle: {
          textBaseline: "top",
          rotate: -25
        }
      }
    };
  },

  computed: {
    ...mapState([
      "dataList",
      "dataAverage",
      "xControlLimits_UCL",
      "xControlLimits_LCL"
    ]),

    chartData() {
      const data = this.dataList.map((obj) => {
        return {
          key: obj.label,
          Value: obj.value,
          CL: this.dataAverage,
          UCL: this.xControlLimits_UCL,
          LCL: this.xControlLimits_LCL
        };
      });

      const dv = new DataSet.View().source(data);

      dv.transform({
        type: "fold",
        fields: ["Value", "CL", "UCL", "LCL"],
        key: "id",
        value: "value"
      });

      return dv.rows;
    }
  }
};
</script>

<style scoped>
.x-chart {
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
