<template>
  <div class="x-chart">
    <h3 class="chart-title">{{ title }}</h3>
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
      <h4 class="no-data">No Data found</h4>
    </template>
  </div>
</template>

<script>
const DataSet = require("@antv/data-set");
import colors from "../../utils/colors.util";

export default {
  name: "ProcessCapabilityRatios",

  props: {
    title: {
      type: String,
      default: "Process Capability Ratios (Cumulative)"
    },
    dataList: {
      type: Array
    },
    formattedDataList: {
      type: Array
    }
  },

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
          rotate: 270
        },
        formatter: this.getLabel
      }
    };
  },

  computed: {
    chartData() {
      const dv = new DataSet.View().source(this.formattedDataList);
      let fields = ["cpk"];
      dv.transform({
        type: "fold",
        fields: fields,
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
        else return "";
      } else return "";
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
