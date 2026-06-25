import type { Insight } from "@/components/Insights";

type Row = Record<string, unknown>;

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function label(value: unknown, fallback = "n/a") {
  const text = String(value ?? "");
  return text || fallback;
}

function money(value: unknown) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n(value));
}

function count(value: unknown) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n(value));
}

function insight(input: Insight): Insight {
  return { severity: "info", ...input };
}

export function overviewInsights(summary: Row, daily: Row[], pickupZones: Row[], airport: Row, fares: Row[], tips: Row[]): Insight[] {
  const topZone = pickupZones[0];
  const topBorough = fares[0];
  const topTip = tips[0];
  const firstDay = daily[0];
  const lastDay = daily[daily.length - 1];
  const tripChange = firstDay ? n(lastDay?.trip_count) - n(firstDay.trip_count) : 0;
  return [
    insight({
      titleEn: "Demand is concentrated in a few pickup nodes",
      titleZh: "需求集中在少數上車節點",
      observationEn: `${label(topZone?.zone)} leads the current pickup ranking with ${count(topZone?.trip_count)} trips.`,
      observationZh: `目前上車熱點由 ${label(topZone?.zone)} 領先，約 ${count(topZone?.trip_count)} 筆行程。`,
      whyItMattersEn: "A concentrated pickup pattern tells the operator where supply positioning matters most.",
      whyItMattersZh: "需求集中代表車隊調度與供給配置應優先看這些節點。",
      nextStepEn: "Open the Zone Map or Zone Drilldown to inspect inbound and outbound flows.",
      nextStepZh: "下一步可到 Zone Map 或 Zone Drilldown 查看進出流向。",
      href: topZone?.location_id ? `/map?zoneId=${topZone.location_id}` : "/map",
    }),
    insight({
      titleEn: "Revenue follows borough-level demand pockets",
      titleZh: "收入跟著行政區需求熱點移動",
      observationEn: `${label(topBorough?.pickup_borough)} contributes the largest pickup-borough revenue at ${money(topBorough?.total_revenue)}.`,
      observationZh: `${label(topBorough?.pickup_borough)} 是目前收入最高的上車行政區，收入約 ${money(topBorough?.total_revenue)}。`,
      whyItMattersEn: "This connects demand volume with fare value, not just trip counts.",
      whyItMattersZh: "這能把需求量與車資價值連起來，而不只是看行程數。",
      nextStepEn: "Compare route revenue to see which OD pairs create the highest value.",
      nextStepZh: "下一步比較路線收入，找出最高價值的 OD 組合。",
      href: "/zones-routes?orderBy=total_revenue&chartMetric=total_revenue",
    }),
    insight({
      titleEn: tripChange >= 0 ? "Recent demand is holding up" : "Recent demand is softer than the start",
      titleZh: tripChange >= 0 ? "近期需求維持或上升" : "近期需求低於起始日",
      observationEn: `The last visible day has ${Math.abs(tripChange)} ${tripChange >= 0 ? "more" : "fewer"} trips than the first visible day.`,
      observationZh: `目前最後一天比第一天${tripChange >= 0 ? "多" : "少"} ${Math.abs(tripChange)} 筆行程。`,
      whyItMattersEn: "The overview trend gives context before drilling into zones or segments.",
      whyItMattersZh: "總覽趨勢能先建立脈絡，再進一步看區域或客群。",
      nextStepEn: "Use the Demand page to check whether the movement comes from specific hours.",
      nextStepZh: "下一步到 Demand 頁查看是否由特定時段造成。",
      href: "/demand",
      severity: tripChange >= 0 ? "positive" : "warning",
    }),
    insight({
      titleEn: "Airport trips are a meaningful mobility segment",
      titleZh: "機場行程是重要的移動區隔",
      observationEn: `Airport-filtered trips account for ${count(airport.trip_count)} trips and ${money(airport.total_revenue)} revenue under the current filters.`,
      observationZh: `目前篩選下，機場相關行程約 ${count(airport.trip_count)} 筆，收入約 ${money(airport.total_revenue)}。`,
      whyItMattersEn: "Airport trips often behave differently in fare, distance, and route mix.",
      whyItMattersZh: "機場行程在車資、距離與路線組成上通常和一般行程不同。",
      nextStepEn: "Open Airport Analytics to compare airport demand and fare premium.",
      nextStepZh: "下一步到 Airport Analytics 比較機場需求與車資溢價。",
      href: "/airports",
    }),
    insight({
      titleEn: "Payment behavior can explain tip mix",
      titleZh: "付款方式會影響小費結構",
      observationEn: `${label(topTip?.payment_type)} is the leading payment type by total tips.`,
      observationZh: `${label(topTip?.payment_type)} 是目前小費總額最高的付款方式。`,
      whyItMattersEn: "Tip behavior is one signal for customer segment and fare quality.",
      whyItMattersZh: "小費行為可作為客群與車資品質的訊號。",
      nextStepEn: "Open Fares & Tips to inspect tip rate and fare-distance patterns.",
      nextStepZh: "下一步到 Fares & Tips 查看小費率與車資距離關係。",
      href: "/fares-tips",
    }),
  ];
}

