import util from "../../utils";
import { xBarRChartDataApi } from "../../api";
import constants from "../../utils/constants.util";
import storageHelper from "../../utils/storageHelper.util";

const LOCK_LIMIT_KEY = "X_BAR_R_LOCKED_ROW_INDEX__";

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
    },
    lockedRowIndex: "NONE"
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

        let lockedRow = storageHelper.getStoredData(
          LOCK_LIMIT_KEY + currentChart.chartId
        );
        if (lockedRow !== null && !isNaN(lockedRow)) {
          lockedRow = Number.parseInt(lockedRow);
          ctx.commit("lockedRowIndex", lockedRow);
        }
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
      const subgroupSize = ctx.state.subgroupSize;
      const lowerSpecLimit = util.getNumValOrStr(ctx.state.lowerSpecLimit);
      const upperSpecLimit = util.getNumValOrStr(ctx.state.upperSpecLimit);
      let values = {};
      let range = 0;
      let average = 0;
      let rangeSum = 0;
      let averageSum = 0;
      let cumulativeAverageRange = 0;
      let cumulativeGrandAverage = 0;
      let cumulativeStdDev = 0;
      let averageUCL = 0;
      let averageCL = null;
      let averageLCL = 0;
      let rangeUCL = 0;
      let rangeCL = null;
      let rangeLCL = 0;
      let cumulativeCPL = 0;
      let cumulativeCPU = 0;
      let cumulativeCPK = 0;

      list = list.map((obj, i) => {
        range = 0;
        average = 0;
        values = obj.values || {};
        cumulativeStdDev = 0;
        averageUCL = 0;
        averageLCL = 0;
        rangeUCL = 0;
        rangeLCL = 0;
        cumulativeCPL = 0;
        cumulativeCPU = 0;
        cumulativeCPK = 0;

        if (Object.keys(values).length) {
          range = util.getRangeForXBarR(values);
          average = util.getAverageForXBarR(values);
        }

        rangeSum += range;
        averageSum += average;
        cumulativeAverageRange = util.getCumulativeAverage(rangeSum, i + 1);
        cumulativeGrandAverage = util.getCumulativeAverage(averageSum, i + 1);
        cumulativeStdDev = util.getStdDevForXBarR(
          cumulativeAverageRange,
          subgroupSize
        );
        averageUCL = util.getAverageUCL(
          cumulativeGrandAverage,
          cumulativeAverageRange,
          subgroupSize
        );
        averageLCL = util.getAverageLCL(
          cumulativeGrandAverage,
          cumulativeAverageRange,
          subgroupSize
        );
        rangeUCL = util.getRangeUCL(cumulativeAverageRange, subgroupSize);
        rangeLCL = util.getRangeLCL(cumulativeAverageRange, subgroupSize);
        cumulativeCPL = util.getCumulativeCPL(
          cumulativeGrandAverage,
          cumulativeStdDev,
          lowerSpecLimit
        );
        cumulativeCPU = util.getCumulativeCPU(
          cumulativeGrandAverage,
          cumulativeStdDev,
          upperSpecLimit
        );
        cumulativeCPK = util.getCumulativeCPK(cumulativeCPL, cumulativeCPU);

        if (averageCL === null) {
          averageCL = average;
        }
        if (rangeCL === null) {
          rangeCL = range;
        }

        obj.average = average;
        obj.range = range;
        obj.cumulativeAverageRange = cumulativeAverageRange;
        obj.cumulativeGrandAverage = cumulativeGrandAverage;
        obj.cumulativeStdDev = cumulativeStdDev;
        obj.averageUCL = averageUCL;
        obj.averageCL = averageCL;
        obj.averageLCL = averageLCL;
        obj.rangeUCL = rangeUCL;
        obj.rangeCL = rangeCL;
        obj.rangeLCL = rangeLCL;
        obj.cumulativeCPL = cumulativeCPL;
        obj.cumulativeCPU = cumulativeCPU;
        obj.cumulativeCPK = cumulativeCPK;

        return obj;
      });

      const averageCPK = util.calculateAverage(
        list.map((obj) => obj.cumulativeCPK)
      );

      list = list.map((obj) => {
        obj.averageCPK = averageCPK;
        return obj;
      });

      ctx.commit("dataList", list);

      const ranges = list.map((obj) => obj.range);
      const averages = list.map((obj) => obj.average);
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
    },

    setLockedRowIndex: (ctx, { value, chartId }) => {
      ctx.commit("lockedRowIndex", value);
      storageHelper.storeData(LOCK_LIMIT_KEY + chartId, value);
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

    lockedRowIndex: (state, val) => {
      state.lockedRowIndex = val;
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
      state.lockedRowIndex = "NONE";
    }
  }
};

export default xBarRChartDataModule;
