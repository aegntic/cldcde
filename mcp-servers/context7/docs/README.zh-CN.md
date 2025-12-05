# Context7 MCP - 为所有Prompt获取最新文档

[![网站](https://img.shields.io/badge/Website-context7.com-blue)](https://context7.com) [![smithery徽章](https://smithery.ai/badge/@upstash/context7-mcp)](https://smithery.ai/server/@upstash/context7-mcp)

## ❌ 不使用Context7时

大语言模型(LLM)可能依赖过时或通用的库信息。你可能会遇到：

- ❌ 代码示例已过时，或基于一年前的训练数据
- ❌ 幻觉产生的API根本不存在
- ❌ 针对旧版本包的通用回答

## ✅ 使用Context7时

Context7 MCP直接从源头获取最新的、特定版本的文档和代码示例 — 并将它们直接放入你的提示中。

在Cursor中添加`use context7`到你的提示：

```txt
创建一个使用app router的基本Next.js项目。use context7
```

```txt
创建一个脚本，删除PostgreSQL数据库中city字段为""的行。use context7
```

Context7将最新的代码示例和文档直接获取到你的LLM上下文中。

- 1️⃣ 按照往常，自然地编写你的提示
- 2️⃣ 告诉LLM使用`use context7`
- 3️⃣ 获取可用的代码答案

无需在标签间切换，没有不存在的幻觉API，没有过时的代码生成。

## 🛠️ 开始使用

### 要求

- Node.js >= v18.0.0
- Cursor, Windsurf, Claude Desktop或其他MCP客户端

### 通过Smithery安装

要通过[Smithery](https://smithery.ai/server/@upstash/context7-mcp)自动安装Context7 MCP Server for Claude Desktop：

```bash
npx -y @smithery/cli install @upstash/context7-mcp --client claude
```

### 在Cursor中安装

前往：`Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

推荐的方法是将以下配置粘贴到你的Cursor `~/.cursor/mcp.json`文件中。更多信息请参见[Cursor MCP文档](https://docs.cursor.com/context/model-context-protocol)。

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

<details>
<summary>替代方案：使用Bun</summary>

```json
{
  "mcpServers": {
    "context7": {
      "command": "bunx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

</details>

<details>
<summary>替代方案：使用Deno</summary>

```json
{
  "mcpServers": {
    "context7": {
      "command": "deno",
      "args": ["run", "--allow-net", "npm:@upstash/context7-mcp"]
    }
  }
}
```

</details>

### 在Windsurf中安装

将此内容添加到你的Windsurf MCP配置文件中。更多信息请参见[Windsurf MCP文档](https://docs.windsurf.com/windsurf/mcp)。

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

### 在VSCode中安装

将此内容添加到你的VSCode MCP配置文件中。更多信息请参见[VSCode MCP文档](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)。

```json
{
  "servers": {
    "Context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

### 在Claude Code中安装

运行此命令。更多信息请参见[Claude Code MCP文档](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/tutorials#set-up-model-context-protocol-mcp)。

```sh
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

### 在Claude Desktop中安装

将此内容添加到你的Claude Desktop `claude_desktop_config.json`文件中。更多信息请参见[Claude Desktop MCP文档](https://modelcontextprotocol.io/quickstart/user)。

```json
{
  "mcpServers": {
    "Context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

### 可用工具

- `resolve-library-id`: 将通用库名称解析为Context7兼容的库ID。
  - `libraryName` (必需)
- `get-library-docs`: 使用Context7兼容的库ID获取库的文档。
  - `context7CompatibleLibraryID` (必需)
  - `topic` (可选): 将文档集中在特定主题上（例如"routing"、"hooks"）
  - `tokens` (可选，默认5000): 返回的最大令牌数。小于5000的值会自动增加到5000。

## 开发

克隆项目并安装依赖：

```bash
bun i
```

构建：

```bash
bun run build
```

### 本地配置示例

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["tsx", "/path/to/folder/context7-mcp/src/index.ts"]
    }
  }
}
```

### 使用MCP Inspector测试

```bash
npx -y @modelcontextprotocol/inspector npx @upstash/context7-mcp@latest
```

## 故障排除

### ERR_MODULE_NOT_FOUND

如果你看到这个错误，请尝试使用`bunx`而不是`npx`。

```json
{
  "mcpServers": {
    "context7": {
      "command": "bunx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

这通常可以解决模块解析问题，特别是在`npx`无法正确安装或解析包的环境中。

### MCP客户端错误

1. 尝试从包名中删除`@latest`。

2. 尝试使用`bunx`作为替代方案。

3. 尝试使用`deno`作为替代方案。

## Context7媒体报道

- [Better Stack: "免费工具让Cursor变得更智能10倍"](https://youtu.be/52FC3qObp9E)
- [Cole Medin: "这绝对是AI编码助手的最佳MCP服务器"](https://www.youtube.com/watch?v=G7gK8H6u7Rs)
- [Income stream surfers: "Context7 + SequentialThinking MCPs: 这是AGI吗？"](https://www.youtube.com/watch?v=-ggvzyLpK6o)
- [Julian Goldie SEO: "Context7: 新的MCP AI代理更新"](https://www.youtube.com/watch?v=CTZm6fBYisc)
- [JeredBlu: "Context 7 MCP: 即时获取文档 + VS Code设置"](https://www.youtube.com/watch?v=-ls0D-rtET4)
- [Income stream surfers: "Context7: 将改变AI编码的新MCP服务器"](https://www.youtube.com/watch?v=PS-2Azb-C3M)

## Star历史

[![Star历史图表](https://api.star-history.com/svg?repos=upstash/context7&type=Date)](https://www.star-history.com/#upstash/context7&Date)

## 许可证

MIT