export function demandInsights(demand: Row[], heatmap: Row[], peak: Row, anomalies: Row[]): Insight[] {
  const total = demand.reduce((sum, row) => sum + n(row.trip_count), 0);
  const anomalyCount = anomalies.filter((row) => row.is_anomaly).length;
  const busiest = peak.busiest_hour ?? "n/a";
  const strongestPattern = [...heatmap].sort((a, b) => n(b.trip_count) - n(a.trip_count))[0];
  return [
    insight({
      titleEn: "Peak hour defines the operational pressure point",
      titleZh: "尖峰時段定義營運壓力點",
      observationEn: `The busiest average hour is ${busiest}, with a peak/off-peak ratio of ${label(peak.peak_offpeak_ratio)}.`,
      observationZh: `平均最忙時段是 ${busiest} 點，尖離峰比約 ${label(peak.peak_offpeak_ratio)}。`,
      whyItMattersEn: "Peak concentration shows when supply shortages or dispatch delays are most likely.",
      whyItMattersZh: "尖峰集中代表最容易出現供給不足或派車延遲的時間。",
      nextStepEn: "Filter by borough or airport-only to locate where the peak comes from.",
      nextStepZh: "下一步可篩選行政區或機場行程，定位尖峰來源。",
    }),
    insight({
      titleEn: "Weekday-hour seasonality is visible",
      titleZh: "星期與小時的季節性已浮現",
      observationEn: `${label(strongestPattern?.weekday)} at hour ${label(strongestPattern?.pickup_hour)} has the strongest demand cell in the heatmap.`,
      observationZh: `熱力圖中 ${label(strongestPattern?.weekday)} ${label(strongestPattern?.pickup_hour)} 點是最強需求格。`,
      whyItMattersEn: "Seasonality helps explain recurring demand without treating every spike as abnormal.",
      whyItMattersZh: "季節性可解釋週期性需求，避免把正常尖峰誤判成異常。",
      nextStepEn: "Compare this pattern with anomalies to separate routine peaks from incidents.",
      nextStepZh: "下一步把此模式與異常比較，區分例行尖峰與事件衝擊。",
    }),
    insight({
      titleEn: anomalyCount ? "Anomalies deserve investigation" : "Baseline demand is stable",
      titleZh: anomalyCount ? "異常時段值得進一步調查" : "基準需求相對穩定",
      observationEn: `${anomalyCount} anomaly hours are flagged out of ${count(demand.length)} hourly observations.`,
      observationZh: `在 ${count(demand.length)} 個小時觀測中，共標記 ${anomalyCount} 個異常時段。`,
      whyItMattersEn: "Anomaly count turns a time-series chart into an operational monitoring signal.",
      whyItMattersZh: "異常數量把時間序列轉成營運監控訊號。",
      nextStepEn: "Open Anomaly Investigation to inspect affected zones and routes.",
      nextStepZh: "下一步到 Anomaly Investigation 查看受影響區域與路線。",
      href: "/anomalies",
      severity: anomalyCount ? "warning" : "positive",
    }),
    insight({
      titleEn: "Demand scale gives context to every chart",
      titleZh: "需求規模提供圖表解讀基準",
      observationEn: `The current filters cover about ${count(total)} trips in the hourly demand view.`,
      observationZh: `目前篩選下的小時需求圖約涵蓋 ${count(total)} 筆行程。`,
      whyItMattersEn: "A small sample should be interpreted more cautiously than a broad citywide view.",
      whyItMattersZh: "樣本小時，解讀應比全市大樣本更謹慎。",
      nextStepEn: "Clear narrow filters if the chart looks too sparse.",
      nextStepZh: "若圖表太稀疏，可先清除較窄的篩選條件。",
    }),
  ];
}

