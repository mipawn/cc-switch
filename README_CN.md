# cc-switch

一个用于管理多个 Claude Code 配置的 CLI 工具，支持快速切换不同 API 来源和密钥。

[English](./README.md)

## 功能特性

- 管理多个 Claude Code 配置文件，支持不同的 API 配置
- **公共环境变量** - 所有配置共享的默认变量
- **导入/导出** - 备份、分享和迁移配置
- 交互式配置选择
- `--set` 快速编辑单个变量
- 直接编辑配置文件
- 支持自更新
- 跨平台支持（macOS、Linux、windows）

## 安装

### 快速安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/mipawn/cc-switch/main/scripts/install.sh | bash
```

### 手动安装

从 [Releases](https://github.com/mipawn/cc-switch/releases) 下载适合你平台的二进制文件，放到系统 PATH 目录中即可。

## 命令补全（Tab）

安装时会自动配置命令补全。如果补全没生效，可手动添加：

**Zsh:** 在 `~/.zshrc` 中添加：
```bash
fpath=(~/.zsh/completions $fpath)
autoload -Uz compinit && compinit
```
然后生成补全文件：
```bash
mkdir -p ~/.zsh/completions
cc-switch completion zsh > ~/.zsh/completions/_cc-switch
```

**Bash:**
```bash
mkdir -p ~/.local/share/bash-completion/completions
cc-switch completion bash > ~/.local/share/bash-completion/completions/cc-switch
```

**Fish:**
```bash
mkdir -p ~/.config/fish/completions
cc-switch completion fish > ~/.config/fish/completions/cc-switch.fish
```

## 卸载

```bash
cc-switch uninstall
```

## 使用方法

### 交互模式

直接运行 `cc-switch` 进入交互式配置选择：

```bash
cc-switch
```

### 命令列表

| 命令                              | 说明                        |
| --------------------------------- | --------------------------- |
| `cc-switch`                       | 交互式选择配置并启动 claude |
| `cc-switch add [name] [K=V ...]`  | 添加新配置                  |
| `cc-switch edit <name>`           | 交互式编辑配置              |
| `cc-switch edit <name> --set K=V` | 快速更新环境变量            |
| `cc-switch edit <name> --rm KEY`  | 快速删除环境变量            |
| `cc-switch rm <name>`             | 删除配置                    |
| `cc-switch list`                  | 显示所有配置                |
| `cc-switch use <name> [args]`     | 使用指定配置启动 claude     |
| `cc-switch defaults`              | 显示公共环境变量            |
| `cc-switch defaults set K=V`      | 设置公共环境变量            |
| `cc-switch defaults edit`         | 交互式编辑公共变量          |
| `cc-switch defaults rm KEY`       | 删除公共环境变量            |
| `cc-switch config`                | 用编辑器打开配置文件        |
| `cc-switch config --path`         | 显示配置文件路径            |
| `cc-switch export [name]`         | 导出配置到 JSON             |
| `cc-switch import <file>`         | 从 JSON 导入配置            |
| `cc-switch update`                | 检查并安装更新              |
| `cc-switch uninstall`             | 卸载 cc-switch              |
| `cc-switch --help`                | 显示帮助信息                |
| `cc-switch --version`             | 显示版本号                  |

### 使用示例

```bash
# 添加新配置（交互式）
cc-switch add

# 添加配置并直接指定环境变量
cc-switch add myprofile ANTHROPIC_BASE_URL=https://api.example.com ANTHROPIC_AUTH_TOKEN=sk-xxx

# 快速修改单个变量
cc-switch edit myprofile --set ANTHROPIC_BASE_URL=https://newurl.com

# 删除配置中的某个变量
cc-switch edit myprofile --rm API_TIMEOUT_MS

# 设置公共环境变量（所有配置共享）
cc-switch defaults set API_TIMEOUT_MS=300000 CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# 直接编辑配置文件
cc-switch config

# 使用配置并传递 claude 参数
cc-switch use myprofile --dangerously-skip-permissions

# 导出所有配置到文件
cc-switch export > backup.json

# 导出单个配置
cc-switch export myprofile > single.json

# 从文件导入配置
cc-switch import backup.json

# 强制覆盖导入
cc-switch import backup.json --force
```

## 配置说明

配置文件存储在 `~/.config/cc-switch/config.json`。

### 配置格式

```json
{
  "version": "1",
  "defaults": {
    "API_TIMEOUT_MS": "300000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "profiles": [
    {
      "name": "my-api",
      "description": "我的 API 代理",
      "env": {
        "ANTHROPIC_BASE_URL": "https://api.example.com",
        "ANTHROPIC_AUTH_TOKEN": "sk-xxx"
      }
    }
  ]
}
```

### 公共变量（defaults）

公共环境变量会被所有配置共享。如果配置中定义了同名变量，配置中的值会覆盖公共变量。

```bash
# 设置公共变量
cc-switch defaults set API_TIMEOUT_MS=300000

# 现在所有配置都会有 API_TIMEOUT_MS=300000
# 除非配置中自己定义了不同的值
```

### 常用环境变量

| 变量                                       | 说明                       |
| ------------------------------------------ | -------------------------- |
| `ANTHROPIC_BASE_URL`                       | 自定义 API 端点 URL        |
| `ANTHROPIC_AUTH_TOKEN`                     | API 认证令牌               |
| `ANTHROPIC_API_KEY`                        | API 密钥（令牌的替代方式） |
| `API_TIMEOUT_MS`                           | API 请求超时时间（毫秒）   |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | 禁用遥测                   |

### 导入/导出

在不同机器间备份、分享或迁移配置。

```bash
# 导出所有配置（包含公共变量）
cc-switch export > backup.json

# 导出指定配置
cc-switch export myprofile > single.json

# 导出时不包含公共变量
cc-switch export --no-defaults > profiles-only.json

# 从文件导入
cc-switch import backup.json

# 强制覆盖导入（跳过确认）
cc-switch import backup.json --force

# 导入时不包含公共变量
cc-switch import backup.json --no-defaults
```

**导出选项：**
- `--no-defaults` - 不包含公共变量

**导入选项：**
- `--force` / `-f` - 覆盖已存在的配置，跳过确认
- `--merge-defaults` - 自动合并公共变量
- `--no-defaults` - 不导入公共变量

> ⚠️ **安全提示：** 导出文件可能包含敏感数据（API 密钥、令牌），请妥善保管。

## 工作原理

cc-switch 通过子进程方式启动 Claude Code，并将配置中的环境变量传入子进程。环境变量在运行时合并：`defaults` + `profile.env`（配置优先）。

```typescript
// 合并顺序：defaults -> profile.env -> process.env
const mergedEnv = { ...defaults, ...profile.env };
spawn("claude", args, {
  env: { ...process.env, ...mergedEnv },
  stdio: "inherit",
});
```

**等效的 shell 命令：**

```bash
# Linux/macOS
ANTHROPIC_BASE_URL=https://api.example.com ANTHROPIC_AUTH_TOKEN=sk-xxx claude

# Windows (PowerShell)
$env:ANTHROPIC_BASE_URL="https://api.example.com"; $env:ANTHROPIC_AUTH_TOKEN="sk-xxx"; claude
```

## 从源码构建

需要安装 [Bun](https://bun.sh) 运行时。

```bash
# 安装依赖
bun install

# 开发模式运行
bun run src/index.ts

# 构建二进制文件
bun run build
```

## 支持平台

- macOS（Apple Silicon / Intel）
- Linux（x64）
- Windows（x64）

## 开源协议

MIT
