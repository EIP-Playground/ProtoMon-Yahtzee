# ProtoMon Loading Page — 代码与资源包

## 文件结构

```
protomon-loading-pack/
├── src/
│   ├── components/
│   │   └── LoadingBar.tsx      ← 进度条核心组件
│   └── pages/
│       └── LoadingPage.tsx     ← 完整 Loading 页面组件
└── assets/
    ├── loading-bar-container.png   ← 进度条金属外框（1486×222px）
    ├── loading-clean-fill.png      ← 彩虹填充条（纯净版，用于动态裁剪）
    ├── loading-full-fill.png       ← 彩虹填充条（含图标版，备用）
    ├── icon-gold.png               ← 金元素图标
    ├── icon-wood.png               ← 木元素图标
    ├── icon-water.png              ← 水元素图标
    ├── icon-fire.png               ← 火元素图标
    ├── icon-earth.png              ← 土元素图标
    └── icon-wind.png               ← 风元素图标
```

---

## 组件说明

### `LoadingBar.tsx`

**Props：**

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `progress` | `number` | — | 当前进度，0~100 |
| `width` | `number` | `480` | 进度条总宽度（px） |

**行为：**
- 进度条从左到右填充彩虹色
- 6个元素图标（金/木/水/火/土/风）固定在进度条内部各自的位置
- 进度条填充到图标位置时，图标从进度条内部弹出（弹簧动画 + glow 特效）
- 图标弹出阈值：金 0%、木 17%、水 33%、火 50%、土 67%、风 83%

**CDN 资源 URL（当前已托管）：**
```
container:  https://d2xsxph8kpxj0f.cloudfront.net/.../loading-bar-container_88258ccf.png
cleanFill:  https://d2xsxph8kpxj0f.cloudfront.net/.../loading-clean-fill_2e1c37a6.png
icon-gold:  https://d2xsxph8kpxj0f.cloudfront.net/.../icon-gold_09674285.png
icon-wood:  https://d2xsxph8kpxj0f.cloudfront.net/.../icon-wood_840228cc.png
icon-water: https://d2xsxph8kpxj0f.cloudfront.net/.../icon-water_abff7ce4.png
icon-fire:  https://d2xsxph8kpxj0f.cloudfront.net/.../icon-fire_3135121f.png
icon-earth: https://d2xsxph8kpxj0f.cloudfront.net/.../icon-earth_7e537bb0.png
icon-wind:  https://d2xsxph8kpxj0f.cloudfront.net/.../icon-wind_17bad2b4.png
```
> 如需使用本地资源，将 `CDN` 对象中的 URL 替换为 `import` 的本地路径即可。

---

### `LoadingPage.tsx`

**Props：**

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `onComplete` | `() => void` | — | 进度到100%后约0.9秒触发 |
| `duration` | `number` | `4000` | 加载动画总时长（毫秒） |

**功能：**
- 全屏暗夜背景 + 像素网格 + 浮动粒子
- 居中显示 PROTOMON 标题
- 集成 `LoadingBar` 组件
- 底部滚动加载文字（11条，循环切换）
- 完成后黑色遮罩淡入，然后触发 `onComplete`

---

## 集成方式

### React / Next.js

```tsx
import { useState } from "react";
import LoadingPage from "./src/pages/LoadingPage";
import MainApp from "./MainApp";

export default function App() {
  const [loaded, setLoaded] = useState(false);

  return loaded
    ? <MainApp />
    : <LoadingPage onComplete={() => setLoaded(true)} duration={4000} />;
}
```

### 仅使用进度条组件

```tsx
import LoadingBar from "./src/components/LoadingBar";

// 传入外部控制的 progress（0~100）
<LoadingBar progress={myProgress} width={480} />
```

---

## 依赖

```
react >= 18
```

CSS 动画（需在全局 CSS 中添加）：

```css
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes float-particle {
  0%   { transform: translateY(0px) scale(1); opacity: 0.6; }
  100% { transform: translateY(-20px) scale(1.3); opacity: 1; }
}

@keyframes pulse-orb {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%       { opacity: 0.8; transform: scale(1.15); }
}
```

字体（在 HTML `<head>` 中引入）：

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />
```
