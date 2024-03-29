import util from "../../utils";
import { xmrChartDataApi } from "../../api";
import constants from "../../utils/constants.util";
import storageHelper from "../../utils/storageHelper.util";

const LOCK_LIMIT_KEY = constants.INDIVIDUALS_CHART_LOCK_LIMIT_KEY;

const xmrChartDataModule = {
  namespaced: true,

  state: () => ({
    loading: false,
    upperSpecLimit: "",
    lowerSpecLimit: "",
    dataList: [],
    lockedRowIndex: "NONE",
    dataset: {
      cpl: "",
      cpu: "",
      cpk: "",
      stdDev: "",
      average: ""
    }
  }),

  getters: {
    cpu(state) {
      let temp = {
        label: "",
        value: ""
      };

      const lockedRow = getLockedRow(state.lockedRowIndex, state.dataList);
      if (
        lockedRow &&
        typeof lockedRow === "object" &&
        typeof lockedRow.cumulativeCPU === "number"
      ) {
        temp.value = lockedRow.cumulativeCPU;
        temp.label = lockedRow.cumulativeCPU.toFixed(constants.FIXED_POINTS);
      }

      return temp;
    },

    cpl: (state) => {
      let temp = {
        label: "",
        value: ""
      };

      const lockedRow = getLockedRow(state.lockedRowIndex, state.dataList);
      if (
        lockedRow &&
        typeof lockedRow === "object" &&
        typeof lockedRow.cumulativeCPL === "number"
      ) {
        temp.value = lockedRow.cumulativeCPL;
        temp.label = lockedRow.cumulativeCPL.toFixed(constants.FIXED_POINTS);
      }

      return temp;
    },

    cpk: (state) => {
      let temp = {
        label: "",
        value: ""
      };

      const lockedRow = getLockedRow(state.lockedRowIndex, state.dataList);
      if (
        lockedRow &&
        typeof lockedRow === "object" &&
        typeof lockedRow.cumulativeCPK === "number"
      ) {
        temp.value = lockedRow.cumulativeCPK;
        temp.label = lockedRow.cumulativeCPK.toFixed(constants.FIXED_POINTS);
      }

      return temp;
    },

    xChartData: (state) => {
      let temp = {
        ucl: 0,
        cl: 0,
        lcl: 0
      };
      const lockedRowIndex = state.lockedRowIndex === "NONE" ? constants.DEFAULT_LOCK_LIMIT_FOR_INDIVIDUALS_CHART : state.lockedRowIndex;
      const lockedRow = getLockedRow(lockedRowIndex, state.dataList);
      if (
        lockedRow &&
        typeof lockedRow === "object" &&
        Object.keys(lockedRow).length
      ) {
        temp.ucl = lockedRow.xUCL;
        temp.cl = lockedRow.xCL;
        temp.lcl = lockedRow.xLCL;
      }

      return temp;
    },

    mrChartData: (state) => {
      let temp = {
        ucl: 0,
        cl: 0
      };

      const lockedRow = getLockedRow(state.lockedRowIndex, state.dataList);
      if (
        lockedRow &&
        typeof lockedRow === "object" &&
        Object.keys(lockedRow).length
      ) {
        temp.ucl = lockedRow.mrUCL;
        temp.cl = lockedRow.mrCL;
      }

      return temp;
    },

    cumulativeAverage: (state) => {
      let temp = 0;

      const lockedRow = getLockedRow(state.lockedRowIndex, state.dataList);
      if (
        lockedRow &&
        typeof lockedRow === "object" &&
        typeof lockedRow.cumulativeAverage === "number"
      ) {
        temp = lockedRow.cumulativeAverage;
      }

      return temp;
    },

    cumulativeAverageMR: (state) => {
      let temp = 0;

      const lockedRow = getLockedRow(state.lockedRowIndex, state.dataList);
      if (
        lockedRow &&
        typeof lockedRow === "object" &&
        typeof lockedRow.cumulativeAverageMR === "number"
      ) {
        temp = lockedRow.cumulativeAverageMR;
      }

      return temp;
    },

    cumulativeStdDev: (state) => {
      let temp = 0;

      const lockedRow = getLockedRow(state.lockedRowIndex, state.dataList);
      if (
        lockedRow &&
        typeof lockedRow === "object" &&
        typeof lockedRow.cumulativeStdDev === "number"
      ) {
        temp = lockedRow.cumulativeStdDev;
      }

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
        if (currentChart.hasOwnProperty("upperSpecLimit"))
          ctx.commit("upperSpecLimit", currentChart.upperSpecLimit);
        if (currentChart.hasOwnProperty("lowerSpecLimit"))
          ctx.commit("lowerSpecLimit", currentChart.lowerSpecLimit);

        let lockedRow = storageHelper.getStoredData(
          LOCK_LIMIT_KEY + currentChart.chartId
        );
        if (lockedRow !== null && !isNaN(lockedRow)) {
          lockedRow = Number.parseInt(lockedRow);
          ctx.commit("lockedRowIndex", lockedRow);
        }
        else ctx.commit("lockedRowIndex", "NONE");
      }

      xmrChartDataApi
        .getAllData(chartId, password)
        .then((res) => {
          if (res && res.data && res.data.data) {
            ctx.dispatch("populateData", res.data.data);
          }
        })
        .catch((err) => {
          console.error("Unable to get all data :: ", err);
          ctx.commit("loading", false);
        });
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
      let sampleStdDev = 0;
      let cumulativePPL = 0;
      let cumulativePPU = 0;
      let cumulativePPK = 0;
      let cp = 0;
      let pp = 0;

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
          sampleStdDev = "";
          cumulativePPL = "";
          cumulativePPU = "";
          cumulativePPK = "";
          cp = "";
          pp = "";
        } else {
          mrSum += movingRange;
          cumulativeAverageMR = util.getCumulativeAverage(mrSum, i);
          cumulativeStdDev = util.getStdDevForXMR(cumulativeAverageMR);
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
          sampleStdDev = util.calculateSampleStdDev(list.slice(0, i + 1).map(obj => obj.value));
          cumulativePPL = util.getCPL_ForXMR(
            cumulativeAverage,
            sampleStdDev,
            lowerSpecLimit
          );;
          cumulativePPU = util.getCPU_ForXMR(
            cumulativeAverage,
            sampleStdDev,
            upperSpecLimit
          );
          cumulativePPK = util.getCumulativeCPK(cumulativePPL, cumulativePPU);
          cp = util.getCP(upperSpecLimit, lowerSpecLimit, cumulativeStdDev);
          pp = util.getPP(upperSpecLimit, lowerSpecLimit, sampleStdDev);
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
        obj.sampleStdDev = sampleStdDev;
        obj.cumulativePPL = cumulativePPL;
        obj.cumulativePPU = cumulativePPU;
        obj.cumulativePPK = cumulativePPK;
        obj.cp = cp;
        obj.pp = pp;

        return obj;
      });

      const averageCumulativeCPK = util.calculateAverage(
        list.map((obj) => obj.cumulativeCPK)
      );
      const averageCumulativePPK = util.calculateAverage(
        list.map((obj) => obj.cumulativePPK)
      );
      const averageMR = list.length > 1 ? mrSum / (list.length - 1) : "";
      const stdDev = util.getStdDevForXMR(averageMR);
      const datasetAverage = util.calculateAverage(list.map(obj => obj.value));
      const cpl = util.getCPL_ForXMR(
        datasetAverage,
        stdDev,
        lowerSpecLimit
      );
      const cpu = util.getCPU_ForXMR(
        datasetAverage,
        stdDev,
        upperSpecLimit
      );
      const cpk = util.getCumulativeCPK(cpl, cpu);

      list = list.map((obj) => {
        obj.averageCumulativeCPK = averageCumulativeCPK;
        obj.averageCumulativePPK = averageCumulativePPK;
        return obj;
      });

      ctx.commit("dataset", {
        average: datasetAverage,
        stdDev,
        cpl,
        cpu,
        cpk
      });
      ctx.commit("dataList", list);
      ctx.commit("loading", false);
    },

    addDataItem: (ctx, { numberList, chartId, password, cb = () => { } }) => {
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
            reference: "",
            note: ""
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

    addDataItems: (ctx, { itemList, chartId, password, cb = () => { } }) => {
      if (itemList && itemList instanceof Array && itemList.length) {
        ctx.commit("loading", true);
        const dataList = itemList.map((itemObj) => {
          return {
            chartId,
            label: itemObj.label || "",
            value: itemObj.value,
            reference: itemObj.reference || "",
            note: itemObj.note || ""
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
      { chartId, password, id, label, value, reference, note }
    ) => {
      if (id && util.isNumber(value)) {
        ctx.commit("loading", true);
        xmrChartDataApi
          .updateData(chartId, password, id, label, value, reference, note)
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
      ctx.dispatch("populateData", ctx.state.dataList);
    },

    setLowerSpecLimit: (ctx, val) => {
      ctx.commit("lowerSpecLimit", val);
      ctx.dispatch("populateData", ctx.state.dataList);
    },

    setLockedRowIndex: (ctx, { value, chartId }) => {
      ctx.commit("lockedRowIndex", value);
      storageHelper.storeData(LOCK_LIMIT_KEY + chartId, value);
    }
  },

  mutations: {
    addData: (state, obj) => {
      // adding data
      let list = JSON.parse(JSON.stringify(state.dataList));
      list.push(obj);
      state.dataList = list;
    },

    updateData: (state, { key, value }) => {
      // updating data
      state.dataList = state.dataList.map((obj) => {
        if (obj.key === key) obj.value = value;
        return obj;
      });
    },

    removeData: (state, key) => {
      // removing Data
      state.dataList = state.dataList.filter((obj) => obj.key != key);
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
    },

    lockedRowIndex: (state, val) => {
      state.lockedRowIndex = val;
    },

    dataset: (state, datasetPayload) => {
      let dataset = {
        ...state.dataset,
        ...datasetPayload
      };
      state.dataset = dataset;
    },
  }
};

function getLockedRow(lockedRowIndex, dataList) {
  let lockedRow = "NONE";
  if (typeof lockedRowIndex === "number" && lockedRowIndex < dataList.length) {
    lockedRow = dataList[lockedRowIndex];
  } else if (dataList.length && lockedRow === "NONE")
    lockedRow = dataList[dataList.length - 1];

  return lockedRow;
}

export default xmrChartDataModule;
