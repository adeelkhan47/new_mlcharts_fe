import axios from "axios";
import constants from "../utils/constants.util";

function getDashboardCharts() {
  const URL = constants.API_BASE_URL + constants.DASHBOARD_CHART_PATH;
  return axios.get(URL);
}

function isPrivateChart(chartId) {
  const URL =
    constants.API_BASE_URL +
    constants.DASHBOARD_CHART_PATH +
    "/is-private/" +
    chartId;
  return axios.get(URL);
}

function getDashboardChartById(chartId, password) {
  const URL =
    constants.API_BASE_URL +
    constants.DASHBOARD_CHART_PATH +
    "/" +
    chartId +
    "?password=" +
    password;
  return axios.get(URL);
}

function createDashboardChart(body) {
  const URL = constants.API_BASE_URL + constants.DASHBOARD_CHART_PATH;
  return axios.post(URL, body);
}

function updateDashboardChart(chartId, body) {
  const URL =
    constants.API_BASE_URL + constants.DASHBOARD_CHART_PATH + "/" + chartId;
  return axios.put(URL, body);
}

function updateDashboardSpecLimits(chartId, body) {
  const URL =
    constants.API_BASE_URL +
    constants.DASHBOARD_CHART_PATH +
    "/spec-limits/" +
    chartId;
  return axios.put(URL, body);
}

function updateChartHeadings(chartId, body) {
  const URL =
    constants.API_BASE_URL +
    constants.DASHBOARD_CHART_PATH +
    "/headings/" +
    chartId;
  return axios.put(URL, body);
}

function deleteDashboardChart(chartId) {
  const URL =
    constants.API_BASE_URL + constants.DASHBOARD_CHART_PATH + "/" + chartId;
  return axios.delete(URL);
}

const dashboardChartApi = Object.freeze({
  isPrivateChart,
  getDashboardCharts,
  getDashboardChartById,
  createDashboardChart,
  updateDashboardChart,
  updateDashboardSpecLimits,
  updateChartHeadings,
  deleteDashboardChart
});

export default dashboardChartApi;
