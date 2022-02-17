<template>
  <div class="mr-chart">
    <h3 class="chart-title">
      MR Chart
    </h3>
    <template v-if="chartData && chartData.length">
      <v-chart :forceFit="true" :height="400" :data="chartData" :scale="scale">
        <v-tooltip />
        <v-axis :label="label" data-key="key" /> 
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
  name: "ChartMr",
  data() {
    return {
      colors,
      scale: [
        {
          dataKey: "mr"
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
    ...mapState(["dataList", "mr", "mrAverage", "mrControlLimits_UCL"]),

    chartData() {
      let data = [];
      this.mr.forEach((value, key) => {
        data.push({
          key: this.getLabel(key),
          MR: value,
          CL: this.mrAverage,
          UCL: this.mrControlLimits_UCL
        });
      });

      const dv = new DataSet.View().source(data);

      dv.transform({
        type: "fold",
        fields: ["MR", "CL", "UCL"],
        key: "id",
        value: "value"
      });

      return dv.rows;
    }
  },

  methods: {
    getLabel(dataId) {
      if (this.dataList && this.dataList.length) {
        const found = this.dataList.find((obj) => obj.id == dataId);
        if (found) return found.label;
        else return dataId;
      } else return dataId;
    }
  }
};
</script>

<style scoped>
.mr-chart {
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
