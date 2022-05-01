<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { setDefaultHeader } from "./api";
import storageHelper from "./utils/storageHelper.util";

export default {
  name: "App",

  data() {
    return {
      // "About",
      paths: ["Dashboard", "XmrChart", "XBarRChart"]
    };
  },

  created() {
    const userObj = storageHelper.getUserObj();

    if (userObj) {
      setDefaultHeader("user-id", storageHelper.getUserId());
    }

    if (!userObj && this.$route.name != "Login") this.$router.push("/login");
    else if (userObj && !this.paths.includes(this.$route.name))
      this.$router.push("/dashboard");
  }
};
</script>

<style></style>
