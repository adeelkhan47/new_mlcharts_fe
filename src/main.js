import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "vue-material/dist/vue-material.min.css";
import "vue-material/dist/theme/default.css";

import VueMaterial from "vue-material";
Vue.use(VueMaterial);

import VueLoading from "vue-loading-overlay";
import "vue-loading-overlay/dist/vue-loading.css";
Vue.use(VueLoading);

import ViserVue from "viser-vue";
Vue.use(ViserVue);

import axios from "axios";
axios.defaults.headers = {
  "Access-Control-Allow-Origin": "*"
};

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount("#app");
