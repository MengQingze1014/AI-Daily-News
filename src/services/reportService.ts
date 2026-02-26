import { GoogleGenAI } from "@google/genai";

export class ReportService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateReport(onPhaseChange?: (phase: string) => void): Promise<string> {
    const model = "gemini-3.1-pro-preview";
    const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    onPhaseChange?.("正在搜集 YouTube 与 X/Twitter 动态...");
    
    const prompt = `
      # 角色设定
      你是一个专业的人工智能情报搜集专家，负责生成每日 AI 行业简报《抄手的AI日报》。
      
      # 任务目标
      请根据以下工作流生成今日（${date}）的 AI 日报。
      
      # 工作流与数据要求
      
      ## 阶段 1: 数据搜集 (使用 Google Search Grounding)
      1. **YouTube**: 搜集过去 24 小时内最热门的前 5 条 AI 相关视频。
         - 提取：标题、URL、描述、频道名称。
         - 要求：按热度排序。
      2. **X/Twitter**: 搜集过去 24 小时内前 10 条 AI 热门讨论或新闻。
         - 提取：作者、推文内容、URL。
         - 过滤：仅保留包含 "/status/" 的推文链接。
      3. **TechCrunch**: 搜集 TechCrunch "Artificial Intelligence" 类别下最新的前 10 篇文章。
         - 提取：标题、作者、日期、URL、全文核心内容。
      
      ## 阶段 2: AI 处理与翻译
      - 将所有英文内容翻译为流畅、专业的中文。
      - **YouTube**: 为每条视频提供 3 条核心洞察（编号列表）。
      - **X/Twitter**: 为每条推文提供简短总结，并附带一段整体舆情分析（识别 2-3 个主要叙事趋势）。
      - **TechCrunch**: 为每篇文章提供作者、日期和少于 100 字的深度摘要。
      
      ## 阶段 3: 生成报告
      输出格式必须严格遵守以下 Markdown 模板：
      
      # 抄手的AI日报 - ${date}
      
      ---
      
      ## 📺 YouTube 热门 AI 视频
      (列出 5 个视频，包含标题、链接、频道名和 3 条核心洞察)
      
      ## 🐦 X/Twitter AI 热门讨论
      (列出 10 条讨论，包含作者、总结、链接)
      ### 📊 舆情趋势分析
      (一段总结，识别 2-3 个主要讨论趋势)
      
      ## 📰 TechCrunch 深度 AI 报道
      (列出 10 篇文章，包含标题、作者、日期、链接和深度摘要)
      
      # 注意事项
      - 确保信息是真实且最新的。
      - 翻译要准确，符合中文表达习惯。
      - 链接必须准确有效。
      - 如果某些来源不足，请尝试搜集更多相关 AI 专家的动态。
    `;

    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text || "生成报告失败，请重试。";
  }
}
