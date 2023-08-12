import View from './components/view'
import Link from './components/link'

// 引用Vue构造函数。
export let _Vue

// 做四件事：
// 1. 全局混入两个lifecycle hook：beforeCreate & destroyed.
// 2. 在Vue.prototype上设置两个只读属性：$router & $route.
// 3. 全局注册两个组件：RouterView & RouterLink.
// 4. 设置路由相关的三个lifecycle hook的合并策略：取created使用的合并策略。
export function install (Vue) {
  // 借助install.installed属性确保install操作只进行一次。
  if (install.installed && _Vue === Vue) return
  install.installed = true

  // 设置Vue构造函数引用。
  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  // 全局混入：给所有后续创建的组件混入两个生命周期钩子函数：beforeCreate和destroyed。
  Vue.mixin({
    beforeCreate () {
      // 判断组件选项中是否有router选项。只有根组件选项终会有router选项。
      if (isDef(this.$options.router)) {
        // 当前创建的组件实例为根组件实例，且组件选项中有router选项。

        // 设置属性_routerRoot引用根路由：根实例的引用
        this._routerRoot = this
        // 设置属性_router引用路由对象
        this._router = this.$options.router
        // 初始化路由对象
        this._router.init(this)
        // 定义_router属性，指向当前历史记录。（？）
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // 当前创建的组件实例不是根组件实例，向上获取根实例的引用来设置属性_routerRoot。
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })

  // 在Vue.prototype上设置两个静态只读属性：$router和$route。
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

  // 全局注册两个组件：RouterView和RouterLink。
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  // 将created使用的合并策略 设为 三个路由相关生命周期钩子的合并策略：
  // beforeRouteEnter/beforeRouteLeave/beforeRouteUpdate
  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
