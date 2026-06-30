下面这份是**完整版技术文档 v1.0**，可以直接交给 Codex。它不是 MVP 文档，而是按“比较完善的产品骨架 + 最大化复用现有项目 + 逐步填充能力”设计。

核心原则先定死：

> **直接 fork Proma，在 Proma 基础上改。其他项目全部拉到 `third_party/`，先 copy-paste 可复用内容，再做适配层、规则清洗、UI 包装和 workflow 编排。不要从零写桌面壳、Provider、微信桥接、规则库、长聊天解析。**

Proma 本身已经是本地优先 AI 桌面应用，具备 Chat、Agent、Skills、MCP、远程机器人、记忆、本地 JSON/JSONL 存储、Provider Adapter，并且 README 明确当前提供 macOS Apple Silicon、macOS Intel、Windows 安装包，也已有飞书/Lark、钉钉、微信桥接入口。([GitHub][1])
原报告也明确，产品应定位为“私密沟通教练”，核心是局势判断、三条回复、风险提醒和下一步策略，不是自动代聊或操控工具。

---

# Proma 私密沟通教练完整技术改造文档 v1.0

## 0. 项目目标

在 Proma 基础上改造出一个完整的 **本地恋爱 / 社交沟通教练桌面产品**。

目标端：

```text
1. Windows 桌面端
2. macOS 桌面端
3. 微信 Bot 入口
4. 触发式微信聊天记录同步
```

核心产品能力：

```text
1. 新建分析工作台
2. 回复生成与改写工作台
3. 长聊天复盘
4. 对象档案 / 关系档案
5. 历史案例
6. 本地规则库 / 案例库
7. 微信 Bot
8. 微信聊天记录导入 / 同步
9. 训练模式
10. 设置、模型、隐私、诊断、导出删除
```

核心技术原则：

```text
Proma 作为主工程
third_party 作为参考项目仓库池
copy-paste 优先
sidecar 调用优先
workflow 统一
桌面端和微信端共用核心服务
微信导入只作为数据输入源，不单独做分析内核
```

---

# 1. 参考项目 URL 清单

## 1.1 主工程

```text
https://github.com/proma-ai/Proma
```

用途：

```text
直接 fork / clone。
作为主工程。
在 Proma 的 Electron 桌面端、Provider Adapter、Skills、微信 bridge、本地存储、设置页基础上改。
```

复用能力：

```text
Electron 桌面壳
Windows/macOS 打包
React + TypeScript + Jotai + Tailwind
@proma/core Provider Adapter
chat-service.ts
channel-manager.ts
wechat-bridge.ts
Skills 目录
本地 ~/.proma/ JSON/JSONL 存储
Electron safeStorage API Key 加密
```

Proma README 说明它是 Bun workspace monorepo，包含 `packages/shared`、`packages/core`、`packages/ui` 和 `apps/electron`，其中 `@proma/core` 负责 Provider Adapter，`apps/electron` 是 Electron 桌面应用。([GitHub][1])

---

## 1.2 恋爱沟通核心规则库

```text
https://github.com/tomwong001/qingsheng-skill
```

用途：

```text
直接 copy skill / prompt / evals。
作为“暧昧、破冰、邀约、冷场、关系阶段、回复生成”的主规则库。
```

复用能力：

```text
微信聊天记录分析
探探 / Soul / Bumble / 青藤之恋 / Tinder 匹配话术
高情商回复生成
关系阶段判断
冷启动挽回
平台场景 playbook
真实聊天语料方法论
```

qingsheng-skill README 明确适用场景包括微信聊天记录分析、探探/Soul/Bumble/青藤之恋/Tinder 匹配话术、高情商回复生成、关系阶段判断、冷启动挽回等。([GitHub][2])

---

## 1.3 信号分析 + 聊天记录解析工具

```text
https://github.com/BeamusWayne/simp-skill
```

用途：

```text
copy prompts + tools。
尤其复用 tools/chat_parser.py。
```

复用能力：

```text
信号解读
危机处理
聊天记录分析
微信 TXT / HTML / CSV 解析
QQ TXT / MHT 解析
通用 JSON 解析
时间线分析思路
```

simp-skill README 里给出 `python3 tools/chat_parser.py` 的使用方式，并说明支持微信 TXT/HTML/CSV、QQ TXT/MHT、通用 JSON。([GitHub][3])

---

## 1.4 微信聊天记录导出 + 长聊天复盘

```text
https://github.com/863401402/she-love-me
```

用途：

```text
copy traditional-deployment / scripts / .agents/skills。
作为微信触发式导入、messages.json 标准格式、stats.json 统计、长聊天复盘、报告结构的主参考。
```

复用能力：

```text
微信数据库导出链路
messages.json
analysis_prompt.txt
stats_analyzer.py
stats.json
build_chat_history.py
联系人独立目录
动态时间范围选择
分层采样
HTML / Markdown 报告结构
主动指数 / 冷淡指数 / 风险信号
```

she-love-me README 说明它可以通过 `/she-love-me` 或 `$she-love-me` 触发，自动解密微信数据库或通过 QCE 提取 QQ 记录，并生成 `messages.json` 和 `analysis_prompt.txt`。([GitHub][4])
其工作流程还包括微信内存扫描提取密钥、依赖 `wechat-decrypt` 解密数据库、生成 SQLite/JSON 消息数据、`stats_analyzer.py -> stats.json`、`build_chat_history.py` 分层采样等。([GitHub][4])

---

## 1.5 长期关系 / 争执修复规则库

```text
https://github.com/NatalieCao323/partner-skill
```

用途：

```text
copy SKILL.md / prompts / tools。
作为“现任关系、冷战、道歉、争执修复、长期关系维护”的规则库。
```

复用能力：

```text
现任关系维护
依恋理论
社会交换理论
爱情心理学
关系阶段
冲突修复
长期关系提升
```

partner-skill README 明确其目标是 relationship maintenance and enhancement，并强调本地处理和存储，不用于操控、骚扰或侵犯隐私。([GitHub][5])

---

## 1.6 微信聊天记录项目兼容参考

```text
https://github.com/LC044/WeChatMsg
```

用途：

```text
作为微信聊天记录导出格式兼容参考。
可导入 WeChatMsg 生成的结果。
不要作为唯一采集内核。
```

WeChatMsg 当前 GitHub 页面显示 41.7k stars、5.2k forks，并采用 MIT License。([GitHub][6])

---

## 1.7 风险参考项目，不作为依赖

```text
https://github.com/xaoyaoo/PyWxDump
```

用途：

```text
只作为风险参考。
不要作为默认依赖。
不要直接拉入主工程。
```

PyWxDump 当前仓库 README 写明作者收到微信官方律师函，核心功能存在合规风险，因此移除了全部代码与提交历史，并提示继续使用旧版本可能面临合规争议或法律风险。([GitHub][7])

---

# 2. 总体架构

## 2.1 总架构图

