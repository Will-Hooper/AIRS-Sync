import { generateAnalyticsReport } from "./lib/report";

const report = generateAnalyticsReport();
console.log(`AIRS analytics report written: ${report.latestHtmlPath}`);
