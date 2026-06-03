import { generateLabels as mockLabels, generateSpecimenName as mockName } from '../utils/mockAI';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const USE_CLAUDE = !!API_KEY;

async function callClaude(systemPrompt, userContent) {
  // Claude API cannot be called directly from browser due to CORS.
  // Use a proxy or server-side route in production.
  // For now, we import the SDK via a dynamic shim if available.
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  return message.content[0].text;
}

const LABEL_SYSTEM = `ユーザーが入力した「不思議な出来事」を受け取り、それを観察するための「観察ラベル」を5〜6個生成してください。

重要なルール：
- 「認知」「構造」「時間」のような抽象的な哲学用語は禁止
- 現象を半歩だけ言語化した言葉にする
- 「自分だけ続いている」「誰も知らない」「置き場所がない」のようなその不思議に固有の言葉を作ること
- 診断ではなく、観察のレンズ
- ユーザーが「これは違う」と捨てられる程度の解像度

JSON形式で返す：{"labels":["l1","l2","l3","l4","l5"]}`;

const NAME_SYSTEM = `ユーザーが入力した不思議と、選択した観察ラベルを受け取り、標本名（タイトル）を1つ生成してください。

重要なルール：
- 哲学用語・論文タイトル・抽象概念は禁止（❌認知的不一致、時間的自己分離）
- 「余計な一言」であること（✅恥ずかしさはどこにいくの、✅昨日の自分からの置き配）
- 出来事の中にある妙な部分を指差す
- 説明ではなく観察、解釈ではなく発見
- 15〜25文字程度

テキストのみ返す。`;

export function useAI() {
  async function generateLabels(text) {
    if (!USE_CLAUDE) {
      await new Promise((r) => setTimeout(r, 1200));
      return mockLabels(text);
    }
    try {
      const raw = await callClaude(LABEL_SYSTEM, text);
      const parsed = JSON.parse(raw);
      return parsed.labels ?? mockLabels(text);
    } catch {
      return mockLabels(text);
    }
  }

  async function generateSpecimenName(text, labels) {
    if (!USE_CLAUDE) {
      await new Promise((r) => setTimeout(r, 900));
      return mockName(text, labels);
    }
    try {
      const userContent = `不思議：${text}\n\n選択したラベル：${labels.join('、')}`;
      const raw = await callClaude(NAME_SYSTEM, userContent);
      return raw.trim();
    } catch {
      return mockName(text, labels);
    }
  }

  return { generateLabels, generateSpecimenName };
}
