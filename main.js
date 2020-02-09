import Vue from 'vue'
import App from './App'
import config from './config.js'

Vue.config.productionTip = false

// $Z命名空间
Vue.prototype.$Z = {
  config
}

App.mpType = 'app'

const app = new Vue({
  ...App
})
app.$mount()
