import streamlit as st

from nyc_taxi_mobility_analytics.analytics import (
    airport_trips,
    borough_od_matrix,
    daily_revenue,
    fare_distribution,
    hourly_demand,
    overview,
    routes,
    tip_behavior,
    top_routes_by_revenue,
    top_zones,
    weekday_hour_seasonality,
)
from nyc_taxi_mobility_analytics.config import DB_PATH
from nyc_taxi_mobility_analytics.etl import run_etl
from nyc_taxi_mobility_analytics.forecast import make_forecast


if not DB_PATH.exists():
    run_etl()

st.set_page_config(page_title="NYC Taxi Mobility Analytics", layout="wide")
st.title("NYC Taxi Mobility Analytics")

page = st.sidebar.radio(
    "Page",
    [
        "Overview",
        "Demand by hour",
        "Zone analysis",
        "Route analysis",
        "Fare analysis",
        "Forecasting baseline",
        "Advanced analysis",
    ],
)

if page == "Overview":
    metrics = overview()
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Trips", f"{int(metrics['trip_count']):,}")
    c2.metric("Revenue", f"${metrics['total_revenue']:,.0f}")
    c3.metric("Avg distance", f"{metrics['avg_distance']:.2f} mi")
    c4.metric("Avg fare", f"${metrics['avg_total_amount']:.2f}")
    st.line_chart(daily_revenue(), x="trip_date", y=["trip_count", "total_revenue"])
    st.bar_chart(top_zones("pickup", 10), x="zone", y="trip_count")
    st.dataframe(airport_trips(), use_container_width=True)
elif page == "Demand by hour":
    demand = hourly_demand(720)
    st.line_chart(demand, x="pickup_hour", y="trip_count")
    seasonality = weekday_hour_seasonality()
    st.bar_chart(seasonality, x="pickup_hour", y="trip_count", color="weekday")
    st.dataframe(demand, use_container_width=True)
elif page == "Zone analysis":
    c1, c2 = st.columns(2)
    c1.subheader("Pickup zones")
    c1.dataframe(top_zones("pickup", 15), use_container_width=True)
    c1.bar_chart(top_zones("pickup", 15), x="zone", y="trip_count")
    c2.subheader("Dropoff zones")
    c2.dataframe(top_zones("dropoff", 15), use_container_width=True)
    c2.bar_chart(top_zones("dropoff", 15), x="zone", y="trip_count")
elif page == "Route analysis":
    count_routes = routes(25)
    revenue_routes = top_routes_by_revenue(25)
    st.subheader("Top routes by trip count")
    st.dataframe(count_routes, use_container_width=True)
    heatmap = count_routes.pivot_table(index="pickup_zone", columns="dropoff_zone", values="trip_count", fill_value=0)
    st.dataframe(heatmap.style.background_gradient(cmap="Blues"), use_container_width=True)
    st.subheader("Top routes by revenue")
    st.dataframe(revenue_routes, use_container_width=True)
elif page == "Fare analysis":
    fares = fare_distribution()
    st.bar_chart(fares["total_amount"].value_counts(bins=20).sort_index())
    st.scatter_chart(fares, x="trip_distance", y="total_amount")
    st.dataframe(tip_behavior(), use_container_width=True)
    st.dataframe(fares, use_container_width=True)
elif page == "Forecasting baseline":
    forecast = make_forecast()
    st.line_chart(forecast.tail(168), x="pickup_hour", y=["actual", "naive_forecast", "moving_average_forecast"])
    st.dataframe(forecast.tail(48), use_container_width=True)
else:
    c1, c2 = st.columns(2)
    c1.subheader("Airport trips")
    c1.dataframe(airport_trips(), use_container_width=True)
    c2.subheader("Tip behavior")
    c2.dataframe(tip_behavior(), use_container_width=True)
    st.subheader("Borough-to-borough OD matrix")
    od = borough_od_matrix()
    st.dataframe(od.pivot_table(index="pickup_borough", columns="dropoff_borough", values="trip_count", fill_value=0), use_container_width=True)
    st.subheader("Weekday/hour seasonality")
    st.dataframe(weekday_hour_seasonality(), use_container_width=True)
