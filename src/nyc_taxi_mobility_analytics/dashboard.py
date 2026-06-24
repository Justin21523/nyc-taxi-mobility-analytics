import pandas as pd
import pydeck as pdk
import streamlit as st

from nyc_taxi_mobility_analytics.analytics import (
    airport_trips,
    borough_od_matrix,
    daily_revenue,
    demand_anomalies,
    fare_distribution,
    fare_summary,
    filter_options,
    hourly_demand,
    overview,
    peak_hour_summary,
    routes,
    search_trips,
    tip_behavior,
    tip_by_distance_bucket,
    top_routes_by_revenue,
    top_zones,
    weekday_hour_seasonality,
    zone_map_metrics,
    zone_names,
)
from nyc_taxi_mobility_analytics.config import DB_PATH
from nyc_taxi_mobility_analytics.etl import run_etl
from nyc_taxi_mobility_analytics.forecast import forecast_metrics, make_forecast
from nyc_taxi_mobility_analytics.geo import choropleth_geojson


if not DB_PATH.exists():
    run_etl()

st.set_page_config(page_title="NYC Taxi Mobility Analytics", layout="wide")
st.title("NYC Taxi Mobility Analytics")


@st.cache_data(ttl=300)
def cached_filter_options():
    return filter_options()


def sidebar_filters() -> dict:
    options = cached_filter_options()
    st.sidebar.header("Filters")
    min_date = pd.to_datetime(options["min_date"]).date()
    max_date = pd.to_datetime(options["max_date"]).date()
    selected_dates = st.sidebar.date_input("Pickup date range", value=(min_date, max_date), min_value=min_date, max_value=max_date)
    if isinstance(selected_dates, tuple) and len(selected_dates) == 2:
        start_date, end_date = selected_dates
    else:
        start_date, end_date = min_date, max_date
    boroughs = ["All"] + options["boroughs"]
    payments = ["All"] + [str(item) for item in options["payment_types"]]
    return {
        "start_date": start_date,
        "end_date": end_date,
        "pickup_borough": st.sidebar.selectbox("Pickup borough", boroughs),
        "dropoff_borough": st.sidebar.selectbox("Dropoff borough", boroughs),
        "payment_type": st.sidebar.selectbox("Payment type", payments),
        "airport_only": st.sidebar.toggle("Airport trips only", value=False),
        "min_distance": st.sidebar.slider("Minimum distance", 0.0, 20.0, 0.0, 0.5),
    }


filters = sidebar_filters()
page = st.sidebar.radio(
    "Page",
    [
        "Overview",
        "Demand",
        "Zones & routes",
        "Fares & tips",
        "Trip Explorer",
        "Forecast Lab",
        "Zone Map",
    ],
)


def render_kpis(metrics: dict) -> None:
    cols = st.columns(6)
    cols[0].metric("Trips", f"{int(metrics.get('trip_count') or 0):,}")
    cols[1].metric("Revenue", f"${float(metrics.get('total_revenue') or 0):,.0f}")
    cols[2].metric("Avg fare", f"${float(metrics.get('avg_total_amount') or 0):.2f}")
    cols[3].metric("Avg distance", f"{float(metrics.get('avg_distance') or 0):.2f} mi")
    cols[4].metric("Avg tip rate", f"{float(metrics.get('avg_tip_rate_pct') or 0):.2f}%")
    cols[5].metric("Airport share", f"{float(metrics.get('airport_trip_share_pct') or 0):.2f}%")


def seasonality_heatmap() -> pd.DataFrame:
    seasonality = weekday_hour_seasonality(filters)
    order = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    heatmap = seasonality.pivot_table(index="weekday", columns="pickup_hour", values="trip_count", fill_value=0)
    return heatmap.reindex([item for item in order if item in heatmap.index])


render_kpis(overview(filters))

if page == "Overview":
    c1, c2 = st.columns([2, 1])
    c1.subheader("Daily trips and revenue")
    c1.line_chart(daily_revenue(filters), x="trip_date", y=["trip_count", "total_revenue"])
    c2.subheader("Airport summary")
    c2.dataframe(airport_trips(filters), use_container_width=True, hide_index=True)
    c2.subheader("Peak hours")
    c2.json(peak_hour_summary(filters))
    st.subheader("Top pickup zones")
    st.bar_chart(top_zones("pickup", 15, filters), x="zone", y="trip_count")

elif page == "Demand":
    demand = hourly_demand(2000, filters)
    st.subheader("Hourly demand")
    st.line_chart(demand, x="pickup_hour", y="trip_count")
    c1, c2 = st.columns([1, 1])
    c1.subheader("Weekday/hour heatmap")
    c1.dataframe(seasonality_heatmap().style.background_gradient(cmap="YlOrRd"), use_container_width=True)
    c2.subheader("Peak and anomaly summary")
    c2.json(peak_hour_summary(filters))
    anomalies = demand_anomalies(filters)
    st.subheader("Rolling anomaly baseline")
    st.line_chart(anomalies.tail(336), x="pickup_hour", y=["trip_count", "rolling_mean", "upper_band", "lower_band"])
    st.dataframe(anomalies[anomalies["is_anomaly"]].tail(50), use_container_width=True, hide_index=True)

