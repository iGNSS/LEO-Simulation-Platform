import path from "path";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import AutoImport from "unplugin-auto-import/vite";

import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

const pathSrc = path.resolve(__dirname, "src");

// https://vitejs.dev/config/
export default ({ mode }) =>
  defineConfig({
    base: "./", // 解决dist资源路径问题
    resolve: {
      alias: {
        "@": path.join(__dirname, "./src"),
        "~/": `${pathSrc}/`,
      },
      extensions: [".js", ".json", ".ts"],
    },
    css: {
      preprocessorOptions: {
        // scss: { additionalData: `@use "~/styles/element/index.scss" as *;` },
      },
    },
    plugins: [
      vue(),

      AutoImport({
        // Auto import functions from Vue, e.g. ref, reactive, toRef...
        // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
        imports: ["vue", "vue-router", "vuex"],

        // Auto import functions from Element Plus, e.g. ElMessage, ElMessageBox... (with style)
        // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)
        resolvers: [
          ElementPlusResolver(),

          // Auto import icon components
          // 自动导入图标组件
          IconsResolver({ prefix: "Icon" }),
        ],

        dts: path.resolve(pathSrc, "auto-imports.d.ts"),
      }),

      Components({
        // allow auto load markdown components under `./src/components/`
        extensions: ["vue", "md"],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        resolvers: [
          IconsResolver({ enabledCollections: ["ep"] }),
          ElementPlusResolver({ importStyle: "sass" }),
        ],
        dts: "src/components.d.ts",
      }),

      Icons({
        autoInstall: true,
      }),

      //Inspect(),
    ],
    server: {
      // host: "0.0.0.0",
      // port: 3000,
      proxy: {
        "/api": {
          target: loadEnv(mode, process.cwd()).VITE_APP_BASE_API,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]",
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id.toString().split("node_modules/")[1].split("/")[0];
            }
          },
        },
      },
    },
  });
