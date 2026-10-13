# halo-theme-spring4all · 春野主题维护

本目录是独立 Halo 主题项目。主题标识为 `theme-spring4all`，以 `theme.yaml` 中的版本为准。

- 模板在 `templates/`，样式和脚本在 `templates/assets/`，配置项在 `settings.yaml`。
- 使用 Thymeleaf、CSS 和原生 JavaScript；随包提供的 highlight.js 保留第三方许可证。
- 页面、文章和配置来自 Halo，不把生产内容或凭据写进模板。
- Shiki 管理的代码块由插件负责；普通代码块使用内置高亮与复制栏，避免重复工具栏。
- 不在同一个元素上混合 `th:replace` 与条件、循环或局部变量；使用外层 `th:block`。
- 发布时同步更新 `theme.yaml`、README 和静态资源缓存版本，执行 `python3 scripts/package.py`。
- `.local/` 是本地预览数据库、密钥和插件；`dist/` 是生成安装包。两者不提交 Git。
- 本地预览用 `docker compose up -d`；变更配置后在 Halo Console 重载主题。
- 按改动检查实际页面、390px 手机布局、复制与代码滚动、插件兼容。已有验证记录是历史依据，不代表后续改动自动通过。
- 广告配置使用稳定的 `ads` 分组；旧版 `enabled`、`client_id`、`slot_id`、`show_mobile`、`preview` 键需保持兼容。发布商与广告单元 ID 留在站点配置，不写入主题默认值。
- 不自动部署或更改生产站；只在用户要求时发布。
