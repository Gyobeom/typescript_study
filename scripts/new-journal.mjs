// 오늘 날짜의 학습 일지 파일을 템플릿에서 생성한다.
// 사용법: npm run journal -- stage2 day2 [문제명]
import fs from "node:fs";
import path from "node:path";

const [stage, day, ...titleParts] = process.argv.slice(2);
if (!/^stage[1-5]$/.test(stage ?? "") || !/^day[1-5]$/.test(day ?? "")) {
  console.error("사용법: npm run journal -- stage2 day2 [문제명]");
  console.error("예:     npm run journal -- stage2 day2 ReportGenerator");
  process.exit(1);
}

const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const file = path.join("journal", `${date}-${stage}-${day}.md`);

if (fs.existsSync(file)) {
  console.log(`이미 존재합니다: ${file}`);
  process.exit(0);
}

const title = titleParts.join(" ") || "문제명";
const body = fs
  .readFileSync(path.join("journal", "_TEMPLATE.md"), "utf8")
  .replace("# YYYY-MM-DD — stageN dayM: 문제명", `# ${date} — ${stage} ${day}: ${title}`)
  .split("\n")
  .filter((line) => !line.startsWith("> 이 파일을 복사해") && !line.startsWith("> 풀이(exercises)와"))
  .join("\n");

fs.writeFileSync(file, body);
console.log(`생성됨: ${file}`);
console.log("작성 후: git add journal PROGRESS.md 와 함께 커밋하세요.");
