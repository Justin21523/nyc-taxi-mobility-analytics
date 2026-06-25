import { expect, test } from "@playwright/test";

test("floating guide, language toggle, and real upload journey work", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByText("總覽").first()).toBeVisible();

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByText("Overview").first()).toBeVisible();
  await expect(page.getByText("Start with the KPI layer")).toBeVisible();
  await page.getByRole("button", { name: "中文" }).click();
  await expect(page.getByText("總覽").first()).toBeVisible();
  await expect(page.getByText("先看整體 KPI")).toBeVisible();

  await page.getByRole("button", { name: /下一步/ }).click();
  await expect(page.getByText("讀懂自動洞察")).toBeVisible();

  for (let i = 0; i < 3; i += 1) {
    await page.getByRole("button", { name: /下一步/ }).click();
  }
  await page.waitForURL("**/journey");
  await expect(page.getByText("選擇資料來源")).toBeVisible();

  await page.getByRole("button", { name: "Forecast" }).click();
  await expect(page.getByText("建立可解釋的需求預測 baseline")).toBeVisible();

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

  const datasetId = new URL(page.url()).searchParams.get("datasetId");
  expect(datasetId).toBeTruthy();
  await page.goto(`/?datasetId=${datasetId}`, { waitUntil: "networkidle" });
  await expect(page.getByText("總覽").first()).toBeVisible();
});
