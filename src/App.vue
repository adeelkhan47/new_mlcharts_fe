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
      paths: ["Dashboard", "XmrChart", "XBarRChart", "Account", "Users"]
    };
  },

  created() {
    const userObj = storageHelper.getUserObj();

    if (userObj) {
      setDefaultHeader("user-id", storageHelper.getUserId());
    }

    if (
      !userObj &&
      !(this.$route.name === "Login" || this.$route.name === "Register")
    ) {
      storageHelper.storeData(
        storageHelper.LOGIN_REDIRECT_PATH_KEY,
        this.$route.path
      );
      this.$router.push("/login");
    } else if (userObj && !this.paths.includes(this.$route.name))
      this.$router.push("/dashboard");
  }
};
</script>

<style>
.jexcel_container .jexcel_content::-webkit-scrollbar {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>