export function airportInsights(summary: Row[], routes: Row[], fareComparison: Row[], airportZone: string): Insight[] {
  const totalTrips = summary.reduce((sum, row) => sum + n(row.trip_count), 0);
  const leader = summary[0];
  const topRoute = routes[0];
  const airportFare = fareComparison.find((row) => row.segment === "airport");
  const nonAirportFare = fareComparison.find((row) => row.segment === "non-airport");
  const fareDelta = n(airportFare?.avg_total_amount) - n(nonAirportFare?.avg_total_amount);
  return [
    insight({
      titleEn: "Airport demand is route-specific",
      titleZh: "機場需求高度依賴路線",
      observationEn: `${label(topRoute?.pickup_zone)} to ${label(topRoute?.dropoff_zone)} is the leading airport route with ${count(topRoute?.trip_count)} trips.`,
      observationZh: `${label(topRoute?.pickup_zone)} 到 ${label(topRoute?.dropoff_zone)} 是目前最高量機場路線，約 ${count(topRoute?.trip_count)} 筆。`,
      whyItMattersEn: "Airport operations should be managed by route corridors, not only by airport totals.",
      whyItMattersZh: "機場營運不只看總量，更要看特定走廊路線。",
      nextStepEn: "Open the route drilldown for fare and demand details.",
      nextStepZh: "下一步打開路線 drilldown 檢查車資與需求細節。",
      href: topRoute ? `/routes/drilldown?pickupZone=${encodeURIComponent(label(topRoute.pickup_zone))}&dropoffZone=${encodeURIComponent(label(topRoute.dropoff_zone))}` : "/routes/drilldown",
    }),
    insight({
      titleEn: "Airport selection changes the story",
      titleZh: "不同機場會改變分析故事",
      observationEn: `${airportZone === "All" ? label(leader?.airport_zone) : airportZone} is being evaluated with ${count(totalTrips)} airport-related trips.`,
      observationZh: `目前分析 ${airportZone === "All" ? label(leader?.airport_zone) : airportZone}，涵蓋約 ${count(totalTrips)} 筆機場相關行程。`,
      whyItMattersEn: "JFK, LGA, and EWR can have different inbound/outbound and fare profiles.",
      whyItMattersZh: "JFK、LGA、EWR 的進出方向與車資特性可能不同。",
      nextStepEn: "Use the airport selector to compare one airport against the total market.",
      nextStepZh: "下一步用機場選單比較單一機場與整體市場。",
    }),
    insight({
      titleEn: fareDelta >= 0 ? "Airport fares carry a premium" : "Airport fares are below non-airport trips",
      titleZh: fareDelta >= 0 ? "機場行程存在車資溢價" : "機場行程車資低於非機場行程",
      observationEn: `Airport average fare is ${Math.abs(fareDelta).toFixed(2)} ${fareDelta >= 0 ? "above" : "below"} non-airport trips.`,
      observationZh: `機場平均車資比非機場行程${fareDelta >= 0 ? "高" : "低"} ${Math.abs(fareDelta).toFixed(2)} 美元。`,
      whyItMattersEn: "Fare premium helps explain whether airport demand is only high-volume or also high-value.",
      whyItMattersZh: "車資溢價能判斷機場需求只是高量，還是同時高價值。",
      nextStepEn: "Compare average distance to see whether the premium comes from trip length.",
      nextStepZh: "下一步比較平均距離，確認溢價是否由距離造成。",
      severity: fareDelta >= 0 ? "positive" : "warning",
    }),
  ];
}

