import axios from "axios";
import constants from "../utils/constants.util";

function getAllData(chartId, password = "") {
  const URL =
    constants.API_BASE_URL +
    constants.XMR_CHART_DATA_PATH +
    "/" +
    chartId +
    "?password=" +
    password;
  return axios.get(URL);
}

function createData(dataList, password = "") {
  const URL =
    constants.API_BASE_URL +
    constants.XMR_CHART_DATA_PATH +
    "/?password=" +
    password;
  return axios.post(URL, dataList);
}

function updateData(chartId, password, dataId, label, value, reference, note) {
  const URL =
    constants.API_BASE_URL +
    constants.XMR_CHART_DATA_PATH +
    "/?password=" +
    password;
  return axios.put(URL, {
    chartId,
    dataId,
    label,
    value,
    reference,
    note
  });
}

function updateMany(chartId, password, dataObjectList) {
  const URL =
    constants.API_BASE_URL +
    constants.XMR_CHART_DATA_PATH +
    "/many?password=" +
    password;
  return axios.put(URL, {
    chartId,
    dataObjectList
  });
}

function deleteData(chartId, password, dataId) {
  const URL =
    constants.API_BASE_URL +
    constants.XMR_CHART_DATA_PATH +
    "/?password=" +
    password;
  return axios.delete(URL, {
    data: {
      chartId,
      dataId
    }
  });
}

function deleteMany(chartId, password, dataIds) {
  const URL =
    constants.API_BASE_URL +
    constants.XMR_CHART_DATA_PATH +
    "/many?password=" +
    password;
  return axios.delete(URL, {
    data: {
      chartId,
      dataIds
    }
  });
}

const xmrChartDataApi = Object.freeze({
  getAllData,
  createData,
  updateData,
  updateMany,
  deleteData,
  deleteMany
});

export default xmrChartDataApi;
