## 基于swagger生成api函数模板的工具（Groot）

### 安装

```
git clone https://github.com/TypeInfos/groot-front.git
cd groot-front
npm i
npm run dev
```
### 技术栈

```
html模板：pug
Vue cli
axios
Vuex
element ui
```

### 使用说明
**本工具按照rest风格规范来编写，普通接口部分适用。**[点击测试](http://45.77.87.244:8080/)

### 案例：

#### 接口
GET /ops/supply/getSupplyById/{supplyId} // Supply Instance Controller

POST /ops/supply/reRunSupplyJob/{supplyId} // 重跑失败任务


#### 最终生成代码

```
/**
* 以下代码属于自动生成，请勿手动修改
*/
import request from '@/utils/request'

// isApi的值可以为mock、api的便于整个文件的修改
const isApi = 'api'

/**
 * 根据补数据id获取补数据实例
 */
export async function getSupplyGetsupplybyid({supplyId}) {
    return request(`/${isApi}/ops/supply/getSupplyById/${supplyId}`,{
    method: 'GET',
  })
}


/**
 * 重跑失败任务
 */
export async function postSupplyRerunsupplyjob({supplyId, ...params}) {
    return request(`/${isApi}/ops/supply/reRunSupplyJob/${supplyId}`,{
    method: 'POST',
    data:params
  })
}

```

首页就是配置项，配置项分为三个部分：

* 模板代码：

也就是api层函数上方的代码，经常需要导入requst函数，这个是直接字符串拼接的，你输入什么字符，工具就展示什么字符。

* get类型模板

为什么只有get和post类型？其实一开始http只有get和post，后面衍生出`put`,`patch`,`delete`,`update`其实本意上都是post，只是语义化上面更好理解一点，其中主要原因就是`get方法`传参经常性的通过`query`来传，而除了`get方法`意外的所有方法基本经常都通过body的方式来传。
后台会掉用你穿的字符串来解析，并在get的接口上面替换。

* post类型模板

后台会调用你所传的字符串来解析，并在除了get的接口上面替换。

### 后台的作用

groot-end：地址
后台帮你遍历你勾选的接口，并且抽取出可用的参数，然后提供这些参数并在你类型模板里面进行解析替换值。
#### 参数表格：
<table>
        <tr>
            <th>参数名称</th>
            <th>默认值</th>
            <th>生成方式</th>
        </tr>
        <tr>
            <th>functionName </th>
            <th>''</th>
            <th>接口方法和地址生成</th>
        </tr>
         <tr>
            <th>method</th>
            <th>'GET'</th>
            <th>接口方法生成</th>
        </tr>
        <tr>
            <th>path</th>
            <th>''</th>
            <th>接口方法和地址生成</th>
        </tr>
        <tr>
            <th> pathParams </th>
            <th>[]</th>
            <th>接口路径的参数生成，比如/a/{id}</th>
        </tr>
         <tr>
            <th> headerParams </th>
            <th>[]</th>
            <th>接口的header方式的参数生成</th>
        </tr>
         <tr>
            <th> bodyParams </th>
            <th>[]</th>
            <th>接口的body方式的参数生成</th>
        </tr>
         <tr>
            <th>queryParams</th>
            <th>[]</th>
            <th>接口的query方式的参数生成</th>
        </tr>
          <tr>
            <th>lB</th>
            <th>'{'</th>
            <th>后端写死</th>
        </tr>
        <tr>
            <th>rB</th>
            <th>'}'</th>
            <th>后端写死</th>
        </tr>
    </table>

### 解析模板

* 匹配{}运行的正则是：`/{[\w.!=?:(),/'$"+ ]+}/g`，将{}里面的表达式提取并用eval运行然后替换。

例子:

后台提供的参数:

`functionName='getList'`

```
模板: fcuntion {functionName}(){}

生成: function getList(){}
```
* 有时你会需要在`{}`里面加字符串，你只要在`{}`加个@，因为@不在正则表示里面(除了正则以外的符号都可以)，后台就不运行当前{}的所有字符.

例子：

后台提供的参数:

`functionName='getList'`

`path='/test/${id}'`

```
模板: fcuntion {functionName}(){
		return requst(/${@api}{path})
	}

生成: function getList(){
		return requst(/${api}/test/${id}')
   }
```

* 有时你可能需要将get中的queryParams用**逗号**分隔，你可以在{}用split(',')方法。

例子：

后台提供的参数:

`functionName='getList'`

`path='/${projectId}/test/${id}'`

`pathParams=['id', 'projectId']`

```
模板: function {functionName}({{pathParams.join(',')}})
		return requst(/${@api}{path})
	}

生成: function getList({id, projectId}){
		return requst(/${api}/${projectId}/test/${id}')
   }
   
```

* 有时需要判断queryParams是不是为空，为空时需要做一些什么，由于是运行表达式所以可以写成三目运算符。

后台提供的参数:

`functionName='getList'`

`path='/${projectId}/test/${id}'`

`pathParams=['id', 'projectId']`

`queryParams=['name']`

`method='GET'`

`rB='{'`

`lB='}'`

例子：

```
模板：export async function {functionName}({lB+pathParams.join(',')+', ...params'+rB}) {
    return request(`/${@api}{path}`,{
    method: '{method}',
    {queryParams.length !== 0 ? 'data:params' :  ''}
  })
}

生成: export async function getList({id, projectId, ...params}) {
    return request(`/${api}/${projectId}/test/${id}`,{
    method: 'GET',
    data:params
  })
}

```

## 注意事项

前端模板解析是实时解析的，如果发现input在输入但是下方的代码没有变化，那肯定是正则匹配出错了，可能是你用到了没有预定义的变量名字，现在页面还没有报错信息，接下来会继续迭代。