```text
Proma Electron App
├── Renderer：React UI
│   ├── Analysis 工作台
│   ├── Reply Lab 回复工作台
│   ├── Long Review 长聊天复盘
│   ├── Profiles 对象档案
│   ├── History 历史案例
│   ├── Rulebook 规则库
│   ├── WeChat Import 微信同步
│   ├── WeChat Bot 微信 Bot
│   ├── Training 训练模式
│   └── Settings 设置
│
├── Preload：contextBridge
│   └── window.electronAPI.privateCoach.*
│
├── Main Process
│   ├── PrivateCoachWorkflowService
│   ├── ReplyLabService
│   ├── LongReviewService
│   ├── ProfileService
│   ├── CasebookService
│   ├── RulebookService
│   ├── WeChatImportService
│   ├── WeChatBotAdapter
│   ├── ProviderModelClient
│   └── PrivateCoachStore
│
├── Proma Existing Services
│   ├── chat-service.ts
│   ├── channel-manager.ts
│   ├── wechat-bridge.ts
│   ├── document-parser.ts
│   └── settings / local storage
│
├── third_party
│   ├── qingsheng-skill
│   ├── simp-skill
│   ├── she-love-me
│   ├── partner-skill
│   └── WeChatMsg
│
└── ~/.proma/private-coach/
    ├── analyses
    ├── conversations
    ├── profiles
    ├── casebook
    ├── rule-cache
    ├── wechat-import
    ├── wechat-bot
    ├── exports
    └── diagnostics
```

## 2.2 统一原则

不要做：

```text
DesktopAnalysisService
WeChatAnalysisService
LongReviewAnalysisService
```

要做：

```text
PrivateCoachWorkflowService
  <- Desktop Adapter
  <- WeChat Bot Adapter
  <- WeChat Import Adapter
  <- File Import Adapter
```

所有入口最终统一成：

```text
ParsedConversation
```

然后进入同一个 workflow。

---

# 3. 代码拉取与 copy-paste 策略

## 3.1 初始化主工程

```bash
git clone https://github.com/proma-ai/Proma private-communication-coach
cd private-communication-coach

bun install
bun run dev
bun run typecheck
```

如果 `bun run dev` 或 `bun run typecheck` 失败，Codex 必须先修复 Proma 基线，不要先改业务。

---

## 3.2 拉取参考仓库

在 Proma 根目录执行：

```bash
mkdir -p third_party

git clone https://github.com/tomwong001/qingsheng-skill third_party/qingsheng-skill
git clone https://github.com/BeamusWayne/simp-skill third_party/simp-skill
git clone https://github.com/863401402/she-love-me third_party/she-love-me
git clone https://github.com/NatalieCao323/partner-skill third_party/partner-skill
git clone https://github.com/LC044/WeChatMsg third_party/WeChatMsg
```

不要拉入 PyWxDump：

```bash
# 不执行
# git clone https://github.com/xaoyaoo/PyWxDump third_party/PyWxDump
```

原因：该项目已移除代码并明确提示合规风险。([GitHub][7])

---

## 3.3 copy-paste 总规则

采用：

```text
third_party 保持原样
default-skills 放复制后的可用规则
main/lib/private-coach 放适配代码
不要直接改 third_party 原仓库代码
```

目录：

```text
third_party/
  qingsheng-skill/
  simp-skill/
  she-love-me/
  partner-skill/
  WeChatMsg/

apps/electron/default-skills/private-communication-coach/
  SKILL.md
  rule-manifest.json
  references/
  tools/
```

理由：

```text
third_party 保留上游原貌，方便重新同步。
default-skills 是产品真正使用的规则。
private-coach 是我们自己的业务适配层。
```

---

# 4. copy-paste 具体操作

## 4.1 创建目标目录

```bash
mkdir -p apps/electron/default-skills/private-communication-coach/references
mkdir -p apps/electron/default-skills/private-communication-coach/tools
mkdir -p apps/electron/default-skills/private-communication-coach/cases
```

---

## 4.2 复制 qingsheng-skill

```bash
mkdir -p apps/electron/default-skills/private-communication-coach/references/qingsheng

cp -R third_party/qingsheng-skill/skill/* \
  apps/electron/default-skills/private-communication-coach/references/qingsheng/ || true

cp third_party/qingsheng-skill/qingsheng-skill.skill \
  apps/electron/default-skills/private-communication-coach/references/qingsheng/qingsheng-skill.skill || true

cp -R third_party/qingsheng-skill/evals \
  apps/electron/default-skills/private-communication-coach/references/qingsheng/evals || true

cp third_party/qingsheng-skill/README.md \
  apps/electron/default-skills/private-communication-coach/references/qingsheng/README.md || true
```

复用方式：

```text
先原样 copy。
然后通过 rule-manifest 标注用途。
不要直接把全文塞进一个 prompt。
```

接入位置：

```text
stage-classifier.ts
situation-analyzer.ts
reply-generator.ts
rulebook-retriever.ts
risk-guard.ts
```

---

## 4.3 复制 simp-skill

```bash
mkdir -p apps/electron/default-skills/private-communication-coach/references/simp
mkdir -p apps/electron/default-skills/private-communication-coach/tools/simp

cp third_party/simp-skill/SKILL.md \
  apps/electron/default-skills/private-communication-coach/references/simp/SKILL.md || true

cp -R third_party/simp-skill/prompts \
  apps/electron/default-skills/private-communication-coach/references/simp/prompts || true

cp -R third_party/simp-skill/tools \
  apps/electron/default-skills/private-communication-coach/tools/simp || true

cp -R third_party/simp-skill/tests \
  apps/electron/default-skills/private-communication-coach/references/simp/tests || true

cp third_party/simp-skill/README.md \
  apps/electron/default-skills/private-communication-coach/references/simp/README.md || true
```

复用方式：

```text
prompts 作为规则库。
tools/chat_parser.py 通过 child_process sidecar 调用。
不把 Python 解析器重写成 TypeScript。
```

接入位置：

```text
python-tool-runner.ts
file-import-source.ts
long-review-service.ts
rulebook-retriever.ts
```

---

## 4.4 复制 she-love-me

```bash
mkdir -p apps/electron/default-skills/private-communication-coach/references/she-love-me
mkdir -p apps/electron/default-skills/private-communication-coach/tools/she-love-me

cp -R third_party/she-love-me/.agents/skills/she-love-me \
  apps/electron/default-skills/private-communication-coach/references/she-love-me/agent-skill || true

cp -R third_party/she-love-me/traditional-deployment \
  apps/electron/default-skills/private-communication-coach/tools/she-love-me/traditional-deployment || true

cp -R third_party/she-love-me/scripts \
  apps/electron/default-skills/private-communication-coach/tools/she-love-me/scripts || true

cp third_party/she-love-me/README.md \
  apps/electron/default-skills/private-communication-coach/references/she-love-me/README.md || true
```

复用方式：

