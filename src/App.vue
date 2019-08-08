<template lang="pug">
  #app
    .swagger-test
      el-collapse(
        v-model="activeNames"
      )
        el-collapse-item(
          title="Get /ops/supply/getById/{supplyId} path:supplyId query:projectId  根据补数据id获取补数据实例"
        )
          div
            el-input(
              type="textarea"
              v-model="getFormatter"
              show-word-limit
              maxlength="200"
              style="width:600px;"
          )
            el-input(
              :disabled="true"
              type="textarea"
              v-model="getFormatterResult"
              show-word-limit
              style="width:600px;"
              maxlength="200"
            )
        el-collapse-item(
          title="Post /ops/job/addBaseline body:[baseLineId, jobIds, projectId]  任务添加到基线"
        )
          div
            el-input(
              type="textarea"
              v-model="getFormatter"
              show-word-limit
              maxlength="200"
              style="width:600px;"
          )
            el-input(
              :disabled="true"
              type="textarea"
              v-model="postFormatter"
              show-word-limit
              style="width:600px;"
              maxlength="200"
            )
    //- .test '111'
    //-   el-button 1231
    //-   el-table
    //-   TestElTransfer(
    //-     filterable
    //-     v-model="value"
    //-     :props="{key: 'value',label: 'desc'}"
    //-     :titles="['yi', 'er']"
    //-     :data="data"
    //-     @emitInputChange="receiveInputChange"
    //-   )
</template>

<script>
import axios from 'axios'
export default {
  name: 'App',
  components: {
  },
  data() {
    const generateData = _ => {
      const data = []
      for (let i = 1; i <= 15; i++) {
        data.push({
          value: i,
          desc: `备选项 ${i}`
        })
      }
      return data
    }
    return {
      data: generateData(),
      value: [1, 2, 3, 4, 5, 6],
      filterMethod(query, item) {
        console.log(query, item)
        return []
      },
      activeNames:'',
      getObject: {
        functionName: 'getSupplyGetById',
        path: '/ops/supply/getById/${supplyId}',
        method: 'GET',
        pathParams: ['supplyId'],
        queryParams: ['projectId'],
        headerParams: [''],
        bodyParams: ['projectId']
      },
      postObject: {
        functionName: 'getSupplyGetById',
        path: '/ops/supply/getById/${supplyId}',
        method: 'GET',
        pathParams: ['supplyId'].join(','),
        queryParams: ['projectId'],
        headerParams: [''],
        bodyParams: ['projectId']
      },
      getFormatter: `export async funtion {functionName}({ {pathParams.join(',')}, ...params}) {
    return request(/api{path},{
    method: '{method}',
    data: params
  })
}`,
      getFormatterResult: '',
      postFormatter: `export async funtion {functionName}({ {pathParams.join(',')}, ...params}) {
    return request({path},{
    method: {method},
    data: params
  })
}`,
      postFormatterResult: ''
    }
  },
  watch: {
    getFormatter: {
      handler: function (value) {
        const functionName = 'getSupplyGetById'
        const path = '/ops/supply/getById/${supplyId}'
        const method = 'GET'
        const pathParams = []
        const queryParams = ['projectId']
        const headerParams = ['']
        const bodyParams =  ['projectId']
        const result = value.replace(/{[\w.(),' ]+}/g,(target) => {
          const evalStr = target.replace(/\s*/g,"").replace(/[{}]/g, '')
          console.log('evalStr', evalStr)
          const result = eval(evalStr)
          return eval(evalStr)
          // const evalStr = `this.getObject[${targetTranslate}]`

        // return this.getObject[target.replace(/\s*/g,"").replace(/[{}]/g, '')]
        })
        console.log('result', result)
        this.getFormatterResult = result
      },
      immediate: true
    },
    postFormatter: {
      handler: function(value) {

      },
      immediate: true
    }
  },
  mounted() {
    const baseUrl =
            'https://www.easy-mock.com/mock/5b7a5611f0e3593f36141420/doushu'
    axios
      .post(`http://localhost:3000/parse/build`, {
        template: '',
        getFormatter: `export async funtion {functionName}({ {pathParams.join(',')}, ...params}) {
    return request(/api{path},{
    method: '{method}',
    data: params
  })
}`,
        include: ['get /ops/supply/getSupplyById/{supplyId}'],
        url: 'http://test-simba-ops.startdtapi.com/swagger-ui.html#/3227979357972036323376'
      })
      .then((res) => {
        console.log(res.data)
      })
      .catch((e) => {
        console.log(e)
      })
  },
  methods: {
    receiveInputChange(val) {
      console.log('input', val)
    },
    test(a) {
      return a
    }
  }
}
</script>

<style>
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
.el-textarea__inner {
  height: 180px;
}
</style>
