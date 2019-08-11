<template lang="pug">
  .form-config
    el-form(
      ref="form"
      :rules="rules"
      :model="formData"
      label-width="110px"
      size="small"
    )
      el-form-item(label="swagger地址:" prop="url")
        div(style="display: flex;")
          el-input(v-model="formData.url" placeholder="请输入swagger地址")
          el-button(style="margin-left:20px;" type="primary" @click="onSubmit") 查看接口列表
      el-form-item(label="模板代码")
        div(class="container-textarea")
          el-input(v-model="formData.template" type="textarea" placeholder="请输入api函数上方的代码（可选）")
          CodeTemplate(:codes="templateResult")
      el-form-item(label="get类型模板" prop="getFormatter")
        div(class="container-textarea")
          ShowParams(:singleObject="getParamsObject")
          el-input(v-model="formData.getFormatter" type="textarea" placeholder="get方法请求模板")
          CodeTemplate(:codes="getFormatterResult")
          //- el-input(v-model="getFormatterResult" :disabled="true" type="textarea" placeholder="get方法请求模板")
      el-form-item(label="post类型模板" prop="postFormatter")
        div(class="container-textarea")
          ShowParams(:singleObject="postParamsObject")
          el-input(v-model="formData.postFormatter" type="textarea" placeholder="post方法请求模板")
          CodeTemplate(:codes="postFormatterResult")
          //- el-input(v-model="postFormatterResult" :disabled="true" type="textarea" placeholder="post方法请求模板")

</template>
<script>
import CodeTemplate from './CodeTemplate'
// import * as monaco from 'monaco-editor'
import ShowParams from './components/ShowParams'
export default {
  name: 'FormConfig',
  components: {
    CodeTemplate,
    ShowParams
  },
  data() {
    const rules = {
      url: [
        { required: true, message: '请输入swagger地址', trigger: 'blur' }
      ],
      getFormatter: [
        {
          required: true, message: '请输入get类型模板，刷新页面可重置模板内容', trigger: 'blur'
        }
      ],
      postFormatter: [
        {
          required: true, message: '请输入post类型模板，刷新页面可重置模板内容', trigger: 'blur'
        }
      ]
    }
    return {
      rules,
      formData: {
        url: 'http://test-simba-ops.startdtapi.com/swagger-ui.html#',
        template:
        `/**
* 以下代码属于自动生成，请勿手动修改
*/
import request from '@/utils/request'

// isApi的值可以为mock、api的便于整个文件的修改
const isApi = 'api'
`,
        getFormatter: `export async funtion {functionName}({pathParams.join(',')}{pathParams.length !== 0 ? (queryParams.length !== 0 ? '...params' :  ''): (queryParams.length !== 0 ? 'params' :  '')}) {
    return request(/$\{@api}{path},{
    method: '{method}',
    {queryParams.length !== 0 ? 'data:params' :  ''}
  })
}`,
        postFormatter: `export async funtion {functionName}({pathParams.join(',')}{pathParams.length !== 0 ? (bodyParams.length !== 0 ? '...params' :  ''): (bodyParams.length !== 0 ? 'params' :  '')}) {
    return request(/$\{@api}api{path},{
    method: '{method}',
    {bodyParams.length !== 0 ? 'data:params' :  ''}
  })
}`
      },
      templateResult: '',
      getFormatterResult: '',
      postFormatterResult: '',
      reg: /{[\w.!=?:(),'" ]+}/g,
      getParamsObject: {
        method: 'Get',
        path: '/ops/supply/getById/{supplyId}',
        description: '根据补数据id获取补数据实例',
        tableData: [
          {
            functionName: 'getSupplyGetById',
            pathParams: '[\'supplyId\']',
            method: 'GET',
            path: '/ops/supply/getById/${supplyId}',
            queryParams: '[\'projectId\']',
            bodyParams: '[]',
            headerParams: '[]'
          }
        ]
      },
      postParamsObject: {
        method: 'Post',
        path: '/ops/baseline/add',
        description: '新增基线',
        tableData: [
          {
            functionName: 'postBaselineAdd',
            method: 'POST',
            path: '/ops/supply/getById/${supplyId}',
            queryParams: '[\'projectId\']',
            pathParams: '[\'supplyId\']',
            bodyParams: '[\'alertId\', \'alertOpen\', \'alertTime\']',
            headerParams: '[]'
          }
        ]
      }
    }
  },
  watch: {
    formData: {
      deep: true,
      immediate: true,
      handler(value) {
        this.$emit('emitFormData', value)
      }
    },
    'formData.getFormatter': {
      handler: function(value) {
        const functionName = 'getSupplyGetById'
        const path = '/ops/supply/getById/${supplyId}'
        const method = 'GET'
        const pathParams = []
        const queryParams = ['projectId']
        const headerParams = ['']
        const bodyParams =  []
        const result = value.replace(this.reg, (target) => {
          // .replace(/\s*/g,"") 去除空格
          const evalStr = target.replace(/[{}]/g, '')
          const result = eval(evalStr)
          return eval(evalStr)
        })
        // 这匹配{} 中加了@就可以把{}当做字符创处理 过滤空行
        const final = result.replace('@', '').split('\n').filter(v => {
          return v.replace(/\s*/g,"") !== ''
        })
        console.log(final)
        this.getFormatterResult = final.join('\n')
      },
      immediate: true
    },
    'formData.postFormatter': {
      handler(value) {
        const functionName = 'postBaselineAdd'
        const path = '/ops/baseline/add'
        const method = 'POST'
        const pathParams = []
        const queryParams = []
        const headerParams = []
        const bodyParams =  ['alertId', 'alertOpen', 'alertTime']
        const result = value.replace(this.reg ,(target) => {
          const evalStr = target.replace(/[{}]/g, '')
          const result = eval(evalStr)
          return eval(evalStr)
        })
        this.postFormatterResult = result
      },
      immediate: true
    },
    'formData.template': {
      handler(value) {
        this.templateResult = value
      },
      immediate: true
    }
  },
  methods: {
    monacoEditorConfig() {
      // monaco.editor.create(this.$refs.getFormatter, {
      //   value: `console.log('hello')`,
      //   language: 'javascript',
      //   quickSuggestions: false,
      //   suggest: {
      //     filterGraceful: false
      //   },
      //   minimap: {
      //     enabled: false
      //   }
      // })
    },
    onSubmit() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          this.$message({
            message: '填写完整的配置项',
            type: 'warning'
          })
          return
        }
        this.$emit('emitGetListWithParams')
      })
    }
  }

}
</script>

<style>
.container-textarea {
  display: flex;
  flex-direction: column;
}
.container-textarea > div {
    flex: 1;
}
/* vscode  */
.view-line {
  text-align: left;
}
</style>