```text
messages.json 格式直接支持。
analysis_prompt.txt 只参考，不直接当主 prompt。
stats_analyzer.py 尽量 sidecar 调用。
build_chat_history.py 尽量 sidecar 调用。
generate_html_report.py 只参考报告结构，不直接作为桌面 UI。
微信自动导入链路做成触发式高级入口。
```

接入位置：

```text
wechat-import/she-love-provider.ts
wechat-import/messages-json-normalizer.ts
long-review-service.ts
stats-service.ts
risk-guard.ts
report-exporter.ts
```

---

## 4.5 复制 partner-skill

```bash
mkdir -p apps/electron/default-skills/private-communication-coach/references/partner
mkdir -p apps/electron/default-skills/private-communication-coach/tools/partner

cp third_party/partner-skill/SKILL.md \
  apps/electron/default-skills/private-communication-coach/references/partner/SKILL.md || true

cp -R third_party/partner-skill/prompts \
  apps/electron/default-skills/private-communication-coach/references/partner/prompts || true

cp -R third_party/partner-skill/tools \
  apps/electron/default-skills/private-communication-coach/tools/partner || true

cp third_party/partner-skill/README.md \
  apps/electron/default-skills/private-communication-coach/references/partner/README.md || true
```

复用方式：

```text
用于长期关系、争执修复、冷战、道歉、现任维护。
把“操控/模拟伴侣”表达降级成“沟通建议/关系维护”。
```

---

## 4.6 复制 WeChatMsg 参考内容

```bash
mkdir -p apps/electron/default-skills/private-communication-coach/references/wechatmsg

cp third_party/WeChatMsg/README.md \
  apps/electron/default-skills/private-communication-coach/references/wechatmsg/README.md || true
```

复用方式：

```text
只做格式兼容和报告思路参考。
不直接把 WeChatMsg 作为唯一自动采集内核。
```

---

# 5. 完整功能范围

## 5.1 桌面端侧边栏

```text
新建分析
回复工作台
长聊天复盘
对象档案
历史案例
规则库
微信数据同步
微信 Bot
训练模式
设置
诊断
```

## 5.2 功能模块总表

| 模块     | 说明                     | 主要复用项目                   |
| ------ | ---------------------- | ------------------------ |
| 新建分析   | 粘贴聊天，输出局势、三条回复、风险、下一步  | qingsheng, simp          |
| 回复工作台  | 对候选回复继续改写、变短、变稳、变幽默    | qingsheng                |
| 长聊天复盘  | 导入长聊天，输出关系趋势、主动度、冷淡风险  | she-love-me, simp        |
| 对象档案   | 管理某个对象的长期上下文           | qingsheng, she-love-me   |
| 历史案例   | 保存分析记录、反馈、导出           | Proma 本地存储               |
| 规则库    | 管理内置规则、自定义规则、禁用表达      | qingsheng, simp, partner |
| 微信数据同步 | 触发式导入微信聊天记录            | she-love-me, WeChatMsg   |
| 微信 Bot | 手机端命令入口                | Proma wechat-bridge      |
| 训练模式   | 模拟常见沟通场景               | qingsheng, partner       |
| 设置     | Provider、API Key、隐私、数据 | Proma channel-manager    |
| 诊断     | Provider 健康、规则命中、导入状态  | 自研                       |

---

# 6. 核心业务 Workflow

## 6.1 主分析 workflow

```text
analyzeConversation
  -> parseConversation
  -> loadProfileContext
  -> classifyStage
  -> retrieveRules
  -> analyzeSituation
  -> generateReplyCandidates
  -> riskGuard
  -> planNextStep
  -> saveAnalysis
  -> return PrivateCoachResult
```

## 6.2 回复改写 workflow

```text
rewriteReply
  -> loadPreviousAnalysis
  -> parseRewriteInstruction
  -> retrieveStyleRules
  -> rewriteCandidate
  -> riskGuard
  -> saveRevision
  -> return ReplyRevision
```

## 6.3 长聊天复盘 workflow

```text
reviewLongConversation
  -> importMessages
  -> normalizeMessages
  -> computeStats
  -> buildKeyWindows
  -> retrieveLongReviewRules
  -> analyzeRelationshipTrend
  -> generateReviewReport
  -> updateProfileSummary
  -> saveReview
```

## 6.4 微信导入 workflow

```text
triggerWechatImport
  -> checkAvailability
  -> requestConsent
  -> listContacts
  -> chooseContact
  -> chooseDateRange
  -> exportMessages
  -> normalizeMessages
  -> previewImport
  -> confirmImport
  -> saveConversation
  -> optionalAnalyze
```

## 6.5 微信 Bot workflow

```text
handleWechatCommand
  -> parseCommand
  -> loadWechatSession
  -> convertToWorkflowInput
  -> PrivateCoachWorkflowService.run
  -> formatForWechat
  -> sendReply
```

---

# 7. 目标目录结构

## 7.1 主业务目录

```text
apps/electron/src/main/lib/private-coach/
  types.ts
  constants.ts
  index.ts

  workflow/
    workflow-service.ts
    stage-classifier.ts
    situation-analyzer.ts
    reply-generator.ts
    risk-guard.ts
    next-step-planner.ts
    prompt-builder.ts
    json-repair.ts

  model/
    model-client.ts
    proma-chat-model-client.ts
    mock-model-client.ts

  parser/
    parser.ts
    text-parser.ts
    file-parser.ts
    messages-json-parser.ts

  rulebook/
    prompt-loader.ts
    rulebook-retriever.ts
    rule-manifest-generator.ts
    rule-types.ts

  reply-lab/
    reply-lab-service.ts
    rewrite-service.ts
    tone-service.ts

  long-review/
    long-review-service.ts
    stats-service.ts
    key-window-builder.ts
    review-report-builder.ts

  profiles/
    profile-service.ts
    profile-store.ts
    profile-summary-builder.ts

  casebook/
    casebook-service.ts
    casebook-store.ts
    case-search.ts

  wechat-bot/
    wechat-adapter.ts
    command-parser.ts
    formatter.ts
    session-store.ts

  wechat-import/
    types.ts
    import-provider.ts
    import-service.ts
    she-love-provider.ts
    wechatmsg-provider.ts
    manual-file-provider.ts
    clipboard-provider.ts
    folder-watch-provider.ts
    db-import-provider.experimental.ts
    she-love-runner.ts
    contact-normalizer.ts
    messages-json-normalizer.ts
    import-preview-builder.ts
    import-store.ts
    consent-gate.ts

  privacy/
    redactor.ts
    consent.ts
    retention-policy.ts

  storage/
    private-coach-store.ts
    markdown-exporter.ts
    jsonl-writer.ts
    path-resolver.ts

  tools/
    python-tool-runner.ts
    file-hash.ts
```

## 7.2 Renderer UI 目录

