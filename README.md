# 足球战术板 · Football Tactical Board

> 浏览器里的 **3D 足球战术板**：摆球员、画跑位、拉防线，镜头一转就能讲清楚一套战术。
> 纯前端，不依赖后端，打开就能用。

个人项目，用来给看球和踢球的朋友讲战术 —— 比在纸上画小人直观。

## 功能

| 模块 | 能做什么 |
|---|---|
| **3D 球员** | 拖动摆放、成队编组，火柴人 / 圆点两种形态 |
| **绘制** | 传球线、跑位箭头、任意笔迹，橡皮擦可局部擦除 |
| **区域高亮** | 拉出一块防守区 / 压迫区，视觉上圈给对面看 |
| **图层** | 球员 / 绘制 / 高亮 / 球场合层管理，可单独显隐 |
| **球场** | 草皮纹理、真实比例标线（中圈、禁区、角弧、点球点） |
| **镜头** | 预设视角（全景 / 边线 / 球门后）+ 平移摇杆，讲解时切换顺滑 |

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript + Vite 8 |
| 3D | three.js + `@react-three/fiber` + `@react-three/drei` |
| 状态 | zustand（按域拆 store：camera / tool / player / drawing / layer） |
| UI | `@yizhiheizi/dud`（自研 React 组件库，Radix + Tailwind）+ lucide-react |
| 校验 | oxlint |

## 跑起来

```bash
npm install
npm run dev      # 开发
npm run build    # 构建（tsc -b && vite build）
npm run lint     # oxlint
```

## 目录

```
src/
├── components/
│   ├── scene/       # 3D 场景：草皮、标线、球员、绘制层、镜头
│   │   └── markings/    # 中圈 / 禁区 / 角弧 / 点球点 等标线基元
│   └── panel/       # 侧栏面板：工具栏、球员、队伍、绘制、高亮、图层、摇杆
├── store/           # zustand 状态（camera / tool / player / drawing / layer）
└── App.tsx          # 组装：Canvas + 各面板 + 光标细节
```

## 说明

- 这是一个**个人练手 / 实用小工具**，不是产品，交互和代码结构可能随时改。
- 渲染优先保证「拖动流畅」：球员与标线分层渲染，重绘只发生在被改动的图层。
- 手机端能打开（面板会收起），但没有专门为触屏优化。
