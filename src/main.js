import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import VueMaterial from 'vue-material'
Vue.use(VueMaterial)

import ViserVue from "viser-vue";
Vue.use(ViserVue);

import axios from 'axios';
axios.defaults.headers = {
  "Access-Control-Allow-Origin": "*"
};

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
