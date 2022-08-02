import Vue from "vue";
import VueRouter from "vue-router";
import MainLayout from "../Layouts/MainLayout.vue";
import Dashboard from "../pages/Dashboard.vue";
import About from "../pages/About.vue";
import Account from "../pages/Account.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import XmrChart from "../pages/XmrChart.vue";
import XBarRChart from "../pages/XBarRChart.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "MainLayout",
    component: MainLayout,
    children: [
      {
        path: "/dashboard",
        name: "Dashboard",
        component: Dashboard
      },
      {
        path: "/about",
        name: "About",
        component: About
      },
      {
        path: "/account",
        name: "Account",
        component: Account
      },
      {
        path: "/i/:chartId",
        name: "XmrChart",
        component: XmrChart
      },
      {
        path: "/s/:chartId",
        name: "XBarRChart",
        component: XBarRChart
      }
    ]
  },
  {
    path: "/login",
    name: "Login",
    component: Login
  },
  {
    path: "/register",
    name: "Register",
    component: Register
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