```text
apps/electron/src/renderer/components/private-coach/
  layout/
    PrivateCoachLayout.tsx
    PrivateCoachSidebar.tsx

  analysis/
    AnalysisPage.tsx
    AnalysisInputPanel.tsx
    AnalysisResultPanel.tsx
    SignalList.tsx
    RiskBadge.tsx
    StageBadge.tsx

  reply-lab/
    ReplyLabPage.tsx
    ReplyCard.tsx
    RewritePanel.tsx
    ToneSelector.tsx
    StrengthSlider.tsx

  long-review/
    LongReviewPage.tsx
    ImportLongChatPanel.tsx
    ReviewReportPanel.tsx
    StatsCards.tsx
    KeyWindowList.tsx

  profiles/
    ProfilesPage.tsx
    ProfileList.tsx
    ProfileDetail.tsx
    ProfileTimeline.tsx

  history/
    HistoryPage.tsx
    HistoryList.tsx
    HistoryDetail.tsx
    FeedbackPanel.tsx

  rulebook/
    RulebookPage.tsx
    RuleSourceList.tsx
    CustomRuleEditor.tsx
    ForbiddenExpressionEditor.tsx

  wechat-import/
    WeChatImportPage.tsx
    WeChatImportIntroCard.tsx
    WeChatAvailabilityCard.tsx
    WeChatContactList.tsx
    WeChatDateRangeSelector.tsx
    WeChatImportProgress.tsx
    WeChatImportPreviewDialog.tsx
    WeChatImportResultCard.tsx

  wechat-bot/
    WeChatBotPage.tsx
    WeChatBotStatusCard.tsx
    WeChatCommandGuide.tsx
    WeChatSessionList.tsx

  training/
    TrainingPage.tsx
    ScenarioSelector.tsx
    TrainingChatPanel.tsx
    TrainingReviewPanel.tsx

  settings/
    PrivateCoachSettingsPage.tsx
    ProviderSettingsPanel.tsx
    PrivacySettingsPanel.tsx
    DataManagementPanel.tsx

  diagnostics/
    DiagnosticsPage.tsx
    ProviderHealthPanel.tsx
    RuleHitPanel.tsx
    ImportLogPanel.tsx
```

## 7.3 Shared 类型目录

```text
packages/shared/src/types/private-coach.ts
packages/shared/src/types/private-coach-wechat.ts
packages/shared/src/constants/private-coach-ipc.ts
```

---

# 8. 数据模型设计

## 8.1 输入类型

```ts
export type PrivateCoachSource =
  | 'desktop'
  | 'wechat_bot'
  | 'wechat_import'
  | 'file_import'
  | 'clipboard'

export type PrivateCoachPlatform =
  | 'wechat'
  | 'qq'
  | 'soul'
  | 'tantan'
  | 'bumble'
  | 'tinder'
  | 'xiaohongshu'
  | 'instagram'
  | 'generic'

export type PrivateCoachScene =
  | '未指定'
  | '初次破冰'
  | '冷场挽回'
  | '暧昧推进'
  | '邀约推进'
  | '争执修复'
  | '相亲开场'
  | '长期关系'
  | '聊天复盘'
  | '复联'
  | '体面收束'

export type PrivateCoachTone =
  | '稳妥'
  | '轻松'
  | '真诚'
  | '克制'
  | '幽默'
  | '直接'
  | '温柔'
  | '收束'

export type PrivateCoachRiskLevel = 'low' | 'medium' | 'high' | 'block'

export interface PrivateCoachWorkflowInput {
  source: PrivateCoachSource
  platform: PrivateCoachPlatform
  sceneHint?: PrivateCoachScene
  profileId?: string
  userGoal?: string
  tonePreference?: PrivateCoachTone
  pushStrength?: 1 | 2 | 3 | 4 | 5
  conversationText?: string
  messages?: ParsedMessage[]
  importedConversationId?: string
  providerId?: string
  analysisDepth: 'fast' | 'standard' | 'deep'
  options?: {
    saveHistory?: boolean
    includeRuleDebug?: boolean
    maxRuleChars?: number
    saveRawConversation?: boolean
    redactBeforeModel?: boolean
  }
}
```

## 8.2 消息类型

```ts
export interface ParsedMessage {
  id: string
  speaker: 'me' | 'other' | 'system' | 'unknown'
  speakerName?: string
  content: string
  contentType?: 'text' | 'image' | 'voice' | 'video' | 'file' | 'link' | 'system'
  timestamp?: number
  timestampText?: string
  raw?: string
}

export interface ParsedConversation {
  id?: string
  platform: PrivateCoachPlatform
  messages: ParsedMessage[]
  messageCount: number
  speakers: string[]
  textPreview: string
  startTime?: number
  endTime?: number
  sourceMeta?: {
    source: PrivateCoachSource
    originalPath?: string
    importedAt?: string
  }
}
```

## 8.3 分析结果类型

```ts
export interface PrivateCoachResult {
  analysisId: string
  createdAt: string

  scene: PrivateCoachScene | string
  relationshipStage: string
  riskLevel: PrivateCoachRiskLevel

  otherInterestLevel: number
  userPressureLevel: number
  relationshipTemperature: number
  shouldReplyNow: boolean

  situationSummary: string

  signals: Array<{
    type: 'positive' | 'neutral' | 'risk' | 'boundary'
    text: string
    evidence?: string
  }>

  replyCandidates: PrivateCoachReplyCandidate[]

  warnings: string[]
  dontDo: string[]
  nextStep: string
  followUpOptions: string[]

  confidence: number

  debug?: {
    usedRuleIds?: string[]
    rawModelOutput?: string
    model?: string
    latencyMs?: number
  }
}

export interface PrivateCoachReplyCandidate {
  id: string
  tone: PrivateCoachTone
  content: string
  copyText: string
  why: string
  bestFor?: string
  riskNote?: string
  strength?: number
}
```

## 8.4 对象档案

```ts
export interface RelationshipProfile {
  profileId: string
  alias: string
  platform: PrivateCoachPlatform
  createdAt: string
  updatedAt: string

  relationshipStage: string
  userGoal?: string

  knownFrom?: string
  preferences: string[]
  avoid: string[]
  userStyleNotes: string[]

  recentSummary?: string
  longTermSummary?: string

  riskTags: string[]
  keyEvents: Array<{
    id: string
    time: string
    title: string
    summary: string
    relatedAnalysisId?: string
  }>

  linkedConversationIds: string[]
  linkedAnalysisIds: string[]
}
```

## 8.5 微信导入数据

```ts
export type WeChatImportProviderType =
  | 'she_love_me'
  | 'wechatmsg'
  | 'manual_file'
  | 'clipboard'
  | 'folder_watch'
  | 'experimental_db'

export interface WeChatNormalizedConversation {
  id: string
  providerType: WeChatImportProviderType
  platform: 'wechat'
  contactId: string
  contactAlias?: string
  importedAt: string
  messageCount: number
  startTime?: number
  endTime?: number
  messages: WeChatNormalizedMessage[]
  meta?: {
    originalFilePath?: string
    sourceProject?: 'she-love-me' | 'WeChatMsg' | 'simp-skill' | 'manual'
    redacted: boolean
  }
}

export interface WeChatNormalizedMessage {
  id: string
  conversationId: string
  contactId: string
  sender: 'me' | 'other' | 'system' | 'unknown'
  senderName?: string
  contentType: 'text' | 'image' | 'voice' | 'video' | 'file' | 'link' | 'system'
  contentText: string
  timestamp?: number
  timestampText?: string
}
```

