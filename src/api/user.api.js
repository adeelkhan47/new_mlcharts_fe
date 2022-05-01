import axios from "axios";
import storageHelper from "../utils/storageHelper.util";
import constants from "../utils/constants.util";

function login(email, password, callback = null) {
  const URL = constants.API_BASE_URL + constants.USER_PATH + "/login";
  axios
    .post(URL, {
      email,
      password
    })
    .then((res) => {
      if (res && res.data && res.data.data) {
        storageHelper.setUserObj(res.data.data);
        if (callback)
          callback({
            response: res.data
          });
      } else {
        callback({
          error: {
            response: {
              data: "Something went wrong"
            }
          }
        });
      }
    })
    .catch((err) => {
      console.error("login error :: ", err);
      if (callback)
        callback({
          error: err
        });
    });
}

function register(email, password, firstName, lastName, dob) {
  const URL = constants.API_BASE_URL + constants.USER_PATH + "/register";
  return axios.post(URL, {
    email,
    password,
    firstName,
    lastName,
    dob
  });
}

const userApi = Object.freeze({
  login,
  register
});

export default userApi;