export function zonesRoutesInsights(pickupZones: Row[], dropoffZones: Row[], od: Row[], routeRows: Row[], revenueRoutes: Row[]): Insight[] {
  const topPickup = pickupZones[0];
  const topDropoff = dropoffZones[0];
  const topOd = od[0];
  const topRevenueRoute = revenueRoutes[0] ?? routeRows[0];
  return [
    insight({
      titleEn: "Pickup and dropoff demand are not always symmetric",
      titleZh: "上車與下車需求不一定對稱",
      observationEn: `${label(topPickup?.zone)} leads pickups, while ${label(topDropoff?.zone)} leads dropoffs.`,
      observationZh: `${label(topPickup?.zone)} 是上車熱點，而 ${label(topDropoff?.zone)} 是下車熱點。`,
      whyItMattersEn: "Asymmetry reveals commuter flows and repositioning needs.",
      whyItMattersZh: "不對稱能揭示通勤流向與車輛再平衡需求。",
      nextStepEn: "Use zone drilldown to compare inbound and outbound connections.",
      nextStepZh: "下一步用 zone drilldown 比較進出連結。",
      href: topPickup?.location_id ? `/zones/${topPickup.location_id}` : "/map",
    }),
    insight({
      titleEn: "Borough OD matrix summarizes city movement",
      titleZh: "行政區 OD 矩陣濃縮城市移動方向",
      observationEn: `${label(topOd?.pickup_borough)} to ${label(topOd?.dropoff_borough)} is the strongest borough pair.`,
      observationZh: `${label(topOd?.pickup_borough)} 到 ${label(topOd?.dropoff_borough)} 是目前最強行政區配對。`,
      whyItMattersEn: "Borough-level OD helps explain macro mobility before drilling into zones.",
      whyItMattersZh: "行政區 OD 能先掌握宏觀移動，再深入區域。",
      nextStepEn: "Inspect the route matrix for the zone-level version of this flow.",
      nextStepZh: "下一步查看 route matrix，取得區域層級的流向。",
    }),
    insight({
      titleEn: "Top revenue routes show value concentration",
      titleZh: "高收入路線顯示價值集中",
      observationEn: `${label(topRevenueRoute?.pickup_zone)} to ${label(topRevenueRoute?.dropoff_zone)} leads route revenue at ${money(topRevenueRoute?.total_revenue)}.`,
      observationZh: `${label(topRevenueRoute?.pickup_zone)} 到 ${label(topRevenueRoute?.dropoff_zone)} 是目前最高收入路線，約 ${money(topRevenueRoute?.total_revenue)}。`,
      whyItMattersEn: "Revenue routes may deserve different operational attention than pure trip-count routes.",
      whyItMattersZh: "高收入路線可能比單純高量路線更值得營運關注。",
      nextStepEn: "Open route drilldown for fare distribution and sample trips.",
      nextStepZh: "下一步打開 route drilldown 查看車資分布與樣本行程。",
      href: topRevenueRoute ? `/routes/drilldown?pickupZone=${encodeURIComponent(label(topRevenueRoute.pickup_zone))}&dropoffZone=${encodeURIComponent(label(topRevenueRoute.dropoff_zone))}` : "/routes/drilldown",
    }),
  ];
}

export function mapInsights(rows: Row[], network: { detail: Row; flows: Row[]; origins: Row[]; destinations: Row[]; links: Row[] } | null, valueColumn: string): Insight[] {
  const topZone = rows[0];
  const outbound = network?.flows.find((row) => row.direction === "outbound");
  const inbound = network?.flows.find((row) => row.direction === "inbound");
  const topOrigin = network?.origins[0];
  const topDestination = network?.destinations[0];
  return [
    insight({
      titleEn: "The map highlights spatial concentration",
      titleZh: "地圖呈現空間集中度",
      observationEn: `${label(topZone?.zone)} ranks highest by ${valueColumn.replaceAll("_", " ")} in the current choropleth.`,
      observationZh: `目前地圖中 ${label(topZone?.zone)} 在 ${valueColumn.replaceAll("_", " ")} 指標上排名最高。`,
      whyItMattersEn: "Spatial concentration makes it easier to connect demand with geography.",
      whyItMattersZh: "空間集中度能把需求和地理位置連起來。",
      nextStepEn: "Click a zone to convert the map into a node-flow analysis.",
      nextStepZh: "下一步點選地圖區域，把地圖轉成節點流向分析。",
    }),
    insight({
      titleEn: network ? "Selected zone has directional flow" : "No zone selected yet",
      titleZh: network ? "選取區域具有方向性流量" : "尚未選取區域",
      observationEn: network ? `${label(network.detail.zone)} has ${count(inbound?.trip_count)} inbound and ${count(outbound?.trip_count)} outbound trips.` : "Select a zone to see inbound, outbound, and linked nodes.",
      observationZh: network ? `${label(network.detail.zone)} 有約 ${count(inbound?.trip_count)} 筆進入與 ${count(outbound?.trip_count)} 筆離開行程。` : "請選取一個區域，以查看進入、離開與連結節點。",
      whyItMattersEn: "Directional flow explains whether a zone is mainly a source, destination, or balanced hub.",
      whyItMattersZh: "方向性流量能判斷區域是來源、目的地，還是平衡樞紐。",
      nextStepEn: "Compare top origins and destinations in the network panel.",
      nextStepZh: "下一步比較 network panel 中的主要來源與目的地。",
      severity: network ? "info" : "warning",
    }),
    insight({
      titleEn: "Node links identify the strongest connections",
      titleZh: "節點連結找出最強關係",
      observationEn: network ? `${label(topOrigin?.zone)} and ${label(topDestination?.zone)} are the strongest linked nodes around the selected zone.` : "Node links appear after selecting a zone.",
      observationZh: network ? `${label(topOrigin?.zone)} 與 ${label(topDestination?.zone)} 是目前選取區域周邊最強連結節點。` : "選取區域後會顯示節點連結。",
      whyItMattersEn: "Node links turn the map from a static choropleth into an explainable mobility network.",
      whyItMattersZh: "節點連結讓地圖不只是靜態色塊，而是可解釋的移動網絡。",
      nextStepEn: "Open the selected zone drilldown for trip samples.",
      nextStepZh: "下一步打開選取區域 drilldown 查看樣本行程。",
      href: network ? `/zones/${network.detail.location_id}` : "/map",
    }),
  ];
}