---

# 9. 本地存储设计

Proma 已使用 `~/.proma/` 下的 JSON/JSONL 文件组织数据，并通过 Electron `safeStorage` 加密 API Key。([GitHub][1])
我们沿用这个设计，不引入 SQLite，除非后续数据量大到 JSONL 不够。

```text
~/.proma/private-coach/
  settings.json

  analyses/
    ana_xxx.json

  analyses-jsonl/
    2026-06.jsonl

  conversations/
    conv_xxx.json

  profiles/
    profiles.json
    profile_xxx.json

  casebook/
    index.json
    imported/
    generated/
    favorites/

  rule-cache/
    rule-manifest.cache.json
    embeddings-cache.json

  wechat-import/
    import-jobs.jsonl
    conversations/
      wechat_conv_xxx.json
    contacts/
      contacts.json
    previews/
      preview_xxx.json

  wechat-bot/
    sessions.json
    command-log.jsonl

  exports/
    ana_xxx.md
    review_xxx.md
    profile_xxx.zip

  diagnostics/
    provider-health.jsonl
    model-errors.jsonl
    import-errors.jsonl
```

默认保存策略：

```text
聊天原文：用户可选
分析结果：默认保存
微信导入原始数据库：不保存
未确认剪贴板内容：不保存
普通日志：不写聊天正文
```

---

# 10. Rulebook 设计

## 10.1 rule-manifest.json

路径：

```text
apps/electron/default-skills/private-communication-coach/rule-manifest.json
```

示例：

```json
{
  "version": 1,
  "rules": [
    {
      "id": "qingsheng-main",
      "source": "qingsheng",
      "relativePath": "references/qingsheng/SKILL.md",
      "tags": ["破冰", "暧昧", "邀约", "冷场", "微信"],
      "stages": ["classify", "analyze", "generate", "plan"]
    },
    {
      "id": "simp-chat-parser",
      "source": "simp",
      "relativePath": "references/simp/SKILL.md",
      "tags": ["信号", "危机", "冷场", "微信", "QQ"],
      "stages": ["classify", "analyze", "generate"]
    },
    {
      "id": "she-love-long-review",
      "source": "she-love-me",
      "relativePath": "references/she-love-me/agent-skill/SKILL.md",
      "tags": ["长聊天", "复盘", "指数", "微信"],
      "stages": ["analyze", "review", "plan"]
    },
    {
      "id": "partner-conflict",
      "source": "partner",
      "relativePath": "references/partner/SKILL.md",
      "tags": ["现任", "争执", "冷战", "道歉", "修复"],
      "stages": ["analyze", "generate", "plan"]
    }
  ]
}
```

## 10.2 自动生成 manifest

新增脚本：

```text
apps/electron/scripts/generate-private-coach-manifest.ts
```

规则：

```text
路径包含 qingsheng：
tags = ["破冰", "暧昧", "邀约", "冷场", "微信"]
stages = ["classify", "analyze", "generate", "plan"]

路径包含 simp：
tags = ["信号", "危机", "冷场", "追求", "聊天解析"]
stages = ["classify", "analyze", "generate"]

路径包含 she-love-me：
tags = ["长聊天", "复盘", "指数", "微信", "统计"]
stages = ["analyze", "review", "plan"]

路径包含 partner：
tags = ["现任", "争执", "冷战", "修复", "长期关系"]
stages = ["analyze", "generate", "plan"]
```

---

# 11. Prompt 与模型调用设计

## 11.1 模型调用原则

不要直接新写 OpenAI SDK。

必须复用 Proma：

```text
@proma/core Provider Adapter
chat-service.ts
channel-manager.ts
```

Proma README 说明 Chat 模式可使用 OpenAI、Anthropic、Google 或 OpenAI-compatible，Agent 模式要求 Anthropic 或 Anthropic-compatible；本业务主要做结构化分析和回复生成，因此优先接 Chat，不走 Agent runtime。([GitHub][1])

## 11.2 ModelClient 接口

```ts
export interface PrivateCoachModelClient {
  completeJson<T>(args: {
    providerId?: string
    system?: string
    prompt: string
    schemaName: string
    temperature?: number
  }): Promise<T>
}
```

## 11.3 Prompt 类型

```text
Classify Prompt：
判断场景、关系阶段、风险等级、关键聊天信号。

Analyze Prompt：
分析局势、对方投入度、用户需求感、推进窗口、翻车点。

Generate Prompt：
生成三条候选回复。

Risk Guard Prompt：
检查骚扰、操控、纠缠、情绪勒索、未成年人等风险。

Next Step Prompt：
输出下一步策略。

Review Prompt：
长聊天复盘，结合 stats.json 和关键窗口。

Rewrite Prompt：
根据用户指令重写候选回复。
```

## 11.4 JSON 修复

````ts
export function parseJsonFromModel<T>(raw: string): T {
  const trimmed = raw.trim()

  try {
    return JSON.parse(trimmed) as T
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced?.[1]) {
    return JSON.parse(fenced[1]) as T
  }

  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first >= 0 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1)) as T
  }

  throw new Error('模型输出不是合法 JSON')
}
````

---

# 12. 微信聊天记录同步设计

## 12.1 产品形态

不是后台静默抓取。

要做成：

```text
用户点击「同步微信聊天记录」
  -> 检测环境
  -> 用户授权说明
  -> 检测微信状态
  -> 获取联系人列表
  -> 用户选择联系人
  -> 用户选择时间范围
  -> 导出 messages.json
  -> 预览确认
  -> 保存到本地
  -> 可选直接分析
```

## 12.2 WeChatImportProvider

```ts
export interface WeChatImportProvider {
  type: WeChatImportProviderType

  checkAvailability(): Promise<WeChatImportAvailability>

  setup?(): Promise<void>

  listContacts(): Promise<WeChatContactSummary[]>

  exportMessages(input: {
    contactId: string
    dateRange: {
      start?: string
      end?: string
    }
    explicitConsent: true
  }): Promise<WeChatExportResult>

  normalizeMessages(result: WeChatExportResult): Promise<WeChatNormalizedConversation>
}
```

## 12.3 Provider 实现

```text
SheLoveProvider：
主实现。调用 third_party/she-love-me/scripts。

WeChatMsgProvider：
兼容导入 WeChatMsg 输出结果。先 stub。

ManualFileProvider：
导入 TXT / JSON / CSV / HTML。

ClipboardProvider：
监听剪贴板，用户确认后导入。

FolderWatchProvider：
监听用户指定目录，新文件出现后进入待确认。

ExperimentalDbProvider：
保留 stub，默认 disabled。
```

