import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getStockIntelligence(stocks: string[]) {
  if (stocks.length === 0) return null;

  const stockList = stocks.join(", ");
  
  const today = new Date().toLocaleDateString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit' 
  });
  const todayISO = new Date().toISOString().split('T')[0];

  const timeAnchor = `
    今天是 ${today}（${todayISO}）。
    检索优先级与范围要求：
    1. 优先抓取【过去 24 小时内】的国内外重大资讯（个股公告、板块动向）。
    2. 若 24 小时内无重大资讯，自动扩大检索范围至【过去 3 天内】。
    3. 若 3 天内仍无重大资讯，最后扩大至【过去 5 天内】。
    4. 搜索必须覆盖【国际新闻】和【国内新闻】（涉及全球产业链、宏观政策等影响股价的事件）。
    5. 只有当过去 5 天内确实没有相关重大资讯时，才输出："【今日暂无重大资讯】"。
    6. 对于每一条信息，请务必标注新闻发生的【具体日期】。
  `;

  // Step 1: Deep Intelligence Extraction (Focused on real-time news headlines, sector impact, and fallback logic)
  const intelligencePrompt = `
    ${timeAnchor}
    
    请抓取分析以下股票代码的【最新实时新闻、公告及其所属板块全球重大动向】: ${stockList}。
    
    抓取要求：
    1. 信源偏好：财联社、东方财富、华尔街见闻、路透社(Reuters)、CNBC（针对国际动向）。
    2. 核心任务：
       - 个股公告及突发事件。
       - 所属行业/板块的全球范围重大动态（如政策、巨头财报、技术突破）。
       - 必须明确区分并包含国内外视角。
    3. 严格遵守上述【24h -> 3d -> 5d】的阶梯式时间检索逻辑。
    4. 输出：个股及板块的最具体新闻标题和内容，并注明新闻日期。
  `;

  const intelligenceResponse = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: intelligencePrompt,
    tools: [{ googleSearch: {} }],
  } as any);

  const rawIntelligence = intelligenceResponse.text;

  // Step 2: Expert Review Report (News Feed Style with Sector Impact)
  const expertPrompt = `
    ${timeAnchor}
    
    你是一位资深金融市场分析师，请根据以下原始情报生成一份专业的【股票板块与个股新闻早报】。该早报将发布在公众社交平台，请确保语言专业、客观、严谨。
    
    原始情报：
    ${rawIntelligence}
    
    输出要求：
    1. 严禁使用 Markdown 符号（如 *、#）。使用纯文本。
    2. 必须包含新闻对股价影响的【逻辑研判】。
    
    结构模块（必须包含以下标记用于前端解析）：
    1. 【今日摘要】：简析今日市场最核心的机会或风险板块。
    2. 【详细复盘】：
       [ 板块热点 ]：识别个股所属板块及其今日重大新闻，并给出该新闻如何“影响股价”的逻辑点评。
       [ 个股快讯 ]：个股的具体新闻或公告。
       [ 盘前内参 ]：结合板块与个股动向，给出针对股价波动的核心操作建议。
  `;

  const expertResponse = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: expertPrompt,
  });

  return {
    summary: expertResponse.text.split("【详细复盘】")[0].replace("【今日摘要】", "").trim().replace(/[*#]/g, ''),
    details: (expertResponse.text.split("【详细复盘】")[1]?.trim() || expertResponse.text).replace(/[*#]/g, ''),
    date: new Date().toISOString(),
  };
}