elif page == "Zones & routes":
    c1, c2 = st.columns(2)
    c1.subheader("Pickup zones")
    pickup = top_zones("pickup", 20, filters)
    c1.bar_chart(pickup, x="zone", y="trip_count")
    c1.dataframe(pickup, use_container_width=True, hide_index=True)
    c2.subheader("Dropoff zones")
    dropoff = top_zones("dropoff", 20, filters)
    c2.bar_chart(dropoff, x="zone", y="trip_count")
    c2.dataframe(dropoff, use_container_width=True, hide_index=True)

    st.subheader("Borough-to-borough OD matrix")
    od = borough_od_matrix(filters)
    st.dataframe(od.pivot_table(index="pickup_borough", columns="dropoff_borough", values="trip_count", fill_value=0).style.background_gradient(cmap="Blues"), use_container_width=True)

    st.subheader("Route matrix")
    top_route_count = st.slider("Route rows", 10, 100, 30, 5)
    route_df = routes(top_route_count, filters)
    st.dataframe(route_df, use_container_width=True, hide_index=True)
    st.dataframe(route_df.pivot_table(index="pickup_zone", columns="dropoff_zone", values="trip_count", fill_value=0).style.background_gradient(cmap="Blues"), use_container_width=True)

elif page == "Fares & tips":
    fares = fare_distribution(5000, filters)
    c1, c2 = st.columns(2)
    c1.subheader("Fare distribution")
    c1.bar_chart(fares["total_amount"].value_counts(bins=25).sort_index())
    c2.subheader("Fare vs distance")
    c2.scatter_chart(fares, x="trip_distance", y="total_amount", color="tip_amount")
    st.subheader("Revenue by pickup borough")
    st.dataframe(fare_summary(filters), use_container_width=True, hide_index=True)
    c3, c4 = st.columns(2)
    c3.subheader("Tip behavior by payment type")
    c3.dataframe(tip_behavior(filters), use_container_width=True, hide_index=True)
    c4.subheader("Tip rate by distance bucket")
    c4.bar_chart(tip_by_distance_bucket(filters), x="distance_bucket", y="avg_tip_rate_pct")
    st.subheader("Top routes by revenue")
    st.dataframe(top_routes_by_revenue(25, filters), use_container_width=True, hide_index=True)

elif page == "Trip Explorer":
    zones = ["All"] + zone_names()
    c1, c2, c3, c4 = st.columns(4)
    pickup_zone = c1.selectbox("Pickup zone", zones)
    dropoff_zone = c2.selectbox("Dropoff zone", zones)
    min_fare = c3.number_input("Min total fare", min_value=0.0, value=0.0, step=1.0)
    max_fare_enabled = c4.toggle("Set max fare", value=False)
    max_fare = c4.number_input("Max total fare", min_value=0.0, value=100.0, step=1.0) if max_fare_enabled else None
    c5, c6, c7 = st.columns(3)
    sort_by = c5.selectbox("Sort by", ["pickup_datetime", "total_amount", "trip_distance", "tip_amount"])
    sort_dir = c6.selectbox("Direction", ["desc", "asc"])
    limit = c7.slider("Rows", 25, 500, 100, 25)
    trips = search_trips(
        limit=limit,
        filters=filters,
        pickup_zone=pickup_zone,
        dropoff_zone=dropoff_zone,
        min_fare=min_fare,
        max_fare=max_fare,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    st.dataframe(trips, use_container_width=True, hide_index=True)

elif page == "Forecast Lab":
    c1, c2 = st.columns(2)
    horizon = c1.select_slider("Forecast horizon", options=[6, 12, 24, 48, 72, 168], value=24)
    window = c2.select_slider("Moving average window", options=[6, 12, 24, 48, 72, 168], value=24)
    forecast = make_forecast(window=window, horizon=horizon, filters=filters)
    metrics = forecast_metrics(forecast)
    st.subheader("Model comparison")
    st.dataframe(metrics, use_container_width=True, hide_index=True)
    st.subheader("Actual vs baselines")
    st.line_chart(forecast.tail(336), x="pickup_hour", y=["actual", "naive_forecast", "moving_average_forecast", "seasonal_naive_forecast"])
    residuals = forecast.dropna(subset=["actual"]).copy()
    residuals["moving_average_error"] = residuals["actual"] - residuals["moving_average_forecast"]
    residuals["seasonal_naive_error"] = residuals["actual"] - residuals["seasonal_naive_forecast"]
    st.subheader("Residuals")
    st.line_chart(residuals.tail(336), x="pickup_hour", y=["moving_average_error", "seasonal_naive_error"])

else:
    map_kind = st.radio("Map metric", ["pickup", "dropoff"], horizontal=True)
    metric_column = st.radio("Color by", ["trip_count", "total_revenue"], horizontal=True)
    zone_metrics = zone_map_metrics(map_kind, filters)
    geojson = choropleth_geojson(zone_metrics, value_column=metric_column)
    if geojson:
        layer = pdk.Layer(
            "GeoJsonLayer",
            geojson,
            pickable=True,
            stroked=True,
            filled=True,
            get_fill_color="properties.fill_color",
            get_line_color=[90, 90, 90],
            line_width_min_pixels=1,
        )
        tooltip = {
            "html": "<b>{zone}</b><br/>Borough: {borough}<br/>Trips: {trip_count}<br/>Revenue: ${total_revenue}",
            "style": {"backgroundColor": "white", "color": "black"},
        }
        st.pydeck_chart(
            pdk.Deck(
                layers=[layer],
                initial_view_state=pdk.ViewState(latitude=40.72, longitude=-73.92, zoom=9.7, pitch=0),
                tooltip=tooltip,
            ),
            use_container_width=True,
        )
    else:
        st.warning("NYC taxi zone GeoJSON is unavailable. Showing zone table instead.")
    st.dataframe(zone_metrics, use_container_width=True, hide_index=True)