## 12.4 SheLoveProvider 复用方式

优先复用：

```text
third_party/she-love-me/scripts/extract_messages.py
third_party/she-love-me/scripts/stats_analyzer.py
third_party/she-love-me/scripts/build_chat_history.py
third_party/she-love-me/scripts/generate_html_report.py
third_party/she-love-me/traditional-deployment
```

但注意：Codex 不要硬编码脚本一定存在。必须先扫描：

```bash
find third_party/she-love-me -maxdepth 3 -type f | sort
find third_party/she-love-me/scripts -maxdepth 1 -type f | sort
find third_party/she-love-me/traditional-deployment -maxdepth 2 -type f | sort
```

然后匹配最接近脚本。

## 12.5 不复用 she-love-me 的部分

不复用：

```text
/she-love-me 命令入口
她爱我吗 / 舔狗鉴定所 / 祖师爷寄语等产品叙事
童锦程视角
被爱指数这个名字
默认后台自动解密
自动导入所有联系人
QQ 链路第一阶段
表情资源下载第一阶段
原 HTML 页面作为主 UI
心理诊断式结论
```

复用但改名：

```text
主动指数 -> 用户主动度
被爱指数 -> 对方投入度
冷淡指数 -> 冷淡风险
话语权分析 -> 对话主导权
危险信号 -> 风险信号
依恋类型诊断 -> 沟通倾向观察
```

---

# 13. 微信 Bot 设计

## 13.1 命令

```text
/帮助
/分析
/回复
/冷场
/邀约
/争执
/道歉
/复盘
/更稳
/更短
/更幽默
/不回
/保存
/删除
```

## 13.2 数据流

```text
wechat-bridge.ts
  -> WeChatBotAdapter.handleMessage
  -> parseCommand
  -> loadSession
  -> PrivateCoachWorkflowService.run
  -> formatForWechat
  -> sendWechatMessage
```

## 13.3 微信输出模板

```text
【场景】暧昧推进
【阶段】轻度试探期
【风险】中

【局势】
对方没有明确拒绝，但承诺感弱。你现在适合轻推，不适合逼问。

【可发】
1. 稳妥：...
2. 轻松：...
3. 收束：...

【别做】
不要继续追问“到底有没有空”。

【下一步】
如果对方没接话，24-48 小时后换轻话题打开。
```

## 13.4 限制

```text
只响应命令
群聊只响应 @Bot 或 /命令
不主动私聊
不自动替用户发送给第三方
不监听所有聊天
不写聊天正文到普通日志
```

---

# 14. UI 页面设计

## 14.1 新建分析页面

左侧：

```text
平台选择
关系类型
场景选择
用户目标
语气偏好
推进强度
聊天记录输入框
导入文件按钮
开始分析按钮
```

右侧：

```text
场景 Badge
关系阶段 Badge
风险 Badge
对方投入度
用户压力值
关系温度
局势摘要
信号列表
三条候选回复
不建议发送
下一步策略
后续操作按钮
```

## 14.2 回复工作台

功能：

```text
查看历史候选回复
继续改写
更短
更稳
更幽默
更真诚
降低需求感
改成邀约
改成收束
复制
收藏
```

## 14.3 长聊天复盘

功能：

```text
导入 messages.json / TXT / CSV / HTML
选择对象档案
选择时间范围
生成统计卡片
生成关系趋势报告
提取关键窗口
输出下一步策略
导出 Markdown
```

## 14.4 对象档案

功能：

```text
新建对象
绑定历史分析
绑定导入聊天
查看时间线
查看对方偏好
查看雷点
查看关系阶段变化
编辑备注
删除对象
```

## 14.5 规则库

功能：

```text
查看内置规则
查看规则来源
启用 / 禁用规则源
编辑自定义规则
编辑禁用表达
生成 rule-manifest
查看命中规则
```

## 14.6 微信数据同步

页面卡片：

```text
同步微信
导入 messages.json
导入 she-love-me 输出目录
导入 WeChatMsg 输出目录
剪贴板监听
文件夹监听
实验性本机导入
```

## 14.7 诊断页

```text
Provider 健康检查
微信导入环境检查
Python 环境检查
规则库状态
最近模型错误
JSON 修复记录
最近导入日志
本地数据路径
```

---

# 15. IPC 设计

新增 IPC 常量：

```ts
export const PRIVATE_COACH_IPC = {
  ANALYZE_CONVERSATION: 'privateCoach:analyzeConversation',
  REWRITE_REPLY: 'privateCoach:rewriteReply',
  REVIEW_LONG_CONVERSATION: 'privateCoach:reviewLongConversation',

  LIST_ANALYSES: 'privateCoach:listAnalyses',
  GET_ANALYSIS: 'privateCoach:getAnalysis',
  DELETE_ANALYSIS: 'privateCoach:deleteAnalysis',
  EXPORT_ANALYSIS_MARKDOWN: 'privateCoach:exportAnalysisMarkdown',

  LIST_PROFILES: 'privateCoach:listProfiles',
  GET_PROFILE: 'privateCoach:getProfile',
  UPSERT_PROFILE: 'privateCoach:upsertProfile',
  DELETE_PROFILE: 'privateCoach:deleteProfile',

  LIST_RULES: 'privateCoach:listRules',
  RELOAD_RULES: 'privateCoach:reloadRules',
  UPSERT_CUSTOM_RULE: 'privateCoach:upsertCustomRule',

  WECHAT_IMPORT_CHECK: 'privateCoach:wechatImport:check',
  WECHAT_IMPORT_LIST_CONTACTS: 'privateCoach:wechatImport:listContacts',
  WECHAT_IMPORT_EXPORT_MESSAGES: 'privateCoach:wechatImport:exportMessages',
  WECHAT_IMPORT_PREVIEW: 'privateCoach:wechatImport:preview',
  WECHAT_IMPORT_CONFIRM: 'privateCoach:wechatImport:confirm',
  WECHAT_IMPORT_ANALYZE: 'privateCoach:wechatImport:analyze',

  WECHAT_BOT_STATUS: 'privateCoach:wechatBot:status',
  WECHAT_BOT_LIST_SESSIONS: 'privateCoach:wechatBot:listSessions',

  CHECK_PROVIDER_HEALTH: 'privateCoach:checkProviderHealth',
  EXPORT_ALL_DATA: 'privateCoach:exportAllData',
  DELETE_ALL_DATA: 'privateCoach:deleteAllData'
} as const
```

---

# 16. Python Sidecar 调用

```ts
import { spawn } from 'node:child_process'

export interface PythonToolResult {
  stdout: string
  stderr: string
  exitCode: number
}

export function runPythonTool(args: {
  scriptPath: string
  args: string[]
  cwd: string
  timeoutMs?: number
}): Promise<PythonToolResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('python', [args.scriptPath, ...args.args], {
      cwd: args.cwd,
      shell: process.platform === 'win32',
    })

    let stdout = ''
    let stderr = ''

    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`Python tool timeout: ${args.scriptPath}`))
    }, args.timeoutMs ?? 120000)

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({
        stdout,
        stderr,
        exitCode: code ?? -1,
      })
    })
  })
}
```

