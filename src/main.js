import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './plugins/element'
import 'element-ui/lib/theme-chalk/index.css'
import './plugins/prism/index.css'
import './plugins/prism/index.js'
import store from './store'
import { MitoVue } from './bundle'
// import fundebugVue from 'fundebug-vue'
// var fundebug = require('fundebug-javascript')
// import * as Sentry from '@sentry/browser'
// import { Vue as VueIntegration } from '@sentry/integrations'
// require('fundebug-revideo')
// fundebug.apikey = 'e4a26e68c49fc9293487c80d4070a006dd79945228fb0cd99f61249bca062971'
// fundebugVue(fundebug, Vue)
console.log(MitoVue)
Vue.use(MitoVue)
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
