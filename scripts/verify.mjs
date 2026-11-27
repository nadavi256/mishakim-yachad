import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:4173/mishakim-yachad/";
const out = "/opt/cursor/artifacts";
await mkdir(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
page.on("pageerror", (err) => console.error("PAGEERROR", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.error("CONSOLE", msg.text());
});

async function go(hash) {
  await page.goto(`${base}#${hash}`, { waitUntil: "networkidle0" });
  await page.waitForSelector("[data-screen]");
}

async function shot(name) {
  await page.evaluate(() => {
    const scroller = document.querySelector("[data-scroll]");
    if (scroller) scroller.scrollTop = 0;
  });
  await page.screenshot({ path: `${out}/${name}.png` });
}

await page.goto(base, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });

await go("/");
await shot("01-home");
const homeText = await page.$eval("[data-screen=home]", (el) => el.innerText);
if (!homeText.includes("היי לירון")) throw new Error("missing greeting");
if (!homeText.includes("כדורגל בערב") || !homeText.includes("כדורסל בפארק") || !homeText.includes("טניס למתחילים")) {
  throw new Error("home feed missing cards: " + homeText.slice(0, 400));
}

await go("/discover");
await shot("02-discovery");
const discover = await page.$eval("[data-screen=discover]", (el) => el.innerText);
if (!discover.includes("דניאל לוי") || !discover.includes("יוסי כהן") || !discover.includes("מאיה ישראלי")) {
  throw new Error("discovery people missing");
}
await page.click("[role=tab]:nth-of-type(3)");
await page.waitForFunction(() => document.body.innerText.includes("בקרוב"));

await go("/my");
await shot("03-my-activities");
const myText = await page.$eval("[data-screen=my]", (el) => el.innerText);
if (!myText.includes("הצטרפותך אושרה") || !myText.includes("דניאל") && !myText.includes("בהובלת")) {
  throw new Error("my activities missing joined cards");
}
if (!myText.includes("2")) throw new Error("invitation badge missing");

await go("/profile");
await shot("04-profile");
const published = await page.$eval("[data-testid=published-by-me]", (el) => ({
  text: el.innerText,
  owners: [...el.querySelectorAll("[data-owner]")].map((n) => n.getAttribute("data-owner")),
}));
if (published.owners.some((id) => id !== "u-liron")) throw new Error("published list has a foreign owner " + published.owners);
if (published.text.includes("דניאל")) throw new Error("Daniel appears in published activities");
if (!published.text.includes("כדורגל בערב")) throw new Error("Liron soccer missing from published");

await go("/activity/a-basket");
await shot("05-activity-details");
const details = await page.$eval("[data-screen=activity]", (el) => el.innerText);
if (!details.includes("דניאל לוי") || !details.includes("23 נרשמו") || !details.includes("ללא הגבלת משתתפים")) {
  throw new Error("details mismatch: " + details.slice(0, 500));
}
const chatOnBasket = await page.$("[data-testid=chat-entry]");
if (!chatOnBasket) throw new Error("approved participant should see chat");

await go("/activity/a-yoga");
const chatOnYoga = await page.$("[data-testid=chat-entry]");
if (chatOnYoga) throw new Error("invitation without approval must not show chat");
const yogaText = await page.$eval("[data-screen=activity]", (el) => el.innerText);
if (yogaText.match(/05\d[-\s]?\d{7}/)) throw new Error("phone number visible");

await go("/publish/1");
await page.waitForSelector("textarea");
await page.click("textarea");
await page.keyboard.type("משחק חברתי, כולם מוזמנים. מביאים מים ובאים לשחק!");
await shot("06-create-step-1");

await page.click("button.btn.primary.xl");
await page.waitForSelector("[data-screen=publish-2]");
await page.click(".search input");
await page.keyboard.type("מגרש הספורט");
await page.waitForSelector(".suggest button");
await page.evaluate(() => {
  const button = [...document.querySelectorAll(".suggest button")].find((node) => node.textContent.includes("מגרש הספורט בפארק"));
  button?.click();
});
await page.click("textarea");
await page.keyboard.type("נפגשים בכניסה המזרחית, ליד השער הכחול");
await shot("07-create-step-2");
await page.click("button.btn.primary");
await page.waitForSelector("[data-screen=publish-3]");
await shot("08-create-step-3");
const before = await page.evaluate(() => document.body.innerText.includes("כדורסל בפארק"));
if (!before) throw new Error("review card missing title");
await page.click("button.btn.primary");
await page.waitForFunction(() => location.hash.includes("/activity/a-"));
await page.waitForFunction(() => document.body.innerText.includes("הפעילות פורסמה"));
const publishedUrl = page.url();

await go("/profile");
const after = await page.$eval("[data-testid=published-by-me]", (el) => el.innerText);
if (!after.includes("כדורסל בפארק")) throw new Error("published activity missing on profile");
if (after.includes("דניאל")) throw new Error("Daniel still on profile after publish");

await go("/my");
await page.click(".tabs button:nth-of-type(2)");
await page.waitForFunction(() => document.body.innerText.includes("כדורסל בפארק"));

const phoneLeak = await page.evaluate(() => /05\d[-\s]?\d{3}[-\s]?\d{4}/.test(document.body.innerText));
if (phoneLeak) throw new Error("phone-like number in the UI");

console.log("OK", publishedUrl);
await browser.close();
