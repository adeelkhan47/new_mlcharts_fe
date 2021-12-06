import Vue from 'vue'
import Vuex from 'vuex'
import util from '../utils'
import dataApi from '../api/data.api'
import userHelper from '../utils/userHelper.util';

Vue.use(Vuex)

const X_CONTROL_LIMITS_CONST = 1.128;
const MR_UCL_CONST = 3.268;

export default new Vuex.Store({
  state: {
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
  },
  actions: {

    init: (ctx) => {

      let appData = localStorage.getItem("appData");
      if (appData) {
        appData = JSON.parse(appData);

        if (appData && typeof appData == "object" && Object.keys(appData).length) {

          if (appData.hasOwnProperty("upperSpecLimit"))
            ctx.commit("upperSpecLimit", appData["upperSpecLimit"]);

          if (appData.hasOwnProperty("lowerSpecLimit"))
            ctx.commit("lowerSpecLimit", appData["lowerSpecLimit"])
        }
      }

      dataApi.getData()
        .then(res => {
          if (res && res.data && res.data.data) {

            ctx.commit("dataList", res.data.data);

            ctx.commit("setMovingRange");

            ctx.dispatch("populate");

          }
        })
        .catch(err => {
          console.error("Unable to get all data :: ", err);
        });
    },

    populate: (ctx) => {

      const dataValues = ctx.state.dataList.map(obj => obj.value);
      ctx.commit("dataAverage", util.average(dataValues));

      let mrValues = Array.from(ctx.state.mr.values());
      if (mrValues.length) {
        if (mrValues.length == 1)
          mrValues = [];
        else
          mrValues = mrValues.slice(1);
      }
      ctx.commit("mrAverage", util.average(mrValues));

      const std = ctx.state.mrAverage / X_CONTROL_LIMITS_CONST;
      ctx.commit("estimatedStdDev", std);

      const ucl = ctx.state.dataAverage + (3 * std);
      ctx.commit("xControlLimits_UCL", ucl);

      const lcl = ctx.state.dataAverage - (3 * std);
      ctx.commit("xControlLimits_LCL", lcl);

      const mr_UCL = MR_UCL_CONST * ctx.state.mrAverage;
      ctx.commit("mrControlLimits_UCL", mr_UCL);


      ctx.dispatch("populateCPX");
    },

    populateCPX: (ctx) => {

      const std = ctx.state.mrAverage / X_CONTROL_LIMITS_CONST;

      const cpu = (ctx.state.upperSpecLimit - ctx.state.dataAverage) / (3 * std);
      ctx.commit("cpu", cpu);

      const cpl = (ctx.state.dataAverage - ctx.state.lowerSpecLimit) / (3 * std);
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

    },

    addDataItem: (ctx, numberList) => {

      const userId = userHelper.getUserId();

      if (userId && numberList && numberList instanceof Array && numberList.length) {

        let count = ctx.state.dataList.length;
        const dataList = numberList.map(value => {
          const label = util.getID() + "-" + count++;
          return {
            userId,
            label,
            value
          };
        });


        dataApi.createData(dataList)
          .then(res => {
            ctx.dispatch("init");
          })
          .catch(err => {
            console.error("Unable to add data item", err);
          });
      }

    },

    updateDataItem: (ctx, { id, label, value }) => {
      if (id, util.isString(label) && util.isNumber(value)) {

        dataApi.updateData(id, label, value)
          .then(res => {
            ctx.dispatch("init");
          })
          .catch(err => {
            console.error("Unable to update data item :: ", id);
            console.error(err);
          });
      }
    },

    removeDataItem: (ctx, dataId) => {
      if (dataId) {
        dataApi.deleteData(dataId)
          .then(res => {
            ctx.dispatch("init");
          })
          .catch(err => {
            console.error("Unable to update data item :: ", id);
            console.error(err);
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
      state.dataList = state.dataList.map(obj => {
        if (obj.key === key)
          obj.value = value;
        return obj
      });

      // updating MR
      state.mr = util.getMrMap(state.dataList);
    },

    removeData: (state, key) => {
      // removing Data
      state.dataList = state.dataList.filter(obj => obj.key != key);

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
      state.mrAverage = val;
    },

    estimatedStdDev: (state, val) => {
      state.estimatedStdDev = val;
    },

    xControlLimits_UCL: (state, val) => {
      state.xControlLimits_UCL = val;
    },

    xControlLimits_LCL: (state, val) => {
      state.xControlLimits_LCL = val;
    },

    mrControlLimits_UCL: (state, val) => {
      state.mrControlLimits_UCL = val;
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

    dataList: (state, val) => {
      state.dataList = val;
    },

    upperSpecLimit: (state, val) => {
      state.upperSpecLimit = val;
    },

    lowerSpecLimit: (state, val) => {
      state.lowerSpecLimit = val;
    }
  },
  modules: {
  }
})
