import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './plugins/element'
import 'element-ui/lib/theme-chalk/index.css'
import './plugins/prism/index.css'
import './plugins/prism/index.js'
import store from './store'
import { MitoVue } from './bundle'
import * as Sentry from '@sentry/browser'
import { Vue as VueIntegration } from '@sentry/integrations'
import * as fundebug from 'fundebug-javascript'
import fundebugVue from 'fundebug-vue'
fundebug.apikey = 'ef5164f3c33ee8697e00306dd8a949c5e023d14b75bfe5e2c1f0f5d2ff0559dc'
fundebugVue(fundebug, Vue)
require('fundebug-revideo')
// console.log(MitoVue)
// Vue.use(MitoVue)
// Vue.config.productionTip = false
// Sentry.init({
//   dsn: 'https://95a98eef06fc4eb3a049730cfa8d6248@o403103.ingest.sentry.io/5265260',
//   integrations: [new VueIntegration({ Vue, attachProps: true })]
// })
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
