import { defaultTheme, defineUserConfig } from "vuepress";

export default defineUserConfig({
  lang: "zh-CN",
  title: "低轨卫星仿真平台",
  description: "基于Web的低轨卫星仿真环境",
  head: [["link", { rel: "icon", href: "/icon.png" }]],
  theme: defaultTheme({
    contributors: false,
    lastUpdated: false,
    // 默认主题配置
    navbar: [
      {
        text: "首页",
        link: "/",
      },
      {
        text: "帮助",
        link: "/guide",
      },
      {
        text: "开始仿真",
        link: "/simulation",
      },
    ],
    sidebar: [
      {
        text: "帮助",
        link: "/guide",
        children: ["/guide/configuration", "/guide/getting-started"],
      },
    ],
  }),
});
