<template>
  <div class="centered-container">
    <md-content class="md-elevation-3">
      <div class="title">
        <div class="md-title">Log in</div>
        <div class="md-body-1">Enter your email and password</div>
      </div>

      <div class="form">
        <md-field>
          <label>E-mail</label>
          <md-input v-model="login.email" autofocus id="email"></md-input>
        </md-field>

        <md-field md-has-password>
          <label>Password</label>
          <md-input
            v-model="login.password"
            type="password"
            id="password"
          ></md-input>
        </md-field>
      </div>

      <div class="actions md-layout md-alignment-center-space-between">
        <md-button class="md-raised md-primary" @click="navigateToRegister">
          Sign up
        </md-button>
        <md-button class="md-raised md-primary" @click="signIn"
          >Log in</md-button
        >
      </div>

      <div class="loading-overlay" v-if="loading">
        <md-progress-spinner
          md-mode="indeterminate"
          :md-stroke="2"
        ></md-progress-spinner>
      </div>
    </md-content>
    <div class="background" />

    <md-snackbar
      :md-position="position"
      :md-duration="duration"
      :md-active.sync="showSnackbar"
      md-persistent
    >
      <span>{{ errorMsg }}</span>
      <md-button class="md-primary" @click="showSnackbar = false">
        Close
      </md-button>
    </md-snackbar>
  </div>
</template>

<script>
import storageHelper from "../utils/storageHelper.util";
import { userApi } from "../api";

export default {
  name: "Login",
  data() {
    return {
      loading: false,
      login: {
        email: "",
        password: ""
      },
      showSnackbar: false,
      errorMsg: "",
      position: "center",
      duration: 4000
    };
  },
  created() {
    const userObj = storageHelper.getUserObj();
    if (userObj) this.$router.push("/dashboard");
  },
  mounted() {
    document.getElementById("email").focus();
    document.getElementById("password").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.signIn();
      }
    });
  },
  methods: {
    navigateToRegister() {
      this.$router.push("/register");
    },
    navigateToHome() {
      let redirectPath = storageHelper.getStoredData(
        storageHelper.LOGIN_REDIRECT_PATH_KEY
      );
      if (redirectPath)
        storageHelper.removeStoredData(storageHelper.LOGIN_REDIRECT_PATH_KEY);
      else redirectPath = "/dashboard";

      this.$router.push(redirectPath);
    },
    reset() {
      this.login.email = "";
      this.login.password = "";
      this.errorMsg = "";
      this.showSnackbar = false;
      this.loading = false;
    },
    signIn() {
      this.loading = true;

      userApi.login(this.login.email, this.login.password, (res) => {
        if (res && res.response && res.response.data) {
          this.reset();
          this.navigateToHome();
        } else if (res && res.error) {
          console.error("login error :: ", res.error);
          this.errorMsg = res.error.response.data || "something went wrong";
          this.showSnackbar = true;
          this.loading = false;
        }

        this.loading = false;
      });
    }
  }
};
</script>

<style scoped>
.centered-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 100vh;
}
.centered-container .title {
  text-align: center;
  margin-bottom: 30px;
}
.centered-container .title img {
  margin-bottom: 16px;
  max-width: 80px;
}
.centered-container .actions .md-button {
  margin: 0;
}
.centered-container .form {
  margin-bottom: 60px;
}
.centered-container .background {
  background: skyblue;
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  z-index: 0;
}
.centered-container .md-content {
  z-index: 1;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  position: relative;
}
.centered-container .loading-overlay {
  z-index: 10;
  top: 0;
  left: 0;
  right: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
