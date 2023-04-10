import { createApp } from "vue";
import App from "./App.vue";
import { Quasar, Notify } from "quasar";

// Import icon libraries
import "@quasar/extras/material-icons/material-icons.css";

// Import Quasar css
import "quasar/src/css/index.sass";

import "./styles/index.scss";

const app = createApp(App);
app.use(Quasar, {
  plugins: { Notify },
  config: {
    notify: {
      /* look at QuasarConfOptions from the API card */
    },
  },
});

// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component);
// }

app.mount("#app");