export function anomalyInsights(anomalies: Row[], selected: Row | undefined, detail: { summary: Row; previous24h: Row; sameHourYesterday: Row; affectedZones: Row[]; affectedRoutes: Row[] } | null): Insight[] {
  const topZone = detail?.affectedZones[0];
  const topRoute = detail?.affectedRoutes[0];
  return [
    insight({
      titleEn: anomalies.length ? "Anomaly monitoring is active" : "No anomaly is flagged",
      titleZh: anomalies.length ? "異常監控已有訊號" : "目前沒有異常訊號",
      observationEn: anomalies.length ? `${anomalies.length} anomaly hours are available for investigation.` : "The current filters do not produce anomaly hours.",
      observationZh: anomalies.length ? `目前有 ${anomalies.length} 個異常小時可調查。` : "目前篩選條件下沒有異常小時。",
      whyItMattersEn: "Anomaly monitoring helps move from descriptive dashboards to operational diagnosis.",
      whyItMattersZh: "異常監控讓儀表板從描述數據進一步走向營運診斷。",
      nextStepEn: "Select the highest severity hour and inspect affected zones.",
      nextStepZh: "下一步選擇最高嚴重度時段並檢查受影響區域。",
      severity: anomalies.length ? "warning" : "positive",
    }),
    insight({
      titleEn: "Severity quantifies surprise",
      titleZh: "嚴重度衡量偏離程度",
      observationEn: selected ? `The selected hour has severity ${label(selected.severity_score)} with ${label(selected.actual_trip_count)} actual trips vs ${label(selected.expected_trip_count)} expected.` : "No selected anomaly is available.",
      observationZh: selected ? `目前選取時段嚴重度為 ${label(selected.severity_score)}，實際 ${label(selected.actual_trip_count)} 筆，預期 ${label(selected.expected_trip_count)} 筆。` : "目前沒有可選取的異常時段。",
      whyItMattersEn: "Severity ranks the investigation queue instead of relying on visual inspection only.",
      whyItMattersZh: "嚴重度可以排序調查優先級，而不是只靠肉眼看圖。",
      nextStepEn: "Compare the selected hour with the same hour yesterday.",
      nextStepZh: "下一步比較同一小時與前一天同時段。",
    }),
    insight({
      titleEn: "Affected zones and routes explain the anomaly",
      titleZh: "受影響區域與路線解釋異常來源",
      observationEn: topZone ? `${label(topZone.pickup_zone)} and ${label(topRoute?.pickup_zone)} to ${label(topRoute?.dropoff_zone)} are the top affected zone and route.` : "No affected zone is available for this selection.",
      observationZh: topZone ? `${label(topZone.pickup_zone)} 以及 ${label(topRoute?.pickup_zone)} 到 ${label(topRoute?.dropoff_zone)} 是主要受影響區域與路線。` : "目前選取條件沒有受影響區域資料。",
      whyItMattersEn: "Root-cause analysis needs location and route context, not only a timestamp.",
      whyItMattersZh: "根因分析需要地點與路線脈絡，而不只是時間點。",
      nextStepEn: "Open the related route or zone to inspect local demand.",
      nextStepZh: "下一步打開相關路線或區域查看局部需求。",
      href: topRoute ? `/routes/drilldown?pickupZone=${encodeURIComponent(label(topRoute.pickup_zone))}&dropoffZone=${encodeURIComponent(label(topRoute.dropoff_zone))}` : undefined,
    }),
  ];
}

