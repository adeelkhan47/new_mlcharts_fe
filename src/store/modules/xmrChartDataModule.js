import util from "../../utils";
import { xmrChartDataApi } from "../../api";
import constants from "../../utils/constants.util";

const X_CONTROL_LIMITS_CONST = 1.128;
const MR_UCL_CONST = 3.268;
const toFixed = 3;

const xmrChartDataModule = {
  namespaced: true,

  state: () => ({
    loading: false,
    upperSpecLimit: "20",
    lowerSpecLimit: "10",
    dataList: [],
    mr: new Map(),
    dataAverage: 0,
    mrAverage: 0,
    estimatedStdDev: 0,
    xControlLimits_UCL: 0,
    xControlLimits_LCL: 0,
    mrControlLimits_UCL: 0
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
        typeof state.dataAverage === "number" &&
        typeof state.estimatedStdDev === "number"
      ) {
        const val = (upper - state.dataAverage) / (3 * state.estimatedStdDev);
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
        typeof state.dataAverage === "number" &&
        typeof state.estimatedStdDev === "number"
      ) {
        const val = (state.dataAverage - lower) / (3 * state.estimatedStdDev);
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
    init: (ctx, { chartId, password, currentChart = {} }) => {
      ctx.commit("loading", true);

      if (
        currentChart &&
        typeof currentChart === "object" &&
        Object.keys(currentChart).length
      ) {
        if (currentChart.upperSpecLimit)
          ctx.commit("upperSpecLimit", currentChart.upperSpecLimit);
        if (currentChart.lowerSpecLimit)
          ctx.commit("lowerSpecLimit", currentChart.lowerSpecLimit);
      }

      xmrChartDataApi
        .getAllData(chartId, password)
        .then((res) => {
          if (res && res.data && res.data.data) {
            // ctx.commit("dataList", res.data.data);

            // ctx.commit("setMovingRange");

            // ctx.dispatch("populate");

            ctx.dispatch("populateData", res.data.data);
          }
        })
        .catch((err) => {
          console.error("Unable to get all data :: ", err);
          ctx.commit("loading", false);
        });
    },

    populate: (ctx) => {
      ctx.commit("loading", true);
      const dataValues = ctx.state.dataList.map((obj) => obj.value);
      const dataAverage = util.calculateAverage(dataValues);
      ctx.commit("dataAverage", dataAverage);

      let mrValues = Array.from(ctx.state.mr.values());
      if (mrValues.length) {
        if (mrValues.length == 1) mrValues = [];
        else mrValues = mrValues.slice(1);
      }
      const mrAverage = util.calculateAverage(mrValues);
      ctx.commit("mrAverage", mrAverage);

      const std = mrAverage / X_CONTROL_LIMITS_CONST;
      ctx.commit("estimatedStdDev", std);

      const ucl = dataAverage + 3 * std;
      ctx.commit("xControlLimits_UCL", ucl);

      const lcl = dataAverage - 3 * std;
      ctx.commit("xControlLimits_LCL", lcl);

      const mr_UCL = MR_UCL_CONST * mrAverage;
      ctx.commit("mrControlLimits_UCL", mr_UCL);

      ctx.dispatch("populateCPX", {
        std,
        mrAverage,
        dataAverage
      });
    },

    populateCPX: (ctx, payload) => {
      if (!payload) payload = {};
      let { std = null, mrAverage = null, dataAverage = null } = payload;
      if (mrAverage === null) mrAverage = ctx.state.mrAverage;
      if (std === null) std = mrAverage / X_CONTROL_LIMITS_CONST;
      if (dataAverage === null) dataAverage = ctx.state.dataAverage;

      ctx.commit("loading", false);
    },

    populateData: (ctx, list) => {
      ctx.commit("loading", true);

      const lowerSpecLimit = util.getNumValOrStr(ctx.state.lowerSpecLimit);
      const upperSpecLimit = util.getNumValOrStr(ctx.state.upperSpecLimit);
      let prev = null;
      let curr = null;
      let movingRange = "";
      let valuesSum = 0;
      let mrSum = 0;
      let cumulativeAverage = 0;
      let cumulativeAverageMR = 0;
      let cumulativeStdDev = 0;
      let xUCL = 0;
      let xCL = 0;
      let xLCL = 0;
      let mrUCL = 0;
      let mrCL = 0;
      let cumulativeCPL = 0;
      let cumulativeCPU = 0;
      let cumulativeCPK = 0;

      list = list.map((obj, i) => {
        prev = curr;
        curr = obj.value;
        movingRange = util.getMovingRangeForXMR(prev, curr, i);
        valuesSum += obj.value;
        cumulativeAverage = util.getCumulativeAverage(valuesSum, i + 1);
        xCL = cumulativeAverage;
        if (typeof movingRange === "string") {
          mrSum = 0;
          cumulativeAverageMR = "";
          cumulativeStdDev = "";
          xUCL = "";
          xLCL = "";
          mrUCL = "";
          mrCL = "";
          cumulativeCPL = "";
          cumulativeCPU = "";
          cumulativeCPK = "";
        } else {
          mrSum += movingRange;
          cumulativeAverageMR = util.getCumulativeAverage(mrSum, i + 1);
          cumulativeStdDev =
            util.getCumulativeStdDevForXMR(cumulativeAverageMR);
          xUCL = util.getX_UCL_ForXMR(cumulativeAverage, cumulativeAverageMR);
          xLCL = util.getX_LCL_ForXMR(cumulativeAverage, cumulativeAverageMR);
          mrUCL = util.getMrUCLForXMR(cumulativeAverageMR);
          mrCL = cumulativeAverageMR;
          cumulativeCPL = util.getCPL_ForXMR(
            cumulativeAverage,
            cumulativeStdDev,
            lowerSpecLimit
          );
          cumulativeCPU = util.getCPU_ForXMR(
            cumulativeAverage,
            cumulativeStdDev,
            upperSpecLimit
          );
          cumulativeCPK = util.getCumulativeCPK(cumulativeCPL, cumulativeCPU);
        }

        obj.movingRange = movingRange;
        obj.cumulativeAverage = cumulativeAverage;
        obj.cumulativeAverageMR = cumulativeAverageMR;
        obj.cumulativeStdDev = cumulativeStdDev;
        obj.xUCL = xUCL;
        obj.xCL = xCL;
        obj.xLCL = xLCL;
        obj.mrUCL = mrUCL;
        obj.mrCL = mrCL;
        obj.cumulativeCPL = cumulativeCPL;
        obj.cumulativeCPU = cumulativeCPU;
        obj.cumulativeCPK = cumulativeCPK;

        return obj;
      });

      const averageCumulativeCPK = util.calculateAverage(
        list.map((obj) => obj.cumulativeCPK)
      );
      list = list.map((obj) => {
        obj.averageCumulativeCPK = averageCumulativeCPK;
        return obj;
      });

      ctx.commit("dataList", list);
      ctx.commit("loading", false);
    },

    addDataItem: (ctx, { numberList, chartId, password, cb = () => {} }) => {
      if (
        chartId &&
        numberList &&
        numberList instanceof Array &&
        numberList.length
      ) {
        ctx.commit("loading", true);
        const dataList = numberList.map((value) => {
          return {
            chartId,
            label: "",
            value,
            reference: ""
          };
        });

        xmrChartDataApi
          .createData(dataList, password)
          .then(() => {
            ctx.dispatch("init", { chartId, password });
            cb({
              success: true
            });
          })
          .catch((err) => {
            console.error("Unable to add data item", err);
            ctx.commit("loading", false);
            cb({
              success: false,
              message: err?.response?.data || "Unable to add data item"
            });
          });
      }
    },

    addDataItems: (ctx, { itemList, chartId, password, cb = () => {} }) => {
      if (itemList && itemList instanceof Array && itemList.length) {
        ctx.commit("loading", true);
        const dataList = itemList.map((itemObj) => {
          return {
            chartId,
            label: itemObj.label || "",
            value: itemObj.value,
            reference: itemObj.reference || ""
          };
        });

        xmrChartDataApi
          .createData(dataList, password)
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

    updateDataItem: (
      ctx,
      { chartId, password, id, label, value, reference }
    ) => {
      if (id && util.isNumber(value)) {
        ctx.commit("loading", true);
        xmrChartDataApi
          .updateData(chartId, password, id, label, value, reference)
          .then(() => {
            ctx.dispatch("init", { chartId, password });
          })
          .catch((err) => {
            console.error("Unable to update data item :: ", id);
            console.error(err);
            ctx.commit("loading", false);
          });
      }
    },

    updateDataItems: (ctx, { chartId, password, dataObjectList }) => {
      ctx.commit("loading", true);
      xmrChartDataApi
        .updateMany(chartId, password, dataObjectList)
        .then(() => {
          ctx.dispatch("init", { chartId, password });
        })
        .catch((err) => {
          console.error("Unable to update data items");
          console.error(err);
          ctx.commit("loading", false);
        });
    },

    removeDataItem: (ctx, { chartId, password, dataId }) => {
      if (dataId) {
        ctx.commit("loading", true);
        xmrChartDataApi
          .deleteData(chartId, password, dataId)
          .then(() => {
            ctx.dispatch("init", { chartId, password });
          })
          .catch((err) => {
            console.error("Unable to update data item :: ", id);
            console.error(err);
            ctx.commit("loading", false);
          });
      }
    },

    removeDataItems: (ctx, { chartId, password, dataIds }) => {
      if (dataIds && dataIds.length) {
        ctx.commit("loading", true);
        xmrChartDataApi
          .deleteMany(chartId, password, dataIds)
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

    setUpperSpecLimit: (ctx, val) => {
      ctx.commit("upperSpecLimit", val);
    },

    setLowerSpecLimit: (ctx, val) => {
      ctx.commit("lowerSpecLimit", val);
    }
  },

  mutations: {
    addData: (state, obj) => {
      // adding data
      let list = JSON.parse(JSON.stringify(state.dataList));
      list.push(obj);
      state.dataList = list;

      // adding MR
      state.mr = util.getMrMap(list);
    },

    updateData: (state, { key, value }) => {
      // updating data
      state.dataList = state.dataList.map((obj) => {
        if (obj.key === key) obj.value = value;
        return obj;
      });

      // updating MR
      state.mr = util.getMrMap(state.dataList);
    },

    removeData: (state, key) => {
      // removing Data
      state.dataList = state.dataList.filter((obj) => obj.key != key);

      // removing MR
      state.mr = util.getMrMap(state.dataList);
    },

    setMovingRange: (state) => {
      state.mr = util.getMrMap(state.dataList);
    },

    dataAverage: (state, val) => {
      state.dataAverage = val;
    },

    mrAverage: (state, val) => {
      state.mrAverage = Number.parseFloat(val).toFixed(toFixed);
    },

    estimatedStdDev: (state, val) => {
      state.estimatedStdDev = val;
    },

    xControlLimits_UCL: (state, val) => {
      state.xControlLimits_UCL = Number.parseFloat(val).toFixed(toFixed);
    },

    xControlLimits_LCL: (state, val) => {
      state.xControlLimits_LCL = Number.parseFloat(val).toFixed(toFixed);
    },

    mrControlLimits_UCL: (state, val) => {
      state.mrControlLimits_UCL = Number.parseFloat(val).toFixed(toFixed);
    },

    dataList: (state, val) => {
      state.dataList = val;
    },

    upperSpecLimit: (state, val) => {
      if (typeof val === "number") val = JSON.stringify(val);
      state.upperSpecLimit = val;
    },

    lowerSpecLimit: (state, val) => {
      if (typeof val === "number") val = JSON.stringify(val);
      state.lowerSpecLimit = val;
    },

    loading: (state, val) => {
      state.loading = val;
    }
  }
};

export default xmrChartDataModule;
