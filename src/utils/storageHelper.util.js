const USER_DATA_KEY = "userData";
import { setDefaultHeader } from "../api";

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
    setDefaultHeader("user-id", userObj.email);
  }
}

function removeUserObj() {
  localStorage.removeItem(USER_DATA_KEY);
}

function getUserId() {
  const userObj = getUserObj();
  if (userObj && userObj.email) return userObj.email;
  else return null;
}

function storeData(key, value) {
  localStorage.setItem(key, value);
}

function getStoredData(key) {
  localStorage.getItem(key);
}

export default {
  USER_DATA_KEY,

  getUserObj,
  setUserObj,
  removeUserObj,
  getUserId,
  storeData,
  getStoredData
};
