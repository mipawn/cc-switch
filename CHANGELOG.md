# Changelog

All notable changes to this project will be documented in this file.

## [0.1.3] - 2026-01-28

### Added

- `update` 命令支持自动检测权限问题并提示使用 sudo 重试
- 文档补充 `update` 命令的使用说明和 sudo 相关提示

## [0.1.2] - 2026-01-28

### Added

- 新增 `export` 命令，支持导出配置到 JSON 文件
  - 支持导出全部或指定 profile
  - `--no-defaults` 选项可排除公共变量
- 新增 `import` 命令，支持从 JSON 文件导入配置
  - 支持交互式选择覆盖冲突的配置
  - `--force` 选项强制覆盖
  - `--merge-defaults` 自动合并公共变量
  - `--no-defaults` 跳过导入公共变量
- Shell 补全支持 export/import 命令

## [0.1.1] - 2026-01-28

### Added

- 新增 `uninstall` 命令，支持一键卸载 cc-switch
- Shell 补全支持（zsh/bash/fish），安装时自动配置

### Fixed

- 修复补全文件不会随版本更新的问题，现在每次 update 都会刷新补全

### Changed

- 优化 README 文档，简化补全配置说明

## [0.1.0] - 2026-01-28

### Added

- 初始版本发布
- 支持管理多个 Claude Code 配置文件
- 支持配置切换功能
- 支持 macOS (ARM64/x64)、Windows (x64) 和 Linux (x64) 平台
