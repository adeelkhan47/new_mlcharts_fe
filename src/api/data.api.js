import axios from "axios";
import userHelper from "../utils/userHelper.util";
import constants from "../utils/constants.util";

function getData() {
  const userId = userHelper.getUserId();

  if (userId) {
    const URL = constants.API_BASE_URL + "/data/" + userId;
    return axios.get(URL);
  } else {
    return Promise.reject(new Error("Authentication is required"));
  }
}

function createData(dataList) {
  const URL = constants.API_BASE_URL + "/data";
  return axios.post(URL, dataList);
}

function updateData(dataId, label, value) {
  const userId = userHelper.getUserId();

  if (userId) {
    const URL = constants.API_BASE_URL + "/data";
    return axios.put(URL, {
      userId,
      dataId,
      label,
      value
    });
  } else {
    return Promise.reject(new Error("Authentication is required"));
  }
}

function updateMany(dataObjectList) {
  const userId = userHelper.getUserId();

  if (userId) {
    const URL = constants.API_BASE_URL + "/data/many";
    return axios.put(URL, {
      userId,
      dataObjectList
    });
  } else {
    return Promise.reject(new Error("Authentication is required"));
  }
}

function deleteData(dataId) {
  const userId = userHelper.getUserId();

  if (userId) {
    const URL = constants.API_BASE_URL + "/data";
    return axios.delete(URL, {
      data: {
        userId,
        dataId
      }
    });
  } else {
    return Promise.reject(new Error("Authentication is required"));
  }
}

function deleteMany(dataIds) {
  const userId = userHelper.getUserId();

  if (userId) {
    const URL = constants.API_BASE_URL + "/data/many";
    return axios.delete(URL, {
      data: {
        userId,
        dataIds
      }
    });
  } else {
    return Promise.reject(new Error("Authentication is required"));
  }
}

export default {
  getData,
  createData,
  updateData,
  updateMany,
  deleteData,
  deleteMany
};
