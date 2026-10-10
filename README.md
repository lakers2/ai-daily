# AI 日报

Han 的中文 AI 日报站点：深色编辑风格、按日归档、纯静态前端。

## 本地预览

在项目根目录启动静态服务器（默认端口 **8787**）：

```bash
cd /workspace/ai-daily
python3 -m http.server 8787
```

浏览器打开：http://127.0.0.1:8787/

若端口已被占用，可先结束旧进程再重启：

```bash
pkill -f "http.server 8787" || true
cd /workspace/ai-daily && python3 -m http.server 8787 &
```

## 目录结构

```
/workspace/ai-daily/
  index.html              # 入口
  assets/style.css        # 样式
  assets/app.js           # 前端逻辑
  data/index.json         # 日期列表（最新在前）
  data/YYYY-MM-DD.json    # 单日内容
  scripts/write_digest.py # 写入新日报并更新索引
  README.md
```

## 数据格式

### `data/index.json`

```json
{ "dates": ["2026-10-10", "2026-10-09"] }
```

日期按 **从新到旧** 排列。

### `data/YYYY-MM-DD.json`

```json
{
  "date": "2026-10-10",
  "title": "AI 日报",
  "focus": "今日焦点一句话",
  "items": [
    {
      "rank": 1,
      "title": "标题",
      "summary": "一到两句摘要",
      "links": [
        { "label": "来源名", "url": "https://example.com/..." }
      ]
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | string | `YYYY-MM-DD`，须与文件名一致 |
| `title` | string | 通常为「AI 日报」 |
| `focus` | string | 今日焦点一句话 |
| `items` | array | 新闻条目，至少 1 条 |
| `items[].rank` | int | 序号 |
| `items[].title` | string | 标题 |
| `items[].summary` | string | 摘要 |
| `items[].links` | array | 来源芯片；可为空数组 |
| `links[].label` | string | 展示名 |
| `links[].url` | string | `http(s)` URL |

## 夜间更新：写入新日报

准备好符合上述 schema 的 JSON 后：

```bash
# 从文件写入
python3 /workspace/ai-daily/scripts/write_digest.py /path/to/digest.json

# 或从 stdin
cat /path/to/digest.json | python3 /workspace/ai-daily/scripts/write_digest.py -
```

脚本会：

1. 校验 schema  
2. 写入 `data/YYYY-MM-DD.json`  
3. 把该日期插入并重排 `data/index.json`（最新在前）

刷新浏览器即可看到新日期。

## 设计说明

- 默认深色主题，靛紫强调色，舒适行宽（约 42rem）
- Noto Sans SC + JetBrains Mono（CDN）
- 左侧归档轨 + 顶栏日期 pills；小屏抽屉导航
- 无构建步骤、无重框架，加载快


## 部署到 GitHub Pages

站点托管在：**https://lakers2.github.io/ai-daily/**

仓库：https://github.com/lakers2/ai-daily

Pages 从 `main` 分支根目录发布。项目含 `.nojekyll`，避免 GitHub 用 Jekyll 处理静态文件。

### 夜间更新并发布

写入新日报后，用发布脚本提交并推送：

```bash
# 1) 写入当日 JSON（校验 + 更新 index）
python3 scripts/write_digest.py /path/to/digest.json

# 2) 提交 data/ 等变更并 push 到 origin main
./scripts/publish.sh
# 或自定义 commit message：
./scripts/publish.sh "docs: AI 日报 2026-10-11"
```

`scripts/publish.sh` 会：

1. 暂存有意义的变更（`data/`、`assets/`、`index.html`、`scripts/`、`README.md` 等）
2. 若有变更则 commit
3. `git push origin main`

推送后约 1–2 分钟 Pages 生效。勿提交 `preview.png`（已在 `.gitignore`）。
