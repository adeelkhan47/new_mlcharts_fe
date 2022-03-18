import util from "../../utils";
import { xmrChartDataApi } from "../../api";

const X_CONTROL_LIMITS_CONST = 1.128;
const MR_UCL_CONST = 3.268;
const toFixed = 3;

const xmrChartDataModule = {
  namespaced: true,

  state: () => ({
    loading: false,
    upperSpecLimit: 20,
    lowerSpecLimit: 10,
    dataList: [],
    mr: new Map(),
    dataAverage: 0,
    mrAverage: 0,
    estimatedStdDev: 0,
    xControlLimits_UCL: 0,
    xControlLimits_LCL: 0,
    mrControlLimits_UCL: 0,
    cpu: 0,
    cpl: 0,
    cpk: 0
  }),

  actions: {
    init: (ctx, { chartId, password }) => {
      ctx.commit("loading", true);
      let appData = localStorage.getItem("appData");
      if (appData) {
        appData = JSON.parse(appData);

        if (
          appData &&
          typeof appData == "object" &&
          Object.keys(appData).length
        ) {
          if (appData.hasOwnProperty("upperSpecLimit"))
            ctx.commit("upperSpecLimit", appData["upperSpecLimit"]);

          if (appData.hasOwnProperty("lowerSpecLimit"))
            ctx.commit("lowerSpecLimit", appData["lowerSpecLimit"]);
        }
      }

      xmrChartDataApi
        .getAllData(chartId, password)
        .then((res) => {
          if (res && res.data && res.data.data) {
            ctx.commit("dataList", res.data.data);

            ctx.commit("setMovingRange");

            ctx.dispatch("populate");
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
      ctx.commit("dataAverage", util.average(dataValues));

      let mrValues = Array.from(ctx.state.mr.values());
      if (mrValues.length) {
        if (mrValues.length == 1) mrValues = [];
        else mrValues = mrValues.slice(1);
      }
      ctx.commit("mrAverage", util.average(mrValues));

      const std = ctx.state.mrAverage / X_CONTROL_LIMITS_CONST;
      ctx.commit("estimatedStdDev", std);

      const ucl = ctx.state.dataAverage + 3 * std;
      ctx.commit("xControlLimits_UCL", ucl);

      const lcl = ctx.state.dataAverage - 3 * std;
      ctx.commit("xControlLimits_LCL", lcl);

      const mr_UCL = MR_UCL_CONST * ctx.state.mrAverage;
      ctx.commit("mrControlLimits_UCL", mr_UCL);

      ctx.dispatch("populateCPX");
    },

    populateCPX: (ctx) => {
      const std = ctx.state.mrAverage / X_CONTROL_LIMITS_CONST;

      const cpu =
        (ctx.state.upperSpecLimit - ctx.state.dataAverage) / (3 * std);
      ctx.commit("cpu", cpu);

      const cpl =
        (ctx.state.dataAverage - ctx.state.lowerSpecLimit) / (3 * std);
      ctx.commit("cpl", cpl);

      const cpk = Math.min(cpu, cpl);
      ctx.commit("cpk", cpk);

      // saving data
      const appData = {
        dataList: ctx.state.dataList,
        upperSpecLimit: ctx.state.upperSpecLimit,
        lowerSpecLimit: ctx.state.lowerSpecLimit
      };
      localStorage.setItem("appData", JSON.stringify(appData));

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
      if (util.isNumber(val)) {
        ctx.commit("upperSpecLimit", val);
        ctx.dispatch("populateCPX");
      }
    },

    setLowerSpecLimit: (ctx, val) => {
      if (util.isNumber(val)) {
        ctx.commit("lowerSpecLimit", val);
        ctx.dispatch("populateCPX");
      }
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
      state.dataAverage = Number.parseFloat(val).toFixed(toFixed);
    },

    mrAverage: (state, val) => {
      state.mrAverage = Number.parseFloat(val).toFixed(toFixed);
    },

    estimatedStdDev: (state, val) => {
      state.estimatedStdDev = Number.parseFloat(val).toFixed(toFixed);
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

    cpu: (state, val) => {
      state.cpu = Number.parseFloat(val).toFixed(toFixed);
    },

    cpl: (state, val) => {
      state.cpl = Number.parseFloat(val).toFixed(toFixed);
    },

    cpk: (state, val) => {
      state.cpk = Number.parseFloat(val).toFixed(toFixed);
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

    loading: (state, val) => {
      state.loading = val;
    }
  }
};

export default xmrChartDataModule;
