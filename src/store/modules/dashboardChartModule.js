import { dashboardChartApi } from "../../api";

const dashboardChartModule = {
  namespaced: true,

  state: () => ({
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

    getChart(ctx, { chartId, password, cb = () => {} }) {
      ctx.commit("LOADING", true);
      dashboardChartApi
        .getDashboardChartById(chartId, password)
        .then((res) => {
          ctx.commit("CURRENT_CHART", res.data.data[0]);
          ctx.commit("LOADING", false);
          cb({
            success: true,
            message: ""
          });
        })
        .catch((error) => {
          console.error("Unable to get charts :: ", error);
          ctx.commit("CURRENT_CHART", null);
          ctx.commit("LOADING", false);
          cb({
            success: false,
            message: error?.response?.data || "Page Not Found"
          });
        });
    },

    createChart(ctx, { body, cb = () => {} }) {
      dashboardChartApi
        .createDashboardChart(body)
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
