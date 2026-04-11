import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Job, DEFAULT_STAGES } from "@/lib/supabase";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function describeStages(job: Job): string {
  const stages = job.stages?.length ? job.stages : DEFAULT_STAGES;
  const parts = stages
    .map((s) => {
      if (s.state === "completed") return `${s.name}: עבר ✓`;
      if (s.state === "failed")    return `${s.name}: נכשל ✗`;
      return null;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "טרם התקדם";
}

export async function POST(req: NextRequest) {
  try {
    const { jobs }: { jobs: Job[] } = await req.json();

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: "אין מועמדויות לניתוח" },
        { status: 400 }
      );
    }

    const jobsSummary = jobs
      .map(
        (j) =>
          `- חברה: ${j.company_name}, תפקיד: ${j.role}, תאריך הגשה: ${j.date_applied}, התקדמות: ${describeStages(j)}${j.notes ? `, הערות: ${j.notes}` : ""}`
      )
      .join("\n");

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `אתה יועץ קריירה מקצועי. ניתח את המועמדויות הבאות ותן המלצות מעשיות לשיפור:

${jobsSummary}

תן ניתוח קצר וממוקד בעברית הכולל:
1. תצפיות על הדפוס הכללי
2. 3-5 המלצות ספציפיות לשיפור
3. על אילו סוגי חברות/תפקידים כדאי להתמקד

ענה בעברית בלבד. היה ספציפי ומעשי.`,
        },
      ],
    });

    const tips =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ tips });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא ידועה";
    console.error("[ai-tips]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
