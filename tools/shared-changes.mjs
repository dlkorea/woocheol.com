// 기준 커밋 대비 공용 영역(AGENTS.md 참고)을 건드린 파일을 출력한다. 없으면 아무것도 출력하지 않는다.
// 사용법: node tools/shared-changes.mjs <base-ref>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = process.argv[2];
if (!base) {
  console.error("사용법: node tools/shared-changes.mjs <base-ref>");
  process.exit(2);
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const appPaths = JSON.parse(readFileSync("tools/apps.json", "utf8")).apps.map((a) => a.path.replace(/^\//, ""));
const changed = git("diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean);

const shared = changed.filter((file) => {
  if (appPaths.some((p) => file.startsWith(p))) return false;
  if (file === "sitemap.xml") return false;
  if (file === "index.html") return withoutAppBlocks(showAt(`${base}`, file)) !== withoutAppBlocks(readFileSync(file, "utf8"));
  return true;
});

for (const file of shared) console.log(file);

function showAt(ref, file) {
  const mergeBase = git("merge-base", ref, "HEAD").trim();
  try {
    return git("show", `${mergeBase}:${file}`);
  } catch {
    return "";
  }
}

// 앱 담당이 고칠 수 있는 부분(앱 카드, MobileApplication JSON-LD)을 지우고 나머지만 비교한다.
function withoutAppBlocks(html) {
  return html
    .replace(/<div class="card" data-app="[^"]*">[\s\S]*?<\/div>\s*/g, "")
    .replace(/<script type="application\/ld\+json">(?:(?!<\/script>)[\s\S])*?"MobileApplication"[\s\S]*?<\/script>\s*/g, "")
    .replace(/\r\n/g, "\n");
}
