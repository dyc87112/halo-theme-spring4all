# halo-theme-spring4all · 春野主题维护

本目录是独立 Halo 主题项目。主题标识为 `theme-spring4all`，以 `theme.yaml` 中的版本为准。

- 模板在 `templates/`，样式和脚本在 `templates/assets/`，配置项在 `settings.yaml`。
- 前台使用 Thymeleaf、CSS 和原生 JavaScript；后台组件在 `ui-plugin/`，使用 Halo 共享 Vue/FormKit 运行时。随包提供的 highlight.js 保留第三方许可证。
- 页面、文章和配置来自 Halo，不把生产内容或凭据写进模板。
- Shiki 管理的代码块由插件负责；普通代码块使用内置高亮与复制栏，避免重复工具栏。
- 不在同一个元素上混合 `th:replace` 与条件、循环或局部变量；使用外层 `th:block`。
- 当前版本为 `1.0.6`；日常功能开发、修复和验证归入“未发布”，不自动递增版本、生成安装包、创建 Git 标签或 GitHub Release。
- 只有用户明确要求时，才按指定版本调整版本号或打包；创建标签和 GitHub Release 必须另有明确发版授权，要求测试 ZIP 不代表发布授权。经授权打包时同步更新 `theme.yaml`、README 和静态资源缓存版本，再执行 `python3 scripts/package.py`。
- `.local/` 是本地预览数据库、密钥和插件；`dist/` 是生成安装包。两者不提交 Git。
- 本地预览用 `docker compose up -d`；变更配置后在 Halo Console 重载主题。
- 按改动检查实际页面、390px 手机布局、复制与代码滚动、插件兼容。已有验证记录是历史依据，不代表后续改动自动通过。
- 广告配置使用稳定的 `ads` 分组；旧版 `enabled`、`client_id`、`slot_id`、`show_mobile`、`preview` 键需保持兼容。发布商与广告单元 ID 留在站点配置，不写入主题默认值。
- 谷歌广告按公共设置、文章页广告、首页广告分组，每个位置独立卡片且全部展示；配置键和默认值保持平铺，以兼容 Halo 默认值提取和完整保存。
- 前台站点身份统一读取 `site.title`、`site.subtitle`、`site.logo`；主题作者署名单独展示，不能与友链配置复用地址。备案默认留空，桌面与移动端共用导航片段。
- 友链仅提供自定义数组和链接插件两种来源，默认使用空自定义列表；不读取旧五组键或自动迁移旧友链。自定义空数组应隐藏整个区域，插件未启用时不能调用 Finder。
- 友链编辑区按来源条件显示并保留各自值；插件选择存储资源 ID，前台只显示勾选且仍存在的链接。通过主题 `components` 与 `$cmp` 嵌入局部 FormKit 输入，Halo 2.26.1 不注册主题提供的 `formkit.inputs`。
- 修改后台组件须编译并保留 `ui-plugin/dist/` 全部运行文件，安装包排除源码和 node_modules；本地 UI 编译用于验证，不代表获准生成主题 ZIP 或发布。
- 不自动部署或更改生产站；只在用户要求时发布。
