import util from "../../utils";
import { xBarRChartDataApi } from "../../api";
import constants from "../../utils/constants.util";

const xBarRChartDataModule = {
  namespaced: true,

  state: () => ({
    loading: false,
    upperSpecLimit: "8",
    lowerSpecLimit: "1",
    dataList: [],
    averageRange: 0,
    grandAverage: 0,
    subgroupSize: null,
    stdDev: 0,
    xBarData: {
      ucl: 0,
      cl: 0,
      lcl: 0
    },
    rangeData: {
      ucl: 0,
      cl: 0,
      lcl: 0
    }
  }),

  getters: {
    cpu(state) {
      let temp = {
        label: "",
        value: ""
      };

      const upper = util.convertVal(state.upperSpecLimit);
      if (
        typeof upper === "number" &&
        typeof state.grandAverage === "number" &&
        typeof state.stdDev === "number"
      ) {
        const val = (upper - state.grandAverage) / (3 * state.stdDev);
        if (val !== Infinity && val !== -Infinity) {
          temp.value = val;
          temp.label = val.toFixed(constants.FIXED_POINTS);
        }
      }

      return temp;
    },

    cpl(state) {
      let temp = {
        label: "",
        value: ""
      };

      const lower = util.convertVal(state.lowerSpecLimit);
      if (
        typeof lower === "number" &&
        typeof state.grandAverage === "number" &&
        typeof state.stdDev === "number"
      ) {
        const val = (state.grandAverage - lower) / (3 * state.stdDev);
        if (val !== Infinity && val !== -Infinity) {
          temp.value = val;
          temp.label = val.toFixed(constants.FIXED_POINTS);
        }
      }

      return temp;
    },

    cpk(state, getters) {
      let temp = {
        label: "",
        value: ""
      };

      let cpuVal = getters.cpu.value;
      let cplVal = getters.cpl.value;
      let val = "";

      if (typeof cpuVal === "number" && typeof cplVal === "number")
        val = Math.min(cpuVal, cplVal);
      else if (typeof cpuVal === "number") val = cpuVal;
      else if (typeof cplVal === "number") val = cplVal;

      temp.value = val;
      if (typeof val === "number")
        temp.label = val.toFixed(constants.FIXED_POINTS);

      return temp;
    }
  },

  actions: {
    reset: (ctx) => {
      ctx.commit("reset");
    },

    init: (ctx, { chartId, password, currentChart = {} }) => {
      ctx.commit("loading", true);

      if (
        currentChart &&
        typeof currentChart === "object" &&
        Object.keys(currentChart).length
      ) {
        if (currentChart.subgroupSize)
          ctx.commit("subgroupSize", currentChart.subgroupSize);
        if (currentChart.upperSpecLimit)
          ctx.commit("upperSpecLimit", currentChart.upperSpecLimit);
        if (currentChart.lowerSpecLimit)
          ctx.commit("lowerSpecLimit", currentChart.lowerSpecLimit);
      }

      xBarRChartDataApi
        .getChartData(chartId, password)
        .then((res) => {
          if (res && res.data && res.data.data) {
            ctx.dispatch("populateData", res.data.data || []);
          }
        })
        .catch((err) => {
          console.error("Unable to get chart data :: ", err);
          ctx.commit("loading", false);
        });
    },

    populateData: (ctx, list) => {
      let values = {};
      let range = 0;
      let average = 0;

      list = list.map((obj) => {
        range = 0;
        average = 0;
        values = obj.values || {};
        if (Object.keys(values).length) {
          range = util.getRangeForXBarR(values);
          average = util.getAverageForXBarR(values);
        }
        obj.average = average;
        obj.range = range;
        return obj;
      });

      ctx.commit("dataList", list);

      const ranges = list.map((obj) => obj.range);
      const averages = list.map((obj) => obj.average);
      const subgroupSize = ctx.state.subgroupSize;
      const averageRange = util.calculateAverage(ranges);
      const grandAverage = util.calculateAverage(averages);
      const stdDev = util.getStdDevForXBarR(averageRange, subgroupSize);
      const xBarData = util.getXBarDataForXBarR(
        grandAverage,
        averageRange,
        subgroupSize
      );
      const rangeData = util.getRangeDataForXBarR(averageRange, subgroupSize);

      ctx.commit("averageRange", averageRange);
      ctx.commit("grandAverage", grandAverage);
      ctx.commit("stdDev", stdDev);
      ctx.commit("xBarData", xBarData);
      ctx.commit("rangeData", rangeData);
      ctx.commit("loading", false);
    },

    setUpperSpecLimit: (ctx, val) => {
      ctx.commit("upperSpecLimit", val);
    },

    setLowerSpecLimit: (ctx, val) => {
      ctx.commit("lowerSpecLimit", val);
    },

    addDataItems: (ctx, { chartId, password, records, cb = () => {} }) => {
      if (records instanceof Array && records.length) {
        ctx.commit("loading", true);

        xBarRChartDataApi
          .addChartData(chartId, password, records)
          .then(() => {
            ctx.dispatch("init", { chartId, password });
            cb({
              success: true
            });
          })
          .catch((err) => {
            console.error("Unable to add data item(s)", err);
            ctx.commit("loading", false);
            cb({
              success: false,
              message: err?.response?.data || "Unable to add data item(s)"
            });
          });
      }
    },

    updateDataItems: (ctx, { chartId, password, records }) => {
      ctx.commit("loading", true);
      xBarRChartDataApi
        .updateChartData(chartId, password, records)
        .then(() => {
          ctx.dispatch("init", { chartId, password });
        })
        .catch((err) => {
          console.error("Unable to update data items");
          console.error(err);
          ctx.commit("loading", false);
        });
    },

    removeDataItems: (ctx, { chartId, password, rowIds }) => {
      if (rowIds && rowIds.length) {
        ctx.commit("loading", true);
        xBarRChartDataApi
          .removeChartData(chartId, password, rowIds)
          .then(() => {
            ctx.dispatch("init", { chartId, password });
          })
          .catch((err) => {
            console.error("Unable to update data items");
            console.error(err);
            ctx.commit("loading", false);
          });
      }
    }
  },

  mutations: {
    loading: (state, val) => {
      state.loading = val;
    },

    dataList: (state, val) => {
      state.dataList = val;
    },

    upperSpecLimit: (state, val) => {
      state.upperSpecLimit = val;
    },

    lowerSpecLimit: (state, val) => {
      state.lowerSpecLimit = val;
    },

    averageRange: (state, val) => {
      state.averageRange = val;
    },

    grandAverage: (state, val) => {
      state.grandAverage = val;
    },

    subgroupSize: (state, val) => {
      state.subgroupSize = val;
    },

    stdDev: (state, val) => {
      state.stdDev = val;
    },

    xBarData: (state, val) => {
      state.xBarData = val;
    },

    rangeData: (state, val) => {
      state.rangeData = val;
    },

    reset: (state) => {
      state.dataList = [];
      state.averageRange = 0;
      state.grandAverage = 0;
      state.subgroupSize = null;
      state.stdDev = 0;
      state.xBarData = {
        ucl: 0,
        cl: 0,
        lcl: 0
      };
      state.rangeData = {
        ucl: 0,
        cl: 0,
        lcl: 0
      };
    }
  }
};

export default xBarRChartDataModule;