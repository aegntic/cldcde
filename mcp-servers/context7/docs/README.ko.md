# Context7 MCP - 모든 프롬프트를 위한 최신 문서

## ❌ Context7 없이

LLM은 사용하는 라이브러리에 대한 오래되거나 일반적인 정보에 의존하면 다음과 같은 문제가 발생할 수 있습니다:

- ❌ 1년 전 학습 데이터를 기반으로 한 오래된 코드 예제
- ❌ 실제로 존재하지 않는 API에 대한 환각
- ❌ 구 버전 패키지에 대한 일반적인 답변

## ✅ Context7 사용 시

Context7 MCP는 소스에서 직접 최신 버전별 문서와 코드 예제를 가져와 프롬프트에 즉시 적용합니다.

Cursor에서 프롬프트에 `use context7`만 추가하세요:

```txt
app router를 사용하는 기본 Next.js 프로젝트를 만들어주세요. use context7
```

```txt
PostgreSQL 연결 정보를 사용하여 city 필드가 빈 문자열("")인 행을 삭제하는 스크립트를 만들어주세요. use context7
```

Context7은 최신 코드 예제와 문서를 LLM의 컨텍스트에 즉시 가져옵니다.

- 1️⃣ 평소처럼 자연스럽게 프롬프트 작성
- 2️⃣ `use context7` 키워드 추가
- 3️⃣ 실제 동작하는 코드 답변 받기

탭 전환도, 존재하지 않는 API도, 오래된 코드 생성도 없습니다.

## 🛠️ 시작하기

### 요구사항

- Node.js >= v18.0.0
- Cursor, Windsurf, Claude Desktop 또는 다른 MCP 클라이언트

### Smithery를 통한 설치

[Smithery](https://smithery.ai/server/@upstash/context7-mcp)를 통해 Claude Desktop용 Context7 MCP 서버를 자동으로 설치하려면:

```bash
npx -y @smithery/cli install @upstash/context7-mcp --client claude
```

### Cursor에 설치

다음으로 이동: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

다음 설정을 Cursor의 `~/.cursor/mcp.json` 파일에 붙여넣는 것이 권장됩니다. 자세한 내용은 [Cursor MCP 문서](https://docs.cursor.com/context/model-context-protocol)를 참조하세요.

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
<summary>대안: Bun 사용</summary>

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
<summary>대안: Deno 사용</summary>

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

### Windsurf에 설치

Windsurf MCP 설정 파일에 다음을 추가하세요. 자세한 내용은 [Windsurf MCP 문서](https://docs.windsurf.com/windsurf/mcp)를 참조하세요.

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

### VSCode에 설치

VSCode MCP 설정 파일에 다음을 추가하세요. 자세한 내용은 [VSCode MCP 문서](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)를 참조하세요.

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

### Claude Code에 설치

다음 명령을 실행하세요. 자세한 내용은 [Claude Code MCP 문서](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/tutorials#set-up-model-context-protocol-mcp)를 참조하세요.

```sh
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

### Claude Desktop에 설치

Claude Desktop의 `claude_desktop_config.json` 파일에 다음을 추가하세요. 자세한 내용은 [Claude Desktop MCP 문서](https://modelcontextprotocol.io/quickstart/user)를 참조하세요.

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

### 사용 가능한 도구

- `resolve-library-id`: 일반적인 라이브러리 이름을 Context7이 인식할 수 있는 라이브러리 ID로 변환합니다.
  - `libraryName` (필수): 검색하고자 하는 라이브러리 이름

- `get-library-docs`: Context7이 인식하는 라이브러리 ID를 사용하여 해당 라이브러리의 문서를 가져옵니다.
  - `context7CompatibleLibraryID` (필수)
  - `topic` (선택): 특정 주제의 문서만 가져오기 (예: "routing", "hooks")
  - `tokens` (선택, 기본값 5000): 가져올 문서의 최대 토큰 수. 5000 미만으로 설정하면 자동으로 5000으로 조정됨

## 개발

프로젝트를 클론하고 의존성을 설치하세요:

```bash
bun i
```

빌드:

```bash
bun run build
```

### 로컬 설정 예시

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

### MCP Inspector로 테스트

```bash
npx -y @modelcontextprotocol/inspector npx @upstash/context7-mcp@latest
```

## 문제 해결

### ERR_MODULE_NOT_FOUND

이 오류가 발생하면 `npx` 대신 `bunx`를 사용해보세요.

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

이 방법은 `npx`가 패키지를 제대로 설치 또는 찾지 못하는 환경에서 문제를 해결하는 경우가 많습니다.

### MCP 클라이언트 오류

1. 패키지 이름에서 `@latest`를 제거해보세요.

2. 대안으로 `bunx`를 사용해보세요.

3. 대안으로 `deno`를 사용해보세요.

## Context7 관련 미디어 자료

- [Better Stack: "무료 도구로 Cursor를 10배 더 스마트하게 만들기"](https://youtu.be/52FC3qObp9E)
- [Cole Medin: "AI 코딩 어시스턴트를 위한 최고의 MCP 서버"](https://www.youtube.com/watch?v=G7gK8H6u7Rs)
- [Income stream surfers: "Context7 + SequentialThinking MCPs: 이것이 AGI인가?"](https://www.youtube.com/watch?v=-ggvzyLpK6o)
- [Julian Goldie SEO: "Context7: 새로운 MCP AI 에이전트 업데이트"](https://www.youtube.com/watch?v=CTZm6fBYisc)
- [JeredBlu: "Context 7 MCP: 즉시 문서 가져오기 + VS Code 설정"](https://www.youtube.com/watch?v=-ls0D-rtET4)
- [Income stream surfers: "Context7: AI 코딩을 변화시킬 새로운 MCP 서버"](https://www.youtube.com/watch?v=PS-2Azb-C3M)

## Star 기록

[![Star 기록 차트](https://api.star-history.com/svg?repos=upstash/context7&type=Date)](https://www.star-history.com/#upstash/context7&Date)

## 라이선스

MIT
