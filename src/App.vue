<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { setDefaultHeader } from "./api";
import userHelper from "./utils/userHelper.util";

export default {
  name: "App",

  data() {
    return {
      paths: ["Dashboard", "About", "XmrChart", "XBarRChart"]
    };
  },

  created() {
    const userObj = userHelper.getUserObj();

    if (userObj) {
      setDefaultHeader("user-id", userHelper.getUserId());
    }

    if (!userObj && this.$route.name != "Login") this.$router.push("/login");
    else if (userObj && !this.paths.includes(this.$route.name))
      this.$router.push("/dashboard");
  }
};
</script>

<style></style>
