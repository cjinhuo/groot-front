import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)
// const baseUrl = 'http://localhost:8080'
const baseUrl = 'http://45.77.87.244:8080'
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
