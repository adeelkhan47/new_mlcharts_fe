import { dashboardChartApi } from "../../api";

const dashboardChartModule = {
  namespaced: true,

  state: () => ({
    privateChart: false,
    password: "",
    currentChart: null,
    dashboardCharts: [],
    loading: false
  }),

  getters: {},

  actions: {
    init(ctx) {
      ctx.commit("LOADING", true);
      dashboardChartApi
        .getDashboardCharts()
        .then((res) => {
          ctx.commit("DASHBOARD_CHARTS", res.data.data);
          ctx.commit("LOADING", false);
        })
        .catch((error) => {
          console.error("Unable to get charts :: ", error);
          ctx.commit("LOADING", false);
        });
    },

    getChart(
      ctx,
      {
        chartId,
        moduleName = "xmrChartDataModule",
        cb = () => {},
        getMeThePassword = () => {}
      }
    ) {
      ctx.commit("LOADING", true);
      ctx.commit("CURRENT_CHART", null);
      ctx.commit("LOADING", false);
      ctx.commit("PRIVATE_CHART", false);
      ctx.commit("PASSWORD", false);

      dashboardChartApi
        .isPrivateChart(chartId)
        .then((res) => {
          if (res && res.data && res.data.data) {
            ctx.commit("PRIVATE_CHART", true);
            getMeThePassword((pass) => {
              ctx.commit("PASSWORD", pass);

              ctx.dispatch("actuallyGetChart", {
                chartId,
                password: pass,
                moduleName,
                cb
              });
            });
          } else {
            ctx.dispatch("actuallyGetChart", {
              chartId,
              moduleName,
              cb
            });
          }
        })
        .catch((error) => {
          console.error("Unable to get chart :: ", error);
          cb({
            success: false,
            message: error?.response?.data || "Page Not Found"
          });
        });
    },

    actuallyGetChart(
      ctx,
      { chartId, password = "", moduleName, cb = () => {} }
    ) {
      dashboardChartApi
        .getDashboardChartById(chartId, password)
        .then((res) => {
          const currentChart = res.data.data[0];
          ctx.commit("CURRENT_CHART", currentChart);
          ctx.commit("LOADING", false);
          ctx.dispatch(
            moduleName + "/init",
            {
              chartId,
              password,
              currentChart
            },
            { root: true }
          );
          cb({
            success: true,
            message: ""
          });
        })
        .catch((error) => {
          console.error("Unable to get chart :: ", error);
          cb({
            success: false,
            message: error?.response?.data || "Page Not Found"
          });
        });
    },

    createChart(ctx, { body, cb = () => {} }) {
      let requestBody = { ...body };

      requestBody.upperSpecLimit = "";
      requestBody.lowerSpecLimit = "";

      dashboardChartApi
        .createDashboardChart(requestBody)
        .then((res) => {
          ctx.commit("ADD_DASHBOARD_CHART", res.data.data[0]);
          cb({
            success: true,
            message: "Successfully created new chart"
          });
        })
        .catch((error) => {
          console.error("Unable to create chart :: ", error);
          cb({
            success: false,
            message: error?.response?.data || "Unable to create chart"
          });
        });
    },

    updateChart(ctx, { chartId, body, cb = () => {} }) {
      dashboardChartApi
        .updateDashboardChart(chartId, body)
        .then((res) => {
          ctx.commit("UPDATE_DASHBOARD_CHART", {
            chartId,
            chartObj: res.data.data[0]
          });
          cb({
            success: true,
            message: "Successfully updated chart"
          });
        })
        .catch((error) => {
          console.error("Unable to update chart :: ", error);
          cb({
            success: false,
            message: error?.response?.data || "Unable to update chart"
          });
        });
    },

    deleteChart(ctx, { chartId, cb = () => {} }) {
      dashboardChartApi
        .deleteDashboardChart(chartId)
        .then(() => {
          ctx.commit("REMOVE_DASHBOARD_CHART", chartId);
          cb({
            success: true,
            message: "Successfully deleted chart"
          });
        })
        .catch((error) => {
          console.error("Unable to deleted chart :: ", error);
          cb({
            success: false,
            message: error?.response?.data || "Unable to deleted chart"
          });
        });
    }
  },

  mutations: {
    LOADING(state, val) {
      state.loading = val;
    },

    PRIVATE_CHART(state, val) {
      state.privateChart = val;
    },

    PASSWORD(state, val) {
      state.password = val;
    },

    DASHBOARD_CHARTS(state, charts) {
      state.dashboardCharts = charts;
    },

    CURRENT_CHART(state, chart) {
      state.currentChart = chart;
    },

    ADD_DASHBOARD_CHART(state, chartObj) {
      state.dashboardCharts.unshift(chartObj);
    },

    UPDATE_DASHBOARD_CHART(state, { chartId, chartObj }) {
      state.dashboardCharts = state.dashboardCharts.map((obj) => {
        if (obj.chartId === chartId) return chartObj;
        else return obj;
      });
    },

    REMOVE_DASHBOARD_CHART(state, chartId) {
      state.dashboardCharts = state.dashboardCharts.filter(
        (obj) => obj.chartId !== chartId
      );
    }
  }
};

export default dashboardChartModule;