export function faresTipsInsights(fares: Row[], summary: Row[], tips: Row[], revenueRoutes: Row[]): Insight[] {
  const topBorough = summary[0];
  const topTip = tips[0];
  const topRoute = revenueRoutes[0];
  const expensive = fares[0];
  return [
    insight({
      titleEn: "Fare value is linked to geography",
      titleZh: "車資價值和地理位置相關",
      observationEn: `${label(topBorough?.pickup_borough)} leads pickup-borough revenue with ${money(topBorough?.total_revenue)}.`,
      observationZh: `${label(topBorough?.pickup_borough)} 是目前上車行政區收入最高者，約 ${money(topBorough?.total_revenue)}。`,
      whyItMattersEn: "This explains where high-value demand originates.",
      whyItMattersZh: "這能解釋高價值需求從哪裡產生。",
      nextStepEn: "Compare this with top routes by revenue.",
      nextStepZh: "下一步與高收入路線交叉比較。",
    }),
    insight({
      titleEn: "Tips reveal payment behavior",
      titleZh: "小費揭示付款行為",
      observationEn: `${label(topTip?.payment_type)} contributes the most total tips in the current filter set.`,
      observationZh: `${label(topTip?.payment_type)} 是目前小費總額最高的付款方式。`,
      whyItMattersEn: "Tip mix is a behavioral signal that complements fare and distance.",
      whyItMattersZh: "小費結構是行為訊號，可補充車資與距離分析。",
      nextStepEn: "Filter by payment type to isolate card and cash behavior.",
      nextStepZh: "下一步依付款方式篩選，分離刷卡與現金行為。",
    }),
    insight({
      titleEn: "High-value routes deserve drilldown",
      titleZh: "高價值路線值得深入查看",
      observationEn: `${label(topRoute?.pickup_zone)} to ${label(topRoute?.dropoff_zone)} is the leading revenue route. The largest sampled fare is ${money(expensive?.total_amount)}.`,
      observationZh: `${label(topRoute?.pickup_zone)} 到 ${label(topRoute?.dropoff_zone)} 是目前最高收入路線；樣本中最高總車資約 ${money(expensive?.total_amount)}。`,
      whyItMattersEn: "Route-level context separates repeatable value from one-off expensive trips.",
      whyItMattersZh: "路線層級脈絡能區分可重複的價值與單次高價行程。",
      nextStepEn: "Open route drilldown to inspect the fare distribution.",
      nextStepZh: "下一步打開 route drilldown 查看車資分布。",
      href: topRoute ? `/routes/drilldown?pickupZone=${encodeURIComponent(label(topRoute.pickup_zone))}&dropoffZone=${encodeURIComponent(label(topRoute.dropoff_zone))}` : "/routes/drilldown",
    }),
  ];
}

export function forecastInsights(metrics: Row[], rows: Row[], horizon: number, window: number): Insight[] {
  const ranked = [...metrics].sort((a, b) => n(a.mae) - n(b.mae));
  const best = ranked[0];
  const latestActual = [...rows].reverse().find((row) => row.actual !== null);
  return [
    insight({
      titleEn: "Baseline comparison identifies the most reliable simple model",
      titleZh: "基準模型比較找出最穩定的簡單模型",
      observationEn: `${label(best?.model)} has the lowest MAE at ${n(best?.mae).toFixed(2)}.`,
      observationZh: `${label(best?.model)} 的 MAE 最低，約 ${n(best?.mae).toFixed(2)}。`,
      whyItMattersEn: "A strong baseline is required before investing in a more complex forecasting model.",
      whyItMattersZh: "先建立強基準，才能判斷是否值得投入更複雜模型。",
      nextStepEn: "Use this baseline as the benchmark for future ML improvements.",
      nextStepZh: "下一步把此基準作為未來 ML 改善的比較標準。",
      severity: "positive",
    }),
    insight({
      titleEn: "Forecast settings control responsiveness",
      titleZh: "預測設定影響反應速度",
      observationEn: `The current forecast uses a ${horizon}-hour horizon and a ${window}-hour moving window.`,
      observationZh: `目前預測使用 ${horizon} 小時 horizon 與 ${window} 小時 moving window。`,
      whyItMattersEn: "Short windows react faster but can be noisier; long windows smooth volatility.",
      whyItMattersZh: "短視窗反應快但較 noisy；長視窗較平滑但反應較慢。",
      nextStepEn: "Compare windows to see whether demand is stable or volatile.",
      nextStepZh: "下一步比較不同 window，判斷需求穩定或波動。",
    }),
    insight({
      titleEn: "Recent actual demand anchors the forecast",
      titleZh: "近期實際需求是預測錨點",
      observationEn: `The latest actual hourly demand is ${count(latestActual?.actual)} trips.`,
      observationZh: `最近一個實際小時需求約 ${count(latestActual?.actual)} 筆。`,
      whyItMattersEn: "Baseline models often rely heavily on the latest observed demand level.",
      whyItMattersZh: "基準模型通常高度依賴最新觀測到的需求水準。",
      nextStepEn: "Use anomaly detection if the latest hour looks unusual before trusting the forecast.",
      nextStepZh: "若最新小時異常，下一步先用異常偵測確認再信任預測。",
      href: "/anomalies",
    }),
  ];
}

