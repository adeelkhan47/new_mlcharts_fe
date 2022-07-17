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

// import { Global } from 'viser-vue';
// Global.setTheme({
//   colors: [
//     "black",
//     "red",
//     "grey",
//     "#1890FF",
//     "#2FC25B",
//     "#FACC14",
//     "#223273",
//     "#8543E0",
//     "#13C2C2",
//     "#3436C7",
//     "#F04864"
//   ]
// });

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
