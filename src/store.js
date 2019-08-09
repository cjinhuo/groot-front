import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)
const baseUrl = 'http://localhost:3000'
export default new Vuex.Store({
  state: {
    APIS: {
      list: `${baseUrl}/parse/list`,
      build: `${baseUrl}/parse/build`
    }
  },
  mutations: {

  },
  actions: {

  }
})