export function warehouseInsights(catalog: { summary?: Row; freshness?: Row; partitions?: Row[]; benchmark?: Row | null; evaluation?: Row | null }): Insight[] {
  const partitions = catalog.partitions ?? [];
  const latencyRows = Object.entries((catalog.benchmark ?? {}) as Record<string, { latency_ms: number }>).map(([query, value]) => ({ query, latency_ms: value.latency_ms }));
  const slowest = latencyRows.sort((a, b) => b.latency_ms - a.latency_ms)[0];
  return [
    insight({
      titleEn: "Warehouse freshness is visible",
      titleZh: "資料倉儲新鮮度可被檢查",
      observationEn: `Trips range from ${label(catalog.freshness?.earliest_pickup_datetime)} to ${label(catalog.freshness?.latest_pickup_datetime)}.`,
      observationZh: `行程資料範圍從 ${label(catalog.freshness?.earliest_pickup_datetime)} 到 ${label(catalog.freshness?.latest_pickup_datetime)}。`,
      whyItMattersEn: "Freshness context tells users whether insights reflect the expected data window.",
      whyItMattersZh: "新鮮度脈絡能讓使用者知道 insight 是否反映預期資料區間。",
      nextStepEn: "Check partitions if freshness does not match the intended ingestion period.",
      nextStepZh: "若新鮮度不符合預期，下一步檢查 partitions。",
    }),
    insight({
      titleEn: "Partition health supports reproducibility",
      titleZh: "分區健康度支援可重現性",
      observationEn: `The warehouse has ${partitions.length} partition file(s) and ${label(catalog.summary?.parquet_size_mb)} MB of parquet data.`,
      observationZh: `目前 warehouse 有 ${partitions.length} 個分區檔，Parquet 大小約 ${label(catalog.summary?.parquet_size_mb)} MB。`,
      whyItMattersEn: "Partition visibility is part of the data engineering story, not only dashboard polish.",
      whyItMattersZh: "分區可視化是資料工程能力的一部分，不只是儀表板美化。",
      nextStepEn: "Run ETL again if partition row counts are missing or unexpected.",
      nextStepZh: "如果分區 row count 不符合預期，下一步重新執行 ETL。",
    }),
    insight({
      titleEn: "Query latency highlights analytical cost",
      titleZh: "查詢延遲反映分析成本",
      observationEn: slowest ? `${slowest.query} is the slowest benchmark at ${slowest.latency_ms} ms.` : "No benchmark report is available.",
      observationZh: slowest ? `${slowest.query} 是目前最慢查詢，約 ${slowest.latency_ms} ms。` : "目前沒有 benchmark 報告。",
      whyItMattersEn: "Latency helps decide which views need pre-aggregation or caching.",
      whyItMattersZh: "延遲能協助判斷哪些視圖需要預聚合或快取。",
      nextStepEn: "Use benchmark results to prioritize warehouse optimization.",
      nextStepZh: "下一步用 benchmark 結果決定倉儲優化優先順序。",
      severity: slowest && slowest.latency_ms > 100 ? "warning" : "positive",
    }),
  ];
}

