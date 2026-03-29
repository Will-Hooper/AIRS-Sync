import nodemailer from "nodemailer";
import type { AnalyticsReportArtifacts } from "./types";

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function readMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    user,
    pass,
    from: process.env.SMTP_FROM?.trim() || user
  };
}

export async function sendAnalyticsReportEmail(
  report: AnalyticsReportArtifacts,
  to = "neo17571875@gmail.com"
) {
  const config = readMailConfig();
  if (!config) {
    throw new Error("SMTP_HOST / SMTP_USER / SMTP_PASS are required to send analytics emails.");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  const { model } = report;
  const deltaText =
    model.recentWindow.deltaPercent === null
      ? "缺少上一窗口数据，暂不计算变化率。"
      : `最近 3 天较前 3 天 ${model.recentWindow.delta >= 0 ? "上升" : "下降"} ${Math.abs(model.recentWindow.delta)} 次（${Math.abs(
          model.recentWindow.deltaPercent * 100
        ).toFixed(1)}%）。`;

  const html = `
    <div style="font-family:Segoe UI,PingFang SC,Microsoft YaHei,sans-serif;background:#09111a;color:#f2f6ff;padding:24px">
      <h1 style="margin:0 0 16px;font-size:28px">AIRS 三日统计报表</h1>
      <p style="margin:0 0 22px;color:rgba(242,246,255,.72)">生成时间：${model.generatedAt}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="padding:12px;border:1px solid rgba(255,255,255,.08)">总输入次数</td>
          <td style="padding:12px;border:1px solid rgba(255,255,255,.08)">${model.totalInputCount}</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid rgba(255,255,255,.08)">唯一输入词数</td>
          <td style="padding:12px;border:1px solid rgba(255,255,255,.08)">${model.uniqueQueryCount}</td>
        </tr>
        <tr>
          <td style="padding:12px;border:1px solid rgba(255,255,255,.08)">最近 3 天 / 前 3 天</td>
          <td style="padding:12px;border:1px solid rgba(255,255,255,.08)">${model.recentWindow.lastThreeDays} / ${model.recentWindow.previousThreeDays}</td>
        </tr>
      </table>
      <p style="margin:0 0 18px;color:rgba(242,246,255,.72)">${deltaText}</p>
      <h2 style="font-size:20px;margin:28px 0 12px">职业输入次数排行</h2>
      <ol style="padding-left:20px;color:rgba(242,246,255,.78)">
        ${model.topQueries.map((row) => `<li style="margin:0 0 8px">${row.label}：${row.count}</li>`).join("")}
      </ol>
      <h2 style="font-size:20px;margin:28px 0 12px">IP 国家分布</h2>
      <ol style="padding-left:20px;color:rgba(242,246,255,.78)">
        ${model.countries.map((row) => `<li style="margin:0 0 8px">${row.label}：${row.count}</li>`).join("")}
      </ol>
      <p style="margin-top:24px;color:rgba(242,246,255,.56)">完整可视化报表已作为 HTML 附件附上。</p>
    </div>
  `;

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `AIRS 三日统计报表 ${new Date(model.generatedAt).toLocaleString("zh-CN", { hour12: false })}`,
    html,
    attachments: [
      {
        filename: "airs-analytics-report.html",
        path: report.latestHtmlPath
      },
      {
        filename: "airs-analytics-report.json",
        path: report.latestJsonPath
      }
    ]
  });
}
