(window.webpackJsonp=window.webpackJsonp||[]).push([[32],{172:function(e,t,r){"use strict";r.r(t),r.d(t,"frontMatter",(function(){return s})),r.d(t,"metadata",(function(){return i})),r.d(t,"rightToc",(function(){return c})),r.d(t,"default",(function(){return p}));var a=r(1),n=r(9),o=(r(0),r(183)),s={title:"Persist State"},i={id:"enhancers/persist-state",title:"Persist State",description:"The `persistState()` function gives you the ability to persist some of the app\u2019s state, by saving it to localStorage/sessionStorage or anything that implements the `StorageEngine` API, and restore it after a refresh.",source:"@site/docs/enhancers/persist-state.mdx",permalink:"/akita/docs/enhancers/persist-state",editUrl:"https://github.com/datorama/akita/edit/master/docs/docs/enhancers/persist-state.mdx",sidebar:"docs",previous:{title:"Devtools",permalink:"/akita/docs/enhancers/devtools"},next:{title:"Snapshot Manager",permalink:"/akita/docs/enhancers/snapshot"}},c=[{value:"API",id:"api",children:[{value:"<code>clearStore</code>",id:"clearstore",children:[]},{value:"<code>destroy</code>",id:"destroy",children:[]}]},{value:"Options",id:"options",children:[{value:"<code>storage</code>",id:"storage",children:[]},{value:"<code>key</code>",id:"key",children:[]},{value:"<code>include</code>",id:"include",children:[]},{value:"<code>deserialize</code>",id:"deserialize",children:[]},{value:"<code>serialize</code>",id:"serialize",children:[]},{value:"<code>preStorageUpdateOperator</code>",id:"prestorageupdateoperator",children:[]},{value:"<code>enableInNonBrowser</code>",id:"enableinnonbrowser",children:[]},{value:"<code>persistOnDestroy</code>",id:"persistondestroy",children:[]}]},{value:"Custom Hooks",id:"custom-hooks",children:[]},{value:"Async Support",id:"async-support",children:[]},{value:"selectPersistStateInit",id:"selectpersiststateinit",children:[]},{value:"Performance Optimization",id:"performance-optimization",children:[]}],l={rightToc:c};function p(e){var t=e.components,r=Object(n.a)(e,["components"]);return Object(o.b)("wrapper",Object(a.a)({},l,r,{components:t,mdxType:"MDXLayout"}),Object(o.b)("p",null,"The ",Object(o.b)("inlineCode",{parentName:"p"},"persistState()")," function gives you the ability to persist some of the app\u2019s state, by saving it to localStorage/sessionStorage or anything that implements the ",Object(o.b)("inlineCode",{parentName:"p"},"StorageEngine")," API, and restore it after a refresh."),Object(o.b)("p",null,"To use it you should call the ",Object(o.b)("inlineCode",{parentName:"p"},"persistState()")," function. Here's an example of Angular's main file:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-ts",metastring:'title="main.ts"',title:'"main.ts"'}),"import { persistState } from '@datorama/akita';\n\nconst persistState = persistState();\n\nconst providers = [{ provide: 'persistStorage', useValue: storage }];\n\nplatformBrowserDynamic(providers)\n  .bootstrapModule(AppModule)\n  .catch(err => console.log(err));\n")),Object(o.b)("h2",{id:"api"},"API"),Object(o.b)("h3",{id:"clearstore"},Object(o.b)("inlineCode",{parentName:"h3"},"clearStore")),Object(o.b)("p",null,"Clear the provided store from storage:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-ts"}),"export class TodosService {\n  constructor(@Inject('persistStorage') private persistStorage) {\n    persistStorage.clearStore('todos');\n    // Clear all\n    persistStorage.clearStore();\n  }\n}\n")),Object(o.b)("h3",{id:"destroy"},Object(o.b)("inlineCode",{parentName:"h3"},"destroy")),Object(o.b)("p",null,"Stop sync the state:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-ts"}),"import { PersistState } from '@datorama/akita';\n\nexport class TodosService {\n  constructor(@Inject('persistStorage') private persistStorage: PersistState) {\n  }\n\n  stopSync() {\n    this.persistStorage.destroy();\n  }\n}\n")),Object(o.b)("h2",{id:"options"},"Options"),Object(o.b)("h3",{id:"storage"},Object(o.b)("inlineCode",{parentName:"h3"},"storage")),Object(o.b)("p",null,"storage strategy to use. This defaults to localStorage but you can pass sessionStorage or anything that implements the StorageEngine API."),Object(o.b)("h3",{id:"key"},Object(o.b)("inlineCode",{parentName:"h3"},"key")),Object(o.b)("p",null,"The key by which the state is saved."),Object(o.b)("h3",{id:"include"},Object(o.b)("inlineCode",{parentName:"h3"},"include")),Object(o.b)("p",null,"by default the whole state is saved to storage, use this param to include only the stores you need. It can be a store name or a predicate callback."),Object(o.b)("h3",{id:"deserialize"},Object(o.b)("inlineCode",{parentName:"h3"},"deserialize")),Object(o.b)("p",null,"Custom deserializer. Defaults to JSON.parse"),Object(o.b)("h3",{id:"serialize"},Object(o.b)("inlineCode",{parentName:"h3"},"serialize")),Object(o.b)("p",null,"Custom serializer, defaults to JSON.stringify"),Object(o.b)("h3",{id:"prestorageupdateoperator"},Object(o.b)("inlineCode",{parentName:"h3"},"preStorageUpdateOperator")),Object(o.b)("p",null,"Custom operators that will run before storage update"),Object(o.b)("h3",{id:"enableinnonbrowser"},Object(o.b)("inlineCode",{parentName:"h3"},"enableInNonBrowser")),Object(o.b)("p",null,"Whether to enable persistState in a non-browser environment "),Object(o.b)("h3",{id:"persistondestroy"},Object(o.b)("inlineCode",{parentName:"h3"},"persistOnDestroy")),Object(o.b)("p",null,"Whether to persist the ",Object(o.b)("inlineCode",{parentName:"p"},"cache")," value of dynamic store upon destroy"),Object(o.b)("p",null,"You can also track a specific store's key. For example:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-ts"}),"persistState({ include: ['auth.token'] });\n")),Object(o.b)("h2",{id:"custom-hooks"},"Custom Hooks"),Object(o.b)("p",null,"You can use the ",Object(o.b)("inlineCode",{parentName:"p"},"preStorageUpdate"),", and ",Object(o.b)("inlineCode",{parentName:"p"},"preStoreUpdate")," hooks to get more control on the state.\nFor example, here is how we can save only specific keys from the ",Object(o.b)("inlineCode",{parentName:"p"},"auth")," state:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-ts"}),"persistState({\n  include: ['auth', 'todos'],\n  preStorageUpdate(storeName, state) {\n    if(storeName === 'auth') {\n      return {\n        token: state.token,\n        expired: state.expired\n      }\n    }\n    return state;\n  },\n  preStoreUpdate(storeName, state) {\n    return state;\n  }\n});\n")),Object(o.b)("h2",{id:"async-support"},"Async Support"),Object(o.b)("p",null,"This gives you the option to save a store\u2019s value to a persistent storage, such as indexDB, websql, or any other asynchronous API. Here\u2019s an example that leverages ",Object(o.b)("a",Object(a.a)({parentName:"p"},{href:"https://github.com/localForage/localForage"}),"localForage"),":"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-ts"}),"import * as localForage from 'localforage';\n\nlocalForage.config({\n  driver: localForage.INDEXEDDB,\n  name: 'Akita',\n  version: 1.0,\n  storeName: 'akita-storage'\n});\n\npersistState({ include: ['auth.token', 'todos'], storage: localForage });\n")),Object(o.b)("h2",{id:"selectpersiststateinit"},"selectPersistStateInit"),Object(o.b)("p",null,"Akita also exposes the ",Object(o.b)("inlineCode",{parentName:"p"},"selectPersistStateInit")," observable. This observable emits after Akita initialized the stores based on the storage's value. For example:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-ts"}),"import { selectPersistStateInit } from '@datorama/akita';\n\nexport class AuthGuard {\n  constructor(private router: Router, private authQuery: AuthQuery) {}\n\n  canActivate() {\n    return combineLatest([\n      this.authQuery.isLoggedIn$,\n      selectPersistStateInit(),\n    ]).pipe(\n      map(([isAuth]) => {\n        if(isAuth) return true;\n        this.router.navigateByUrl('login');\n        return false;\n      }),\n      take(1)\n    );\n  }\n}\n")),Object(o.b)("h2",{id:"performance-optimization"},"Performance Optimization"),Object(o.b)("p",null,"By default, the plugin will update the storage upon each store's change. Some applications perform multiple updates in a second, and update the storage on each change can be costly. "),Object(o.b)("p",null,"For such cases, it's recommended to use the ",Object(o.b)("inlineCode",{parentName:"p"},"preStorageUpdateOperator")," option and add a ",Object(o.b)("inlineCode",{parentName:"p"},"debounce"),". For example:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-ts"}),"import { debounceTime } from 'rxjs/operators';\n\npersistState({\n  include: ['auth.token', 'todos'],\n  preStorageUpdateOperator: () => debounceTime(2000)\n});\n")))}p.isMDXComponent=!0},183:function(e,t,r){"use strict";r.d(t,"a",(function(){return d})),r.d(t,"b",(function(){return h}));var a=r(0),n=r.n(a);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function s(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,a)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?s(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):s(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,a,n=function(e,t){if(null==e)return{};var r,a,n={},o=Object.keys(e);for(a=0;a<o.length;a++)r=o[a],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)r=o[a],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var l=n.a.createContext({}),p=function(e){var t=n.a.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):i({},t,{},e)),r},d=function(e){var t=p(e.components);return n.a.createElement(l.Provider,{value:t},e.children)},b={inlineCode:"code",wrapper:function(e){var t=e.children;return n.a.createElement(n.a.Fragment,{},t)}},u=Object(a.forwardRef)((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,s=e.parentName,l=c(e,["components","mdxType","originalType","parentName"]),d=p(r),u=a,h=d["".concat(s,".").concat(u)]||d[u]||b[u]||o;return r?n.a.createElement(h,i({ref:t},l,{components:r})):n.a.createElement(h,i({ref:t},l))}));function h(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,s=new Array(o);s[0]=u;var i={};for(var c in t)hasOwnProperty.call(t,c)&&(i[c]=t[c]);i.originalType=e,i.mdxType="string"==typeof e?e:a,s[1]=i;for(var l=2;l<o;l++)s[l]=r[l];return n.a.createElement.apply(null,s)}return n.a.createElement.apply(null,r)}u.displayName="MDXCreateElement"}}]);