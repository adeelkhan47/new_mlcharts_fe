<template>
  <div class="centered-container">
    <md-content class="md-elevation-3">
      <div class="title">
        <div class="md-title">Sign up</div>
        <div class="md-body-1">Register for a new account</div>
      </div>

      <div class="form">
        <md-field>
          <label>E-mail</label>
          <md-input v-model="register.email" autofocus id="email"></md-input>
        </md-field>

        <md-field md-has-password>
          <label>Password</label>
          <md-input v-model="register.password" type="password"></md-input>
        </md-field>

        <md-field>
          <label>First Name</label>
          <md-input v-model="register.firstName" type="text"></md-input>
        </md-field>

        <md-field>
          <label>Last Name</label>
          <md-input v-model="register.lastName" type="text"></md-input>
        </md-field>

        <md-field>
          <label>Company</label>
          <md-input
            v-model="register.company"
            type="text"
            id="company"
          ></md-input>
        </md-field>
      </div>

      <div class="actions md-layout md-alignment-center-space-between">
        <md-button class="md-raised md-primary" @click="navigateToLogin">
          Log in
        </md-button>
        <md-button class="md-raised md-primary" @click="signUp">
          Sign up
        </md-button>
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
  name: "Register",
  data() {
    return {
      loading: false,
      register: {
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        company: ""
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
    document.getElementById("company").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.signUp();
      }
    });
  },
  methods: {
    navigateToLogin() {
      this.$router.push("/login");
    },
    signUp() {
      this.loading = true;

      userApi
        .register(
          this.register.email,
          this.register.password,
          this.register.firstName,
          this.register.lastName,
          this.register.company
        )
        .then((res) => {
          this.reset();
          this.navigateToLogin();
        })
        .catch((err) => {
          console.error("register error :: ", err);
          this.errorMsg = err.response.data || "something went wrong";
          this.showSnackbar = true;
          this.loading = false;
        });
    },
    reset() {
      this.register.email = "";
      this.register.password = "";
      this.register.firstName = "";
      this.register.lastName = "";
      this.register.company = "";

      this.showSnackbar = false;
      this.errorMsg = "";
      this.loading = false;
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
