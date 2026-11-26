// 언어별 홈(tools/apps.json의 homes)이 한 앱 쪽으로 기울지 않았는지 검사한다. 규칙은 AGENTS.md 참고.
// 흐름: 홈마다 공용 영역 단어 → 앱 카드 틀·순서·상한 → JSON-LD를 본다. 모든 언어가 같은 카드 순서를 따르므로 언어끼리도 구성이 같다.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "tools/apps.json"), "utf8"));
const { apps } = config;
// 웹 서비스도 앱과 같은 규칙으로 센다.
const APP_TYPES = ["MobileApplication", "WebApplication"];

const errors = [];

for (const home of config.homes) {
  const html = readFileSync(join(root, home.file), "utf8");
  // 글자 수 상한만 언어별로 다를 수 있다(영어·스페인어는 같은 뜻에 글자가 더 든다). 같은 언어 안에서는 모든 앱이 같다.
  const limits = { ...config.limits, ...home.limits };
  const fail = (message) => errors.push(`[${home.file}] ${message}`);
  checkNeutralAreas(html, fail);
  checkCards(html, limits, fail);
  checkJsonLd(html, limits, fail);
}

if (errors.length) {
  console.error(`홈 공정성 검사 실패 (${errors.length}건):`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`홈 공정성 검사 통과 (앱 ${apps.length}개, 언어 ${config.homes.length}개)`);

function checkNeutralAreas(html, fail) {
  const areas = {
    "<title>": match(html, /<title>([\s\S]*?)<\/title>/),
    "meta description": metaContent(html, "name", "description"),
    "og:title": metaContent(html, "property", "og:title"),
    "og:description": metaContent(html, "property", "og:description"),
    "첫 화면(hero)": section(html, /<section class="hero">([\s\S]*?)<\/section>/),
    "회사 소개(#about)": section(html, /<section[^>]*id="about"[^>]*>([\s\S]*?)<\/section>/),
    "앱 섹션 안내 문구": match(html, /id="apps"[\s\S]*?<p class="section-lead">([\s\S]*?)<\/p>/),
  };
  for (const [area, text] of Object.entries(areas)) {
    if (text === null) {
      fail(`${area}을(를) 찾지 못했습니다`);
      continue;
    }
    for (const app of apps) {
      for (const word of [...app.names, ...app.keywords]) {
        if (text.toLowerCase().includes(word.toLowerCase())) {
          fail(`${area}에 ${app.slug} 앱의 단어 "${word}"가 있습니다. 공용 영역에는 회사 이야기만 씁니다`);
        }
      }
    }
  }
}

function checkCards(html, limits, fail) {
  const appsSection = section(html, /<section[^>]*id="apps"[^>]*>([\s\S]*?)<\/section>/);
  if (appsSection === null) return fail("#apps 섹션을 찾지 못했습니다");

  const cards = [...appsSection.matchAll(/<div class="card"([^>]*)>([\s\S]*?)<\/div>/g)].map(([, attrs, body]) => ({
    slug: attrs.match(/data-app="([^"]+)"/)?.[1] ?? null,
    body,
  }));

  const expected = apps.map((a) => a.slug);
  const actual = cards.map((c) => c.slug ?? "(data-app 없음)");
  if (expected.join(",") !== actual.join(",")) {
    fail(`앱 카드 목록·순서가 tools/apps.json과 다릅니다. 기대: [${expected.join(", ")}], 실제: [${actual.join(", ")}]`);
  }

  for (const card of cards) {
    const app = apps.find((a) => a.slug === card.slug);
    const label = `${card.slug ?? "data-app 없는"} 카드`;
    const title = text(card.body.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? "");
    const paragraphs = [...card.body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
    const description = text(paragraphs[0] ?? "");
    const links = [...card.body.matchAll(/<a\s[^>]*href="([^"]*)"/g)].map((m) => m[1]);
    const badges = (card.body.match(/class="badge"/g) ?? []).length;
    const icons = [...card.body.matchAll(/<img class="app-icon" src="([^"]*)"/g)].map((m) => m[1]);

    if (!title) fail(`${label}: <h3> 제목이 없습니다`);
    if (title.length > limits.titleChars) fail(`${label}: 제목 ${title.length}자 > 상한 ${limits.titleChars}자`);
    if (description.length > limits.descriptionChars) fail(`${label}: 소개 ${description.length}자 > 상한 ${limits.descriptionChars}자`);
    if (paragraphs.length > limits.paragraphs) fail(`${label}: 문단 ${paragraphs.length}개 > 상한 ${limits.paragraphs}개`);
    if (links.length > limits.links) fail(`${label}: 링크 ${links.length}개 > 상한 ${limits.links}개`);
    if (icons.length !== 1) fail(`${label}: 아이콘 ${icons.length}개. 카드마다 정확히 1개입니다`);
    else if (card.slug && icons[0] !== `/assets/apps/${card.slug}.png`) fail(`${label}: 아이콘은 /assets/apps/${card.slug}.png 입니다 (${icons[0]})`);
    if (badges > limits.badges) fail(`${label}: 배지 ${badges}개 > 상한 ${limits.badges}개`);

    for (const href of links) {
      const internal = href.startsWith("/") || /^https?:\/\/(www\.)?woocheol\.com(\/|$)/.test(href);
      const path = href.replace(/^https?:\/\/(www\.)?woocheol\.com/, "") || "/";
      if (internal && app && !path.startsWith(app.path)) {
        fail(`${label}: 사이트 내부 링크 ${href}가 자기 앱 경로 ${app.path} 밖을 가리킵니다`);
      }
    }
  }
}

function checkJsonLd(html, limits, fail) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const seen = new Map();
  for (const [, json] of blocks) {
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      fail("JSON-LD 블록을 JSON으로 읽지 못했습니다");
      continue;
    }
    if (!APP_TYPES.includes(data["@type"])) continue;

    const app = apps.find((a) => a.names.some((n) => (data.name ?? "").includes(n)));
    if (!app) {
      fail(`${data["@type"]} "${data.name}"이(가) tools/apps.json의 어떤 앱 이름과도 맞지 않습니다`);
      continue;
    }
    seen.set(app.slug, (seen.get(app.slug) ?? 0) + 1);
    const length = (data.description ?? "").length;
    if (length > limits.jsonLdDescriptionChars) {
      fail(`${app.slug} ${data["@type"]} 설명 ${length}자 > 상한 ${limits.jsonLdDescriptionChars}자`);
    }
  }
  for (const [slug, count] of seen) {
    if (count > 1) fail(`${slug} 앱의 MobileApplication·WebApplication JSON-LD가 ${count}개입니다. 앱마다 최대 1개입니다`);
  }
}

function match(html, pattern) {
  const m = html.match(pattern);
  return m ? text(m[1]) : null;
}

function section(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1] : null;
}

function metaContent(html, attr, value) {
  const m = html.match(new RegExp(`<meta ${attr}="${value.replace(":", "\\:")}" content="([^"]*)"`));
  return m ? m[1] : null;
}

function text(fragment) {
  return fragment.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}
