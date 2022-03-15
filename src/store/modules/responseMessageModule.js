const errorMessageModule = {
  namespaced: true,

  state: () => ({
    show: false,
    message: ""
  }),

  getters: {},

  actions: {
    setShow(ctx, val) {
      ctx.commit("SHOW", val);
    },

    setMessage(ctx, message) {
      ctx.commit("MESSAGE", message);
    }
  },

  mutations: {
    SHOW(state, value) {
      state.show = value;
    },
    MESSAGE(state, value) {
      state.message = value;
    }
  }
};

export default errorMessageModule;
