import { defaultTheme, defineUserConfig } from "vuepress";

export default defineUserConfig({
  lang: "zh-CN",
  title: "低轨卫星仿真平台",
  description: "基于Web的低轨卫星仿真环境",
  theme: defaultTheme({
    // 默认主题配置
    navbar: [
      {
        text: "首页",
        link: "/",
      },
      {
        text: "Get Started",
        link: "guide/getting-started",
      },
      {
        text: "Another",
        link: "/contributing",
      },
    ],
  }),
});