要求：

```text
所有 Python 工具 stdout/stderr 不直接写入普通日志。
错误日志必须脱敏。
脚本路径必须来自 allowlist。
不能执行用户任意输入路径里的 Python。
```

---

# 17. 隐私与安全设计

## 17.1 显式授权

所有微信导入必须经过：

```text
用户点击
说明弹窗
选择联系人
选择时间范围
预览确认
```

不允许：

```text
App 启动自动扫描
后台定时读取
默认导入所有联系人
自动上传模型
自动发送给对方
```

## 17.2 数据脱敏

默认识别：

```text
手机号
微信号
QQ号
邮箱
身份证
地址
公司
学校
真实姓名
二维码文本
URL Token
```

## 17.3 日志策略

允许记录：

```text
时间
模块
provider
模型
耗时
错误码
token 数
导入文件 hash
规则命中 id
```

不允许记录：

```text
完整聊天正文
完整 prompt
完整模型输出
微信数据库路径细节
API Key
联系人真实名称，除非用户确认保存
```

## 17.4 风险守卫

阻断场景：

```text
骚扰
跟踪
威胁
情绪勒索
未成年人暧昧
对方明确拒绝后继续纠缠
明显操控
虚假身份伪装
```

原报告也强调，产品不要做自动接管、自动发送、伪装身份、PUA 话术，并应避免“拿下/代聊/操控”的叙事。

---

# 18. 多角度考量

## 18.1 产品角度

核心卖点不是“帮你回一句话”，而是：

```text
判断局势
解释信号
给可发回复
告诉你什么时候不要回
规划下一步
保存案例
长期复盘
```

报告也指出，通用 ChatGPT 已经能手动粘贴聊天记录问答，因此产品不能只是大模型壳，必须提供更低操作成本和更可控结构化输出。

## 18.2 技术角度

选择 Proma 的原因：

```text
已有跨平台桌面端
已有 Provider Adapter
已有 Chat/Agent/Skills
已有微信桥接入口
已有本地存储结构
已有 safeStorage API Key 方案
```

不从零写 Electron。

## 18.3 复用角度

最大化 copy-paste：

```text
Proma：整仓 fork，原地改
qingsheng：copy skill/prompt/evals
simp：copy prompts/tools/tests
she-love-me：copy scripts/traditional-deployment/agent-skill
partner：copy SKILL/prompts/tools
WeChatMsg：copy README，兼容输出格式
```

## 18.4 合规 / 风险角度

微信自动导入是高风险模块，所以必须：

```text
触发式
本机运行
联系人选择
时间范围选择
预览确认
可关闭
可删除
不静默
不常驻抓取
```

PyWxDump 的移除说明可作为风险警示，不作为依赖。([GitHub][7])

## 18.5 用户体验角度

完整产品体验应该是：

```text
桌面端：
完整工作台

微信 Bot：
快速入口

微信同步：
触发式数据导入

对象档案：
长期上下文

历史案例：
复盘与沉淀

规则库：
让产品不像 prompt 壳
```

## 18.6 工程可维护角度

不要让所有功能塞进一个 `workflow-service.ts`。

必须拆：

```text
workflow
reply-lab
long-review
profiles
casebook
rulebook
wechat-import
wechat-bot
privacy
storage
diagnostics
```

## 18.7 降级角度

如果微信自动导入失败：

```text
降级到 messages.json 导入
降级到 TXT/CSV/HTML 导入
降级到剪贴板监听
降级到手动粘贴
```

如果模型失败：

```text
切换 provider
输出本地规则简析
提示用户重试
保留输入不丢失
```

---

# 19. 开发阶段规划

## Phase 0：拉仓库与基线确认

```text
clone Proma
bun install
bun run dev
bun run typecheck
clone third_party
copy default-skills
生成 rule-manifest
```

验收：

```text
Proma 原应用能启动
没有引入业务代码前 typecheck 通过
third_party 完整存在
default-skills 已复制
```

---

## Phase 1：完整产品骨架

做：

```text
侧边栏页面全部建好
PrivateCoachLayout
AnalysisPage
ReplyLabPage
LongReviewPage
ProfilesPage
HistoryPage
RulebookPage
WeChatImportPage
WeChatBotPage
TrainingPage
SettingsPage
DiagnosticsPage
```

服务层做：

```text
PrivateCoachWorkflowService mock
RulebookService 可读取规则
PrivateCoachStore 可保存 JSON
IPC 打通
Preload 打通
```

验收：

```text
所有页面可打开
所有 IPC 有 mock 返回
能保存一条 mock 分析
```

---

## Phase 2：核心分析跑通

做：

```text
Parser
RulebookRetriever
PromptBuilder
PromaChatModelClient
JSON repair
StageClassifier
SituationAnalyzer
ReplyGenerator
RiskGuard
NextStepPlanner
```

验收：

```text
粘贴聊天记录
选择场景
调用真实模型
返回结构化 JSON
展示三条回复
复制回复
保存历史
```

---

## Phase 3：回复工作台与历史案例

做：

```text
rewriteReply
收藏回复
反馈按钮
历史详情
导出 Markdown
自定义风格
禁用表达
```

验收：

```text
用户可以对候选回复继续改写
可以标记“太油/太怂/有用”
可以导出分析
```

---

## Phase 4：长聊天复盘

做：

```text
messages.json 导入
TXT/CSV/HTML 导入
调用 simp chat_parser.py
调用 she-love stats_analyzer.py
调用 build_chat_history.py
生成复盘报告
```

验收：

```text
导入长聊天
生成主动度、冷淡风险、对话主导权、关键窗口
输出复盘报告
```

---

## Phase 5：对象档案

做：

```text
创建对象档案
绑定分析记录
绑定导入会话
生成对象摘要
关系时间线
风险标签
偏好/雷点管理
```

验收：

```text
同一对象多次分析可以归档
能看到关系阶段变化
```

---

## Phase 6：微信 Bot

做：

```text
复用 Proma wechat-bridge.ts
接 WeChatBotAdapter
实现命令解析
实现微信短文本格式化
实现 session
```

验收：

```text
/帮助
/分析
/回复
/冷场
/邀约
/复盘
/更稳
/更短
```

---

## Phase 7：触发式微信同步

做：

```text
SheLoveProvider
checkAvailability
listContacts
exportMessages
previewImport
confirmImport
analyzeImportedConversation
```

验收：

```text
用户点击同步微信
选择联系人
选择时间范围
导出 messages.json
预览
确认
分析
```

---

## Phase 8：安全、诊断、打包

做：

```text
脱敏
隐私设置
删除数据
导出全部数据
Provider 健康检查
微信导入诊断
Windows/macOS 打包
```

