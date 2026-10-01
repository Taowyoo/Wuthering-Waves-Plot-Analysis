# Cloudflare Pages 备选部署

本方案使用 **Pages Git integration**。它由 Cloudflare 直接拉取 GitHub 仓库、构建并发布，它是静态网站的一个可选托管方案，无需把本机 OAuth 凭据放入 GitHub Secrets。

## 已检查的本机 integration

2026-10-01 检查时，`cf auth whoami` 显示本机已登录，token 有效并具有 Pages 读写 scope；`cf pages list` 返回空列表，尚无可复用的 Pages 项目。CLI 版本为 `1.0.0-beta.10`，已固定为可选依赖。通用网站构建不使用此 CLI。

这个版本的 `cf pages deploy` 只是占位入口，运行时拒绝经典 Pages 的直接上传。本方案使用实际支持的 `cf pages create`，不使用 Wrangler，也不将网站改成 Worker。仓库中 `pages-project.json` 是 Pages API 请求体，不是 Workers 的 `cloudflare.config.ts`；单独放置是为了避免触发 Workers 自动配置。

## 启用步骤

1. 在 Cloudflare 控制台的 **Workers & Pages → Create application → Pages → Connect to Git** 完成 GitHub 的 Install & Authorize，允许 Cloudflare 访问 `Taowyoo/Wuthering-Waves-Plot-Analysis`。本机 Cloudflare 登录不等于 GitHub App 已授权。
2. 如果通过控制台继续创建项目，使用下表设置并保存。或者完成 GitHub 授权后，在本地执行以下命令创建项目：

   ```bash
   npm ci --include=optional
   cf auth whoami
   npm run cloudflare:setup            # 默认只打印 API 请求，不创建项目
   npm run cloudflare:setup -- --apply # 创建项目并连接 GitHub，可能触发构建
   npm run cloudflare:setup -- --status
   ```

   默认选择本机 CLI 账户；有多个账户时设置 `CLOUDFLARE_ACCOUNT_ID`。无人值守环境可提供有目标账户 Pages Edit 权限的 `CLOUDFLARE_API_TOKEN`。凭据不要写入仓库；`.env` 文件已忽略。
3. `master` 为正式部署分支。PR 分支 `codex/complete-tasks-in-handoff.md` 被列入预览分支白名单，可先验证预览再合并。后续新增预览分支时同时更新 JSON 和控制台配置。
4. 在 Pages 的部署列表确认对应提交构建成功，再打开其实际 `pages.dev` URL，验证首页、`/report/`、`/sources/#S35A`、搜索与 Mermaid。不要把项目名称推导出的地址当成已发布地址。

| 设置 | 值 |
|---|---|
| 项目名称 | `wuthering-waves-plot-analysis` |
| Framework preset | None |
| Production branch | `master` |
| Root directory | 仓库根目录 |
| Build command | `npm ci --omit=optional && npm run build:cloudflare` |
| Build output directory | `dist` |
| NODE_VERSION（production 与 preview） | `22` |
| Preview deployment | Custom：`codex/complete-tasks-in-handoff.md` |
| PR comments | Disabled |

如果项目已经通过控制台创建，使用 `--status` 检查，并在控制台核对这些设置；`--apply` 只创建，不覆盖已有项目，也不会自动执行删除重建。GitHub App 未安装、目标仓库未授权或项目名称已被占用时，CLI 会返回失败，需按错误提示处理。

## 本地及 PR 验证

`npm run build:cloudflare` 运行现有构建和完整链接/锚点/搜索检查，再增加根目录 `404.html`，防止 Pages 默认的 SPA fallback 把不存在的路径显示成首页。输出采用域名根路径。

独立的 `Validate Cloudflare Pages` 工作流只在 Actions 页面手动运行（workflow_dispatch），验证构建与创建请求 dry run，并上传 `cloudflare-pages-site` artifact；不读取 Cloudflare 凭据，不创建或发布远端项目。API dry run 只能检查请求组装，不能证明 GitHub App 授权或远端建站成功。通用网站的 HTTP 与浏览器回归由 `Validate static site` 工作流执行。

## 保持托管平台可选

默认安装命令为 `npm ci --omit=optional`，默认构建为 `npm run build`。没有 Cloudflare 凭据时照常构建、测试、预览，并可把 `dist/` 部署到其他静态托管服务。Cloudflare 项目配置、CLI 和手动工作流只服务于主动选择此方案的维护者。完成 Git integration 项目创建后，其自动发布策略独立于仓库 CI；如需停止发布，在该 Pages 项目关闭自动部署。

## 当前边界

本轮只完成本机 integration 检查、备选部署代码、dry run 与构建验证；没有创建远端 Pages 项目，也没有确认 Cloudflare GitHub App 授权或线上 URL。首次授权属于启用此方案的必要步骤。

参考：[Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)、[cf 与 coding agents](https://developers.cloudflare.com/cf/agents/)、[Pages 路由与 404](https://developers.cloudflare.com/pages/configuration/serving-pages/)。
