<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import userHelper from "./utils/userHelper.util";

export default {
  name: "App",
  created() {
    const userObj = userHelper.getUserObj();
    if (!userObj && this.$route.name != "Login") this.$router.push("/login");
    else if (userObj && this.$route.name != "Home") this.$router.push("/home");
  }
};
</script>

<style></style>
