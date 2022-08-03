<template>
  <div class="users-admin">
    <md-table class="table">
      <md-table-toolbar>
        <h1 class="md-title">Users</h1>
      </md-table-toolbar>

      <md-table-row>
        <md-table-head>ID</md-table-head>
        <md-table-head>First Name</md-table-head>
        <md-table-head>Last Name</md-table-head>
        <md-table-head>Email</md-table-head>
        <md-table-head>Company</md-table-head>
        <md-table-head>Role</md-table-head>
        <md-table-head>Signup Date</md-table-head>
      </md-table-row>

      <md-table-row v-for="user in users" :key="user.id">
        <md-table-cell> {{ user.id }} </md-table-cell>
        <md-table-cell> {{ user.firstName }} </md-table-cell>
        <md-table-cell> {{ user.lastName }} </md-table-cell>
        <md-table-cell> {{ user.email }} </md-table-cell>
        <md-table-cell> {{ user.company }} </md-table-cell>
        <md-table-cell> {{ user.role || "user" }} </md-table-cell>
        <md-table-cell> {{ user.createdOn | date }} </md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script>
import moment from "moment";
import { userApi } from "../api";
import storageHelperUtil from "../utils/storageHelper.util";

export default {
  name: "users-admin",

  data() {
    return {
      loading: false,
      users: []
    };
  },

  filters: {
    date(val) {
      if (val) {
        return moment(val).format("LLL");
      } else return "-";
    }
  },

  created() {
    const userObj = storageHelperUtil.getUserObj();
    if (!userObj) this.$router.push("/login");
    else if (userObj.role !== "admin") this.$router.push("/dashboard");

    this.loading = true;
    userApi
      .getAllUsers_admin()
      .then((res) => {
        this.users = res.data;
        this.loading = false;
      })
      .catch((error) => {
        console.error(error);
        this.loading = false;
      });
  },

  mounted() {
    const userObj = storageHelperUtil.getUserObj();
    if (!userObj) this.$router.push("/login");
    else if (userObj.role !== "admin") this.$router.push("/dashboard");
  }
};
</script>

<style scoped>
.users-admin {
  min-height: 100%;
  height: 100%;
  overflow: auto;
  width: 100%;
  padding: 10px 15px;
}

.table {
  width: 100%;
  height: 100%;
  box-shadow: 0 2px 4px 1px lightgray;
  border: 1px solid lightgray;
}
</style>
