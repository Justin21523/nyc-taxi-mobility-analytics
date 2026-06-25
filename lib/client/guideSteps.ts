export type GuideCategory = "source" | "trust" | "analysis" | "geo" | "revenue" | "forecast" | "reporting";

export type GuideStep = {
  id: string;
  route: string;
  targetId: string;
  category: GuideCategory;
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
  technicalTerm: string;
  actionLabelZh: string;
  actionLabelEn: string;
};

export const guideSteps: GuideStep[] = [
  step("overview-kpis", "/", "overview-kpis", "source", "先看整體 KPI", "Start with the KPI layer", "KPI 把 trip count、revenue、fare、distance、airport share 壓成面試官能快速理解的營運基準。", "KPIs compress trip count, revenue, fare, distance, and airport share into a quick operating baseline.", "KPI Summary", "建立分析基準", "Build the baseline"),
  step("overview-insights", "/", "overview-insights", "source", "讀懂自動洞察", "Read the auto-generated insights", "這裡把結果轉成 observation、why it matters、next step，讓非資料背景的人也能理解下一步。", "This turns charts into observation, why it matters, and next step so non-data users know what to inspect next.", "Rule-based Insights", "理解數字背後的意思", "Interpret the result"),
  step("overview-daily", "/", "overview-daily", "analysis", "看每日需求與收入", "Inspect daily demand and revenue", "先確認時間趨勢是否穩定，再進入更細的 demand、route、zone 分析。", "First check whether the trend is stable before drilling into demand, routes, and zones.", "Daily Revenue", "檢查整體趨勢", "Check the trend"),
  step("overview-zones", "/", "overview-zones", "geo", "找出核心 pickup zones", "Find core pickup zones", "Top zones 能快速指出需求集中在哪些城市節點。", "Top zones quickly show where mobility demand concentrates.", "Zone Ranking", "定位需求熱點", "Locate demand hotspots"),
  step("journey-upload", "/journey", "journey-upload", "source", "選擇資料來源", "Choose a data source", "可以上傳 CSV / Parquet；沒有上傳時使用 sample data，兩者都會走同一段 Journey 說明。", "Upload CSV / Parquet or fall back to sample data; both paths are explained through the same journey.", "Upload Pipeline", "上傳或使用 sample", "Upload or use sample"),
  step("journey-tabs", "/journey", "journey-tabs", "source", "跟著資料走 pipeline", "Follow the data through the pipeline", "這裡用 tabs 與動畫展示 raw data、cleaning、quality gate、warehouse、analytics、forecast、insights。", "Tabs and animation show raw data, cleaning, quality gate, warehouse, analytics, forecast, and insights.", "Pipeline Journey", "觀看資料旅程", "Watch the data journey"),
  step("journey-report", "/journey", "journey-report", "trust", "查看 upload report", "Review the upload report", "上傳後會看到 row count、valid rows、invalid rows、date range、schema status。", "After upload, inspect row count, valid rows, invalid rows, date range, and schema status.", "Upload Report", "確認資料處理結果", "Confirm processing output"),
  step("dq-status", "/data-quality", "dq-status", "trust", "確認資料是否可信", "Verify data trust", "Data Quality 是分析平台的地基，用來確認 freshness、schema 與 failed checks。", "Data Quality is the platform foundation for freshness, schema, and failed checks.", "Data Quality Checks", "檢查資料健康度", "Check data health"),
  step("dq-checks", "/data-quality", "dq-checks", "trust", "檢查 DQ 明細", "Inspect DQ details", "DQ checks 讓使用者知道問題發生在哪，而不是只看到一個分數。", "DQ checks show where problems occur instead of only showing a score.", "Quality Report", "查看品質明細", "Inspect quality details"),
  step("warehouse-partitions", "/warehouse", "warehouse-partitions", "trust", "檢查 Parquet partitions", "Inspect Parquet partitions", "Partition rows 與 file size 證明資料工程流程可重現。", "Partition rows and file size prove the data engineering flow is reproducible.", "Partitioned Parquet", "查看分區", "Review partitions"),
  step("warehouse-latency", "/warehouse", "warehouse-latency", "trust", "看查詢效能", "Check query latency", "Latency benchmark 顯示哪些查詢未來需要 caching 或 pre-aggregation。", "Latency benchmark highlights candidates for caching or pre-aggregation.", "DuckDB Benchmark", "評估查詢成本", "Assess query cost"),
  step("demand-timeseries", "/demand", "demand-timeseries", "analysis", "觀察 hourly demand", "Inspect hourly demand", "Hourly demand 把 trip records 變成 time-series pattern。", "Hourly demand turns trip records into a time-series pattern.", "Time-series Demand", "查看需求走勢", "Inspect demand trend"),
  step("demand-heatmap", "/demand", "demand-heatmap", "analysis", "理解 weekday/hour seasonality", "Understand weekday/hour seasonality", "Heatmap 顯示需求在星期與小時上的規律，避免把例行尖峰誤判成異常。", "The heatmap shows weekday/hour seasonality so routine peaks are not mistaken for anomalies.", "Seasonality", "找出週期模式", "Find recurring patterns"),
  step("anomaly-table", "/anomalies", "anomaly-table", "analysis", "調查異常小時", "Investigate anomaly hours", "Anomaly table 把 abnormal demand 轉成可排序的調查清單。", "The anomaly table turns abnormal demand into a prioritized investigation list.", "Anomaly Investigation", "排序調查優先級", "Prioritize investigation"),
  step("anomaly-detail", "/anomalies", "anomaly-detail", "analysis", "追查受影響區域與路線", "Trace affected zones and routes", "點進 anomaly 後要看 affected zones/routes，才能知道異常從哪裡來。", "After selecting an anomaly, affected zones/routes explain where the issue comes from.", "Root Cause", "找出異常來源", "Find the source"),
  step("zones-ranking", "/zones-routes", "zones-ranking", "geo", "比較 pickup/dropoff ranking", "Compare pickup/dropoff rankings", "上車與下車排名不一定對稱，能揭示城市流動方向。", "Pickup and dropoff rankings are often asymmetric and reveal movement direction.", "Zone Ranking", "比較需求不對稱", "Compare asymmetry"),
  step("route-matrix", "/zones-routes", "route-matrix", "geo", "看 OD matrix 與 route mix", "Inspect OD matrix and route mix", "OD matrix 把城市移動從單點變成成對流向。", "The OD matrix turns single locations into origin-destination flows.", "OD Matrix", "理解城市流向", "Understand flows"),
  step("zone-map", "/map?zoneId=4", "zone-map", "geo", "把需求放到地圖上", "Put demand on the map", "Zone Map 把 trip records 轉成地理節點與流向。", "Zone Map turns trip records into geographic nodes and flows.", "Geospatial Analytics", "探索區域流向", "Explore spatial flow"),
  step("zone-network", "/map?zoneId=4", "zone-network", "geo", "看 selected zone network", "Inspect the selected zone network", "選取 zone 後可以看到 inbound、outbound 與主要連結節點。", "Selecting a zone reveals inbound, outbound, and connected nodes.", "Node Network", "理解節點角色", "Understand node role"),
  step("airport-summary", "/airports", "airport-summary", "geo", "分析機場行程", "Analyze airport trips", "機場行程通常在 fare、distance、route mix 上和一般行程不同。", "Airport trips often differ in fare, distance, and route mix.", "Airport Analytics", "比較機場行程", "Compare airport trips"),
  step("airport-routes", "/airports", "airport-routes", "geo", "找機場熱門路線", "Find top airport routes", "Top airport routes 可以解釋機場需求是由哪些 corridor 推動。", "Top airport routes explain which corridors drive airport demand.", "Airport Routes", "定位機場 corridor", "Locate airport corridors"),
  step("segments-lift", "/segments", "segments-lift", "analysis", "比較兩個 segment", "Compare two segments", "Segment lift 把 airport vs non-airport、peak vs off-peak 等比較變成決策訊號。", "Segment lift turns comparisons such as airport vs non-airport into decision signals.", "Segment Lift", "量化差異", "Quantify differences"),
  step("segments-mix", "/segments", "segments-mix", "analysis", "看 route mix 差異", "Inspect route mix differences", "不同 route mix 通常能解釋 fare、distance、tip 的差異。", "Different route mixes often explain fare, distance, and tip differences.", "Route Mix", "找出差異來源", "Find drivers"),
  step("fares-scatter", "/fares-tips", "fares-scatter", "revenue", "理解 fare 與 distance", "Understand fare and distance", "Fare scatter 讓使用者看到高價行程是否只是距離較長，或存在異常高價。", "Fare scatter shows whether high fares are distance-driven or unusually expensive.", "Fare Distribution", "解釋車資分布", "Explain fare distribution"),
  step("tips-payment", "/fares-tips", "tips-payment", "revenue", "分析小費與付款方式", "Analyze tips and payment behavior", "Tip behavior 是客群與付款型態的行為訊號。", "Tip behavior is a signal for customer and payment behavior.", "Tip Behavior", "理解小費結構", "Understand tip mix"),
  step("trips-table", "/trips", "trips-table", "analysis", "回到 trip-level 明細", "Return to trip-level records", "Trip Explorer 用明細資料驗證彙總圖表是否合理。", "Trip Explorer validates aggregate charts with row-level samples.", "Trip Explorer", "驗證彙總結果", "Validate aggregates"),
  step("scenario-impact", "/scenario", "scenario-impact", "analysis", "模擬 business scenario", "Simulate a business scenario", "Scenario Simulator 把 demand/tip/fare 假設轉成 revenue impact。", "Scenario Simulator converts demand, tip, and fare assumptions into revenue impact.", "Scenario Simulation", "估算情境影響", "Estimate scenario impact"),
  step("forecast-evaluation", "/forecast", "forecast-evaluation", "forecast", "比較 forecast baseline", "Compare forecast baselines", "Forecast 先比較 naive、moving average、seasonal naive，再用 MAE/RMSE/MAPE 評估。", "Forecast compares naive, moving average, and seasonal naive with MAE/RMSE/MAPE.", "Model Evaluation", "檢查 baseline 表現", "Evaluate baselines"),
  step("forecast-chart", "/forecast", "forecast-chart", "forecast", "看 actual vs baseline", "Inspect actual vs baseline", "線圖讓使用者看到模型是跟上趨勢，還是只是平滑掉波動。", "The line chart shows whether the baseline follows the trend or only smooths volatility.", "Forecast Visualization", "解釋預測曲線", "Explain forecast curves"),
  step("saved-views", "/saved-views", "saved-views", "reporting", "保存與分享分析狀態", "Save and share analysis state", "Saved Views 讓 filters 與 demo 狀態可重現，面試時可快速跳到重點。", "Saved Views make filters and demo states reproducible for interviews.", "Saved Views", "保存展示路徑", "Save demo state"),
  step("route-drilldown", "/routes/drilldown", "route-drilldown", "geo", "深入單一路線", "Drill into a route", "Route Drilldown 讓使用者從 route ranking 進到 hourly demand、fare distribution、sample trips。", "Route Drilldown moves from route ranking into hourly demand, fare distribution, and sample trips.", "Route Drilldown", "追查路線細節", "Inspect route details"),
  step("zone-drilldown", "/zones/4", "zone-drilldown", "geo", "深入單一區域", "Drill into a zone", "Zone Drilldown 顯示 inbound/outbound、top origins/destinations 與 sample trips。", "Zone Drilldown shows inbound/outbound, top origins/destinations, and sample trips.", "Zone Drilldown", "追查區域網絡", "Inspect zone network"),
];

function step(
  id: string,
  route: string,
  targetId: string,
  category: GuideCategory,
  titleZh: string,
  titleEn: string,
  bodyZh: string,
  bodyEn: string,
  technicalTerm: string,
  actionLabelZh: string,
  actionLabelEn: string,
): GuideStep {
  return { id, route, targetId, category, titleZh, titleEn, bodyZh, bodyEn, technicalTerm, actionLabelZh, actionLabelEn };
}
