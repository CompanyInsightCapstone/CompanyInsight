import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "../styles/CandleStickGraph.css";

export default function CandleStickGraph({ configPlot }) {
  const svgRef = useRef();
  const { data, width, height, margin } = configPlot;

  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    d3.select(svgRef.current).selectAll("*").remove();
    const marginLeft = margin.left;
    const marginRight = margin.right;
    const marginTop = margin.top;
    const marginBottom = margin.bottom;
    const ticker = data
      .map((d) => ({
        Date: new Date(d.t),
        Open: +d.o,
        High: +d.h,
        Low: +d.l,
        Close: +d.c,
        Volume: +d.v,
        VolumeWeighted: +d.vw,
        Transactions: +d.n,
      }))
      .filter(
        (d) =>
          !isNaN(d.Date) &&
          !isNaN(d.Open) &&
          !isNaN(d.High) &&
          !isNaN(d.Low) &&
          !isNaN(d.Close),
      );

    if (ticker.length === 0) return;

    ticker.sort((a, b) => a.Date - b.Date);
    const x = d3
      .scaleBand()
      .domain(ticker.map((d) => d.Date))
      .range([marginLeft, width - marginRight])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(ticker, (d) => d.Low) * 0.95,
        d3.max(ticker, (d) => d.High) * 1.05,
      ])
      .range([height - marginBottom, marginTop]);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat(d3.timeFormat("%m/%d"))
          .tickValues(
            ticker
              .filter((d, i) => i % Math.ceil(ticker.length / 10) === 0)
              .map((d) => d.Date),
          ),
      )
      .call((g) => g.select(".domain").remove());

    svg
      .append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickFormat(d3.format("$~f")))
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity", 0.1)
          .attr("x2", width - marginLeft - marginRight),
      )
      .call((g) => g.select(".domain").remove());

    const g = svg
      .append("g")
      .attr("stroke-linecap", "round")
      .attr("stroke", "black")
      .selectAll("g")
      .data(ticker)
      .join("g")
      .attr(
        "transform",
        (d) => `translate(${x(d.Date) + x.bandwidth() / 2},0)`,
      );

    g.append("line")
      .attr("y1", (d) => y(d.Low))
      .attr("y2", (d) => y(d.High))
      .attr("stroke-width", 1);

    g.append("rect")
      .attr("y", (d) => y(Math.max(d.Open, d.Close)))
      .attr("height", (d) => Math.abs(y(d.Open) - y(d.Close)) || 1)
      .attr("width", x.bandwidth() * 0.8)
      .attr("x", -x.bandwidth() * 0.4)
      .attr("fill", (d) =>
        d.Open > d.Close ? "#ef4444" : d.Close > d.Open ? "#22c55e" : "#6b7280",
      )
      .attr("stroke", (d) =>
        d.Open > d.Close ? "#dc2626" : d.Close > d.Open ? "#16a34a" : "#4b5563",
      )
      .attr("stroke-width", 1);

    const formatDate = d3.timeFormat("%B %d, %Y");
    const formatValue = d3.format(".2f");
    const formatChange = d3.format("+.2%");

    g.append("title").text((d) => {
      const change = (d.Close - d.Open) / d.Open;
      return `${formatDate(d.Date)}
        Open: $${formatValue(d.Open)}
        Close: $${formatValue(d.Close)} (${formatChange(change)})
        Low: $${formatValue(d.Low)}
        High: $${formatValue(d.High)}`;
    });
  }, [data, width, height, margin]);

  return (
    <div className="candlestick-chart">
      <svg ref={svgRef}></svg>
    </div>
  );
}
