import { mkdir, readdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { guideSteps } from "../../lib/client/guideSteps";

const assetDir = path.join(process.cwd(), "docs", "assets", "playwright");

const pages = [
  { name: "overview", route: "/", marker: "總覽" },
  { name: "journey", route: "/journey", marker: "資料如何從原始行程變成可解釋洞察" },
  { name: "demand", route: "/demand", marker: "需求分析" },
  { name: "zones-routes", route: "/zones-routes", marker: "區域與路線" },
  { name: "zone-map", route: "/map?zoneId=4", marker: "區域地圖" },
  { name: "airports", route: "/airports", marker: "機場分析" },
  { name: "segments", route: "/segments", marker: "區隔比較" },
  { name: "anomalies", route: "/anomalies", marker: "異常調查" },
  { name: "data-quality", route: "/data-quality", marker: "資料品質" },
  { name: "warehouse", route: "/warehouse", marker: "資料倉儲" },
  { name: "scenario", route: "/scenario", marker: "情境模擬器" },
  { name: "saved-views", route: "/saved-views", marker: "保存視圖" },
  { name: "fares-tips", route: "/fares-tips", marker: "車資與小費" },
  { name: "trips", route: "/trips", marker: "行程明細" },
  { name: "forecast", route: "/forecast", marker: "預測實驗室" },
  { name: "zone-drilldown", route: "/zones/4", marker: "區域 KPI" },
  { name: "route-drilldown", route: "/routes/drilldown", marker: "選取路線" },
];

test.use({ video: "on" });

test.beforeAll(async () => {
  await mkdir(assetDir, { recursive: true });
  const files = await readdir(assetDir).catch(() => []);
  await Promise.all(files.filter((file) => file.endsWith(".png") || file.endsWith(".webm")).map((file) => rm(path.join(assetDir, file), { force: true })));
});

test("capture guided bilingual analytics demo", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText("總覽").first()).toBeVisible();
  await expect(page.getByText("先看整體 KPI")).toBeVisible();

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByText("Start with the KPI layer")).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("先看整體 KPI")).toBeVisible();

  await captureGuide(page);
  await captureUploadJourney(page);
  await capturePages(page);

  const video = page.video();
  await page.close();
  const videoPath = await video?.path();
  if (videoPath) {
    const target = path.join(assetDir, "demo-tour.webm");
    await copyFile(videoPath, target);
    await testInfo.attach("demo-tour", { path: target, contentType: "video/webm" });
  }
});

async function captureGuide(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText("先看整體 KPI")).toBeVisible();

  for (let index = 0; index < guideSteps.length; index += 1) {
    const step = guideSteps[index];
    await expect(page.getByText(step.titleZh)).toBeVisible({ timeout: 12_000 });
    await expect(page.locator(`[data-tour-id="${step.targetId}"]`).first()).toBeVisible({ timeout: 12_000 });
    await page.screenshot({ path: path.join(assetDir, `guide-step-${String(index + 1).padStart(2, "0")}-${step.id}.png`) });
    if (index < guideSteps.length - 1) {
      await page.getByRole("button", { name: /下一步/ }).click();
      await page.waitForTimeout(900);
    }
  }
}

async function captureUploadJourney(page: import("@playwright/test").Page) {
  await page.goto("/journey", { waitUntil: "networkidle" });
  await closeGuideIfActive(page);
  await page.getByRole("button", { name: "Forecast" }).click();
  await expect(page.getByText("建立可解釋的需求預測 baseline")).toBeVisible();
  await page.screenshot({ path: path.join(assetDir, "journey-forecast-tab.png") });

  await page.setInputFiles("input[type='file']", {
    name: "taxi-demo.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "tpep_pickup_datetime,tpep_dropoff_datetime,passenger_count,trip_distance,PULocationID,DOLocationID,fare_amount,tip_amount,total_amount,payment_type\n" +
        "2024-01-01 10:00:00,2024-01-01 10:20:00,1,3.2,4,5,18.5,3.0,24.0,card\n" +
        "2024-01-01 11:00:00,2024-01-01 11:15:00,2,2.1,5,4,12.0,2.0,16.0,cash\n",
    ),
  });
  await expect(page.getByText("taxi-demo.csv")).toBeVisible();
  await expect(page.getByText(/Rows: 2 valid/)).toBeVisible();
  await page.screenshot({ path: path.join(assetDir, "journey-upload-report.png") });

  const datasetId = new URL(page.url()).searchParams.get("datasetId");
  expect(datasetId).toBeTruthy();
  await page.goto(`/?datasetId=${datasetId}`, { waitUntil: "networkidle" });
  await closeGuideIfActive(page);
  await expect(page.getByText("總覽").first()).toBeVisible();
  await page.screenshot({ path: path.join(assetDir, "uploaded-dataset-overview.png") });
}

async function capturePages(page: import("@playwright/test").Page) {
  for (const item of pages) {
    await page.goto(item.route, { waitUntil: "networkidle" });
    await closeGuideIfActive(page);
    await expect(page.getByText(item.marker).first()).toBeVisible({ timeout: 12_000 });
    await captureViewportSlices(page, item.name);
  }
}

async function captureViewportSlices(page: import("@playwright/test").Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  const dimensions = await page.evaluate(() => ({ height: window.innerHeight, scrollHeight: document.documentElement.scrollHeight }));
  const maxSlices = Math.min(6, Math.ceil(dimensions.scrollHeight / dimensions.height));
  for (let index = 0; index < maxSlices; index += 1) {
    await page.evaluate((top) => window.scrollTo(0, top), index * dimensions.height);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(assetDir, `${name}-${String(index + 1).padStart(2, "0")}.png`) });
  }
}

async function closeGuideIfActive(page: import("@playwright/test").Page) {
  const close = page.getByRole("button", { name: "Close guide" });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await page.waitForTimeout(200);
  }
}