验收：

```text
Windows/macOS 安装包可运行
敏感日志不落盘
用户可删除全部数据
```

---

# 20. Codex 总任务指令

下面这段可以直接贴给 Codex：

```text
你现在在 Proma 仓库中工作。目标是把 Proma 改造成“私密沟通教练”桌面产品。

总体要求：
1. 不从零写 Electron。
2. 直接在 Proma 基础上改。
3. 最大化 copy-paste 复用第三方项目。
4. 所有参考项目先拉到 third_party。
5. third_party 保持原样，不直接改上游代码。
6. 将可用 prompt / skill / tools 复制到 apps/electron/default-skills/private-communication-coach。
7. 新业务代码放到 apps/electron/src/main/lib/private-coach。
8. 桌面端、微信 Bot、微信导入都调用同一个 PrivateCoachWorkflowService。
9. 微信导入只作为数据输入源，不创建独立分析内核。
10. 不做后台静默抓取，不做自动发送，不做代聊。

先执行：
git clone https://github.com/tomwong001/qingsheng-skill third_party/qingsheng-skill
git clone https://github.com/BeamusWayne/simp-skill third_party/simp-skill
git clone https://github.com/863401402/she-love-me third_party/she-love-me
git clone https://github.com/NatalieCao323/partner-skill third_party/partner-skill
git clone https://github.com/LC044/WeChatMsg third_party/WeChatMsg

不要拉 PyWxDump。

第一阶段：
1. 确认 Proma 基线可运行。
2. 建立完整 private-coach 目录。
3. 建立完整 UI 页面骨架。
4. 建立 shared types 和 IPC。
5. 建立 mock workflow。
6. 建立本地 JSON/JSONL store。
7. 复制 qingsheng/simp/she-love/partner 内容到 default-skills。
8. 生成 rule-manifest.json。

第二阶段：
1. 打通真实模型调用。
2. 实现 parser。
3. 实现 rulebook retriever。
4. 实现 analyzeConversation。
5. 实现 reply generation。
6. 实现 risk guard。
7. 实现 history 和 markdown export。

第三阶段：
1. 实现 reply lab。
2. 实现 long review。
3. 接 simp chat_parser.py。
4. 接 she-love messages.json / stats.json / build_chat_history。
5. 实现 profiles。
6. 实现 casebook。

第四阶段：
1. 复用 Proma wechat-bridge。
2. 实现微信 Bot 命令。
3. 实现微信短文本结果格式化。
4. 实现 session。

第五阶段：
1. 实现触发式微信同步。
2. 优先接 SheLoveProvider。
3. 支持 checkAvailability / listContacts / exportMessages / preview / confirm / analyze。
4. 所有导入必须用户显式触发、选择联系人和时间范围、预览确认。
5. 不允许后台静默扫描微信数据库。
```

---

# 21. 验收标准

## 完整骨架验收

```text
所有侧边栏页面存在
所有页面可打开
IPC mock 返回正常
本地存储可写入
规则库已复制
rule-manifest 可生成
```

## 核心分析验收

```text
粘贴聊天记录
选择场景和语气
调用模型
返回结构化结果
展示风险等级
展示三条回复
复制回复
保存历史
导出 Markdown
```

## 长聊天复盘验收

```text
导入 messages.json
导入 TXT/CSV/HTML
生成统计
提取关键窗口
生成复盘报告
绑定对象档案
```

## 微信 Bot 验收

```text
/帮助 可用
/分析 可用
/回复 可用
/冷场 可用
/邀约 可用
/复盘 可用
/更稳 可基于上一条分析改写
```

## 微信同步验收

```text
用户点击触发
能检测环境
能列出联系人
能选择时间范围
能导出 messages.json
能预览
能确认导入
能分析
失败时能降级到手动导入
```

## 安全验收

```text
普通日志不含聊天正文
API Key 不进 renderer
微信导入不能后台自动运行
用户可删除全部数据
导出数据可控
高风险回复会被阻断或重写
```

---

# 22. 最终技术决策

最终采用：

```text
Proma 作为主工程，直接 fork 改。
qingsheng-skill 作为暧昧/破冰/邀约/冷场主规则库。
simp-skill 作为信号分析和聊天记录解析工具库。
she-love-me 作为微信触发式导入、长聊天统计、复盘报告的主复用对象。
partner-skill 作为现任关系和冲突修复规则库。
WeChatMsg 作为格式兼容和微信记录生态参考。
PyWxDump 不作为依赖，只作为风险警示。
```

最终产品形态：

```text
Windows/macOS 桌面端完整工作台
+
微信 Bot 快速入口
+
触发式微信聊天记录同步
+
本地规则库 / 案例库 / 对象档案
+
统一 PrivateCoachWorkflowService
```

最关键边界：

```text
可以导入聊天记录
可以触发式同步微信
可以分析局势
可以生成回复
可以提醒风险
可以长期复盘

不做后台偷抓
不做自动代聊
不做自动发送
不做伪装人格
不做 PUA 话术产品
```

这个方案的核心不是“少写代码”，而是**把已有项目中已经验证过的能力拆出来，变成 Proma 桌面产品里的可维护模块**。先 copy-paste，后适配；先跑通，后清洗；先复用，再抽象。

[1]: https://github.com/proma-ai/Proma "GitHub - proma-ai/Proma: 把最丝滑的通用 Agent 体验带进你的工作流，为 100x 专业用户而生的未来产品，正在实现 proactive Agent 阶段。基于 Claude Agent SDK 的完整开源实践，原生支持飞书群聊调用、灵活接入任意大模型供应商 —— 让顶级 Agent 能力真正跑在你每天用的地方。 · GitHub"
[2]: https://github.com/tomwong001/qingsheng-skill "GitHub - tomwong001/qingsheng-skill: 情圣 · Claude Code 中文恋爱教练技能 · 微信/探探/Soul/Bumble/青藤之恋聊天截图分析 · 高情商回复生成 · 7阶段关系推进 · GitHub"
[3]: https://github.com/BeamusWayne/simp-skill "GitHub - BeamusWayne/simp-skill: 不教 PUA，只教真心。Win your crush before it's too late. Inspired by colleague-skill（同事skill） · GitHub"
[4]: https://github.com/863401402/she-love-me "GitHub - 863401402/she-love-me: 她不一样   恋情分析室 — 微信聊天记录恋爱分析 Agent Skill  （曾用名：她爱我吗？） · GitHub"
[5]: https://github.com/NatalieCao323/partner-skill "GitHub - NatalieCao323/partner-skill: Distill your partner into a living AI Skill. Relationship maintenance and enhancement powered by attachment theory, social exchange theory, and love psychology. · GitHub"
[6]: https://github.com/LC044/WeChatMsg "GitHub - LC044/WeChatMsg · GitHub"
[7]: https://github.com/xaoyaoo/PyWxDump "GitHub - xaoyaoo/PyWxDump: 删库 · GitHub"
