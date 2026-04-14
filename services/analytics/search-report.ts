import { generateSearchQualityReport } from "./lib/search-quality-report";

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

const report = generateSearchQualityReport(new Date());

console.log("AIRS Search Quality Report");
console.log(`- Generated at: ${report.model.generatedAt}`);
console.log(`- Total searches: ${report.model.totalSearches}`);
console.log(`- Unique queries: ${report.model.uniqueQueryCount}`);
console.log(`- First-search hit rate: ${formatPercent(report.model.firstSearchHitRate)}`);
console.log(`- Zero-result rate: ${formatPercent(report.model.zeroResultRate)}`);
console.log(`- Feedback count: ${report.model.feedbackCount}`);
console.log(`- JSON: ${report.latestJsonPath}`);
