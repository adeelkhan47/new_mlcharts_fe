import util from "../../utils";
import { xBarRChartDataApi } from "../../api";

const UPPER_SPEC_LIMIT_KEY = "xBarR_upper_limit";
const LOWER_SPEC_LIMIT_KEY = "xBarR_lower_limit";
const toFixed = 3;

const xBarRChartDataModule = {
  namespaced: true,

  state: () => ({
    loading: false,
    upperSpecLimit: 8,
    lowerSpecLimit: 1,
    dataList: [],
    averageRange: 0,
    grandAverage: 0,
    subgroupSize: null,
    stdDev: 0,
    cpu: 0,
    cpl: 0,
    cpk: 0,
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

  actions: {
    reset: (ctx) => {
      ctx.commit("reset");
    },

    init: (ctx, { chartId, password, currentChart = {} }) => {
      ctx.commit("loading", true);
      ctx.dispatch("setLimits");

      if (
        currentChart &&
        typeof currentChart === "object" &&
        Object.keys(currentChart).length &&
        currentChart.subgroupSize
      )
        ctx.commit("subgroupSize", currentChart.subgroupSize);

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

    setLimits: (ctx) => {
      let appData = localStorage.getItem("appData");
      if (appData) {
        appData = JSON.parse(appData);

        if (
          appData &&
          typeof appData == "object" &&
          Object.keys(appData).length
        ) {
          if (appData.hasOwnProperty(UPPER_SPEC_LIMIT_KEY))
            ctx.commit("upperSpecLimit", appData[UPPER_SPEC_LIMIT_KEY]);

          if (appData.hasOwnProperty(LOWER_SPEC_LIMIT_KEY))
            ctx.commit("lowerSpecLimit", appData[LOWER_SPEC_LIMIT_KEY]);
        }
      }
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
      const cpu = (ctx.state.upperSpecLimit - grandAverage) / (3 * stdDev);
      const cpl = (grandAverage - ctx.state.lowerSpecLimit) / (3 * stdDev);
      const cpk = Math.min(cpu, cpl);
      const xBarData = util.getXBarDataForXBarR(
        grandAverage,
        averageRange,
        subgroupSize
      );
      const rangeData = util.getRangeDataForXBarR(averageRange, subgroupSize);

      ctx.commit("averageRange", averageRange);
      ctx.commit("grandAverage", grandAverage);
      ctx.commit("stdDev", stdDev);
      ctx.commit("cpu", cpu);
      ctx.commit("cpl", cpl);
      ctx.commit("cpk", cpk);
      ctx.commit("xBarData", xBarData);
      ctx.commit("rangeData", rangeData);
      ctx.commit("loading", false);
    },

    handelLimitChange: (ctx, { upperLimit = null, lowerLimit = null }) => {
      const grandAverage = ctx.state.grandAverage;
      const stdDev = ctx.state.stdDev;
      let cpu = ctx.state.cpu;
      let cpl = ctx.state.cpl;

      if (util.isNumber(upperLimit)) {
        ctx.commit("upperSpecLimit", upperLimit);
        cpu = (upperLimit - grandAverage) / (3 * stdDev);
      }

      if (util.isNumber(lowerLimit)) {
        ctx.commit("lowerSpecLimit", lowerLimit);
        cpl = (grandAverage - lowerLimit) / (3 * stdDev);
      }

      const cpk = Math.min(cpu, cpl);

      ctx.commit("cpu", cpu);
      ctx.commit("cpl", cpl);
      ctx.commit("cpk", cpk);

      let appData = {};
      appData[UPPER_SPEC_LIMIT_KEY] = ctx.state.upperSpecLimit;
      appData[LOWER_SPEC_LIMIT_KEY] = ctx.state.lowerSpecLimit;
      localStorage.setItem("appData", JSON.stringify(appData));
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

    cpu: (state, val) => {
      state.cpu = val;
    },

    cpl: (state, val) => {
      state.cpl = val;
    },

    cpk: (state, val) => {
      state.cpk = val;
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
      state.cpu = 0;
      state.cpl = 0;
      state.cpk = 0;
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
