import { setDefaultHeader } from "../api";

const LOGIN_REDIRECT_PATH_KEY = 'redirectAfterLogin';
const USER_DATA_KEY = "userData";

function getUserObj() {
  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (userData) {
      return JSON.parse(userData);
    } else return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function setUserObj(userObj) {
  if (userObj && typeof userObj == "object" && Object.keys(userObj).length) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userObj));
    setDefaultHeader("user-id", userObj.id);
  }
}

function removeUserObj() {
  localStorage.removeItem(USER_DATA_KEY);
}

function getUserId() {
  const userObj = getUserObj();
  if (userObj && userObj.id) return userObj.id;
  else return null;
}

function storeData(key, value) {
  if (typeof value !== "string") value = JSON.stringify(value);
  localStorage.setItem(key, value);
}

function getStoredData(key) {
  return localStorage.getItem(key);
}

function removeStoredData(key) {
  return localStorage.removeItem(key);
}

export default {
  LOGIN_REDIRECT_PATH_KEY,
  USER_DATA_KEY,

  getUserObj,
  setUserObj,
  removeUserObj,
  getUserId,
  storeData,
  getStoredData,
  removeStoredData
};
