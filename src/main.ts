import { createApp } from "vue";
import App from "./App.vue";
// import router from "./router";
// import store from "./store";

// import ElementPlus from "element-plus";
// import "element-plus/theme-chalk/src/message.scss";
// import VueCesium from "vue-cesium";

import "./styles/index.scss";

// import * as ElementPlusIconsVue from "@element-plus/icons-vue";

const app = createApp(App);
// app.use(router).use(ElementPlus).use(store);
// app.use(VueCesium);

// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component);
// }

app.mount("#app");
