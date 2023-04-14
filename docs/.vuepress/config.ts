import { defaultTheme, defineUserConfig } from "vuepress";

export default defineUserConfig({
  lang: "zh-CN",
  title: "低轨卫星仿真平台",
  description: "基于Web的低轨卫星仿真环境",
  head: [["link", { rel: "icon", href: "/icon.png" }]],
  theme: defaultTheme({
    // 默认主题配置
    navbar: [
      {
        text: "首页",
        link: "/",
      },
      {
        text: "帮助",
        link: "guide/getting-started",
      },
      {
        text: "视频资源",
        link: "/contributing",
      },
    ],
  }),
});
