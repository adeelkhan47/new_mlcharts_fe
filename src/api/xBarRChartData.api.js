import axios from "axios";
import constants from "../utils/constants.util";

function getChartData(chartId, password = "") {
  const URL =
    constants.API_BASE_URL +
    constants.X_BAR_R_CHART_PATH +
    "/" +
    chartId +
    "/?password=" +
    password;
  return axios.get(URL);
}

function addChartData(chartId, password = "", records) {
  const URL =
    constants.API_BASE_URL +
    constants.X_BAR_R_CHART_PATH +
    "/data/multi/" +
    chartId +
    "/?password=" +
    password;
  return axios.post(URL, records);
}

function updateChartData(chartId, password, records) {
  const URL =
    constants.API_BASE_URL +
    constants.X_BAR_R_CHART_PATH +
    "/data/multi/" +
    chartId +
    "/?password=" +
    password;
  return axios.put(URL, records);
}

function removeChartData(chartId, password, rowIds) {
  const URL =
    constants.API_BASE_URL +
    constants.X_BAR_R_CHART_PATH +
    "/data/multi/" +
    chartId +
    "/?password=" +
    password;

  return axios.delete(URL, {
    data: rowIds
  });
}

const xBarRChartDataApi = Object.freeze({
  getChartData,
  addChartData,
  updateChartData,
  removeChartData
});

export default xBarRChartDataApi;
