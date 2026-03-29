import { sendAnalyticsReportEmail } from "./lib/email";
import { generateAnalyticsReport } from "./lib/report";

async function main() {
  const report = generateAnalyticsReport();
  await sendAnalyticsReportEmail(report);
  console.log(`AIRS analytics email sent with report ${report.latestHtmlPath}`);
}

void main();