export function savedViewsInsights(views: Row[], groupedRows: Row[], latest?: Row): Insight[] {
  const topArea = groupedRows[0];
  return [
    insight({
      titleEn: "Saved views turn exploration into reusable reports",
      titleZh: "Saved views 把探索變成可重複報告",
      observationEn: `${views.length} saved view(s) are available across ${groupedRows.length} dashboard area(s).`,
      observationZh: `目前有 ${views.length} 個 saved view，分布在 ${groupedRows.length} 個 dashboard 區域。`,
      whyItMattersEn: "Saved filters make analysis shareable and repeatable.",
      whyItMattersZh: "保存篩選條件能讓分析可分享、可重複。",
      nextStepEn: "Save the current filtered view after finding an important pattern.",
      nextStepZh: "下一步在找到重要模式後保存目前篩選視圖。",
    }),
    insight({
      titleEn: "Saved view coverage shows team focus",
      titleZh: "保存視圖分布顯示團隊關注點",
      observationEn: topArea ? `${label(topArea.area)} is the most saved dashboard area.` : "No dashboard area has been saved yet.",
      observationZh: topArea ? `${label(topArea.area)} 是目前被保存最多的 dashboard 區域。` : "目前尚未保存任何 dashboard 區域。",
      whyItMattersEn: "Frequently saved pages indicate the analysis paths users return to.",
      whyItMattersZh: "常被保存的頁面代表使用者會反覆使用的分析路徑。",
      nextStepEn: "Promote frequently saved paths into demo presets.",
      nextStepZh: "下一步可把常用路徑整理成 demo presets。",
    }),
    insight({
      titleEn: "Latest view provides continuity",
      titleZh: "最新視圖提供分析連貫性",
      observationEn: latest ? `The latest saved view is ${label(latest.name)}.` : "There is no latest saved view yet.",
      observationZh: latest ? `最新保存的視圖是 ${label(latest.name)}。` : "目前還沒有最新保存視圖。",
      whyItMattersEn: "Continuity helps users resume an investigation instead of starting from scratch.",
      whyItMattersZh: "連貫性能讓使用者接續調查，而不是每次從零開始。",
      nextStepEn: "Open or copy the latest view when sharing analysis.",
      nextStepZh: "下一步在分享分析時打開或複製最新視圖。",
      href: latest?.path as string | undefined,
    }),
  ];
}

export function segmentInsights(comparison: { left: string; right: string; leftMetrics: Row; rightMetrics: Row; lift: Row[]; leftRoutes: Row[]; rightRoutes: Row[] }): Insight[] {
  const largestLift = [...comparison.lift].sort((a, b) => Math.abs(n(b.lift_pct)) - Math.abs(n(a.lift_pct)))[0];
  const leftTopRoute = comparison.leftRoutes[0];
  const rightTopRoute = comparison.rightRoutes[0];
  return [
    insight({
      titleEn: "Segment comparison turns filters into an experiment",
      titleZh: "區隔比較把篩選變成實驗",
      observationEn: `${comparison.left} is compared against ${comparison.right} under the same global filters.`,
      observationZh: `目前以相同全域篩選比較 ${comparison.left} 與 ${comparison.right}。`,
      whyItMattersEn: "Side-by-side controls make differences easier to interpret than separate dashboards.",
      whyItMattersZh: "並排比較比在不同頁面切換更容易理解差異。",
      nextStepEn: "Change one segment at a time to isolate behavior.",
      nextStepZh: "下一步一次只改一個 segment，隔離行為差異。",
    }),
    insight({
      titleEn: "Lift quantifies the strongest difference",
      titleZh: "Lift 量化最大差異",
      observationEn: `${label(largestLift?.metric)} has the largest lift at ${label(largestLift?.lift_pct)}%.`,
      observationZh: `${label(largestLift?.metric)} 是目前最大 lift，約 ${label(largestLift?.lift_pct)}%。`,
      whyItMattersEn: "Lift turns the comparison into a decision signal instead of a table scan.",
      whyItMattersZh: "Lift 讓比較成為決策訊號，而不是只掃表格。",
      nextStepEn: "Inspect route mix to understand what creates the lift.",
      nextStepZh: "下一步檢查 route mix，理解差異來源。",
    }),
    insight({
      titleEn: "Route mix explains segment behavior",
      titleZh: "路線組成解釋區隔行為",
      observationEn: `${label(leftTopRoute?.pickup_zone)} to ${label(leftTopRoute?.dropoff_zone)} leads the left segment, while ${label(rightTopRoute?.pickup_zone)} to ${label(rightTopRoute?.dropoff_zone)} leads the right segment.`,
      observationZh: `左側 segment 由 ${label(leftTopRoute?.pickup_zone)} 到 ${label(leftTopRoute?.dropoff_zone)} 領先，右側 segment 由 ${label(rightTopRoute?.pickup_zone)} 到 ${label(rightTopRoute?.dropoff_zone)} 領先。`,
      whyItMattersEn: "Different route mixes often explain fare, distance, and tip differences.",
      whyItMattersZh: "不同路線組成通常能解釋車資、距離與小費差異。",
      nextStepEn: "Open route drilldown for the leading segment route.",
      nextStepZh: "下一步打開領先 segment 路線的 drilldown。",
    }),
  ];
}
