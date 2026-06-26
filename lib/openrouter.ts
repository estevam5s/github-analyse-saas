/**
 * Camada de IA (OpenRouter). aiChat genérico + helpers especializados para
 * code review, README, análise de arquitetura, vulnerabilidades, score de
 * qualidade e mensagens de commit. Tudo com timeout e fallback gracioso.
 */
const OR_KEY = process.env.OPENROUTER_API_KEY!;
const OR_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://github-analyse-saas.vercel.app";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GitAnalytica";

export async function aiChat(
  system: string,
  user: string,
  opts: { maxTokens?: number; temperature?: number; timeoutMs?: number } = {},
): Promise<string> {
  if (!OR_KEY) return "IA não configurada (defina OPENROUTER_API_KEY).";
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OR_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": APP_NAME,
      },
      body: JSON.stringify({
        model: OR_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: opts.maxTokens ?? 1200,
        temperature: opts.temperature ?? 0.5,
      }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 30000),
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content?.trim() ?? "Análise não disponível.";
  } catch {
    return "Análise não disponível no momento.";
  }
}

/** Tenta extrair um JSON do texto do modelo. */
export function parseJsonLoose<T = any>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

const PT = "Responda SEMPRE em português do Brasil, de forma técnica, objetiva e acionável.";

export const AI = {
  /** Resumo executivo de um repositório. */
  repoOverview(ctx: { name: string; description?: string | null; language?: string | null; topics?: string[]; readme?: string | null }) {
    return aiChat(
      `Você é um Staff Engineer revisando um repositório. ${PT} Use no máximo 6 bullets com marcador "[+]".`,
      `Repositório: ${ctx.name}\nLinguagem: ${ctx.language ?? "?"}\nTópicos: ${(ctx.topics ?? []).join(", ")}\nDescrição: ${ctx.description ?? "—"}\n\nREADME (trecho):\n${(ctx.readme ?? "").slice(0, 4000)}\n\nGere um resumo executivo: propósito, stack, pontos fortes e riscos.`,
      { maxTokens: 700 },
    );
  },

  /** Code review de um diff/arquivo. */
  codeReview(input: { filename: string; code: string }) {
    return aiChat(
      `Você é um revisor de código sênior. ${PT} Aponte bugs, riscos de segurança, code smells e melhorias. Use seções: Resumo, Problemas (com severidade alta/média/baixa) e Sugestões.`,
      `Arquivo: ${input.filename}\n\n\`\`\`\n${input.code.slice(0, 9000)}\n\`\`\``,
      { maxTokens: 1400 },
    );
  },

  /** Gera um README profissional. */
  readme(ctx: { name: string; description?: string | null; language?: string | null; structure?: string }) {
    return aiChat(
      `Você gera READMEs profissionais em Markdown. ${PT} Inclua: título, badges placeholder, descrição, recursos, instalação, uso, estrutura, contribuição e licença.`,
      `Projeto: ${ctx.name}\nLinguagem: ${ctx.language ?? "?"}\nDescrição: ${ctx.description ?? "—"}\nEstrutura:\n${ctx.structure ?? ""}`,
      { maxTokens: 1600 },
    );
  },

  /** Análise de arquitetura. */
  architecture(ctx: { name: string; tree: string }) {
    return aiChat(
      `Você é um arquiteto de software. ${PT} Avalie a arquitetura, padrões, acoplamento e proponha melhorias estruturais.`,
      `Projeto: ${ctx.name}\nÁrvore de arquivos:\n${ctx.tree.slice(0, 6000)}`,
      { maxTokens: 1200 },
    );
  },

  /** Varredura de vulnerabilidades (heurística por IA). */
  vulnScan(input: { filename: string; code: string }) {
    return aiChat(
      `Você é um especialista em AppSec. ${PT} Liste vulnerabilidades potenciais (OWASP), severidade e correção. Se não houver, diga explicitamente.`,
      `Arquivo: ${input.filename}\n\n\`\`\`\n${input.code.slice(0, 9000)}\n\`\`\``,
      { maxTokens: 1200 },
    );
  },

  /** Score de qualidade 0-100 em JSON. */
  async qualityScore(ctx: { name: string; signals: Record<string, unknown> }) {
    const text = await aiChat(
      `Você avalia qualidade de repositórios. ${PT} Responda APENAS um JSON: {"score":0-100,"grade":"A+|A|B|C|D","strengths":[],"risks":[],"summary":""}.`,
      `Repositório: ${ctx.name}\nSinais:\n${JSON.stringify(ctx.signals, null, 2)}`,
      { maxTokens: 700, temperature: 0.3 },
    );
    return (
      parseJsonLoose<{ score: number; grade: string; strengths: string[]; risks: string[]; summary: string }>(text) ?? {
        score: 0,
        grade: "—",
        strengths: [],
        risks: [],
        summary: text,
      }
    );
  },

  /** Mensagem de commit (Conventional Commits) a partir de um resumo de mudanças. */
  commitMessage(changes: string) {
    return aiChat(
      `Você escreve mensagens de commit no padrão Conventional Commits. ${PT} Responda apenas a mensagem (título + corpo curto).`,
      `Mudanças:\n${changes.slice(0, 4000)}`,
      { maxTokens: 300, temperature: 0.3 },
    );
  },
};
