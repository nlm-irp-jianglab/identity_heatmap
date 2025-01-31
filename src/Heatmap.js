import React, { useState, useEffect, useCallback } from "react";
import * as d3 from "d3";
import CSVReader from 'react-csv-reader';
import Draggable from 'react-draggable';

const Heatmap = () => {
  const [matrixData, setMatrixData] = useState([]);
  const [renamed, setRenamed] = useState({});
  const [showUpper, setShowUpper] = useState(true);
  const [colorScheme, setColorScheme] = useState("Viridis");
  const [fontSize, setFontSize] = useState(12);
  const [labelFontSize, setLabelFontSize] = useState(12);
  const [filteredData, setFilteredData] = useState([]);

  const width = 500;
  const height = 500;
  const margin = { top: 50, right: 80, bottom: 50, left: 100 };

  useEffect(() => {
    setFilteredData([...matrixData]);
  }, [matrixData]);

  const handleFileLoad = (data) => {
    console.log("CSV Data Loaded:", data);
    // Filter out empty rows and columns
    const filteredData = data.filter(row => row.some(cell => cell !== ""));
    const transposedData = filteredData[0].map((_, colIndex) => filteredData.map(row => row[colIndex]));
    const finalData = transposedData.filter(row => row.some(cell => cell !== ""));
    setMatrixData(finalData);
  };

  // Rename sequences dynamically
  const renameSequence = (original, newName) => {
    setRenamed((prev) => ({ ...prev, [original]: newName }));
  };

  const getColorScale = useCallback(() => {
    switch (colorScheme) {
      case "Gray":
        return d3.scaleLinear().domain([0, 100]).range(["#333333", "#ffffff"]);
      case "GrayReverse":
        return d3.scaleLinear().domain([0, 100]).range(["#ffffff", "#333333"]);
      case "Blue":
        return d3.scaleLinear().domain([0, 100]).range(["#08306b", "#deebf7"]);
      case "BlueReverse":
        return d3.scaleLinear().domain([0, 100]).range(["#deebf7", "#08306b"]);
      case "Viridis":
        return d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);
      case "ViridisReverse":
        return d3.scaleSequential(d3.interpolateViridis).domain([100, 0]);
      default:
        return d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);
    }
  }, [colorScheme]);

  const getTextColor = (backgroundColor) => {
    const color = d3.color(backgroundColor);
    const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    return luminance > 186 ? "black" : "white";
  };

  const drawHeatmap = useCallback(() => {
    console.log("Drawing heatmap with data:", filteredData);
    d3.select("#heatmap").selectAll("*").remove();
    if (!filteredData.length) return;

    const labels = filteredData[0].slice(1).map((seq) => renamed[seq] || seq);
    const values = filteredData.slice(1).map((row) => row.slice(1));

    const svg = d3
      .select("#heatmap")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand().range([0, width]).domain(labels).padding(0.05);
    const y = d3.scaleBand().range([0, height]).domain(labels).padding(0.05);
    const colorScale = getColorScale();

    svg
      .selectAll()
      .data(values.flatMap((row, i) =>
        row.map((val, j) => ({ x: labels[j], y: labels[i], value: +val, i, j }))
      ))
      .enter()
      .filter((d) => (showUpper ? d.i <= d.j : d.i >= d.j))
      .append("rect")
      .attr("x", (d) => x(d.x))
      .attr("y", (d) => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d) => colorScale(d.value))
      .style("stroke", "#fff");

    svg
      .selectAll(".text")
      .data(values.flatMap((row, i) =>
        row.map((val, j) => ({ x: labels[j], y: labels[i], value: +val, i, j }))
      ))
      .enter()
      .filter((d) => (showUpper ? d.i <= d.j : d.i >= d.j))
      .append("text")
      .attr("x", (d) => x(d.x) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.y) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", (d) => getTextColor(colorScale(d.value)))
      .attr("font-size", `${fontSize}px`)
      .attr("font-family", "Arial")
      .text((d) => d.value.toFixed(1));

    // Add X axis labels
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", `${labelFontSize}px`)
      .style("font-family", "Arial");

    // Add Y axis labels
    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", `${labelFontSize}px`)
      .style("font-family", "Arial");

    // Add legend
    const legend = d3.select("#legend-container svg")
      .attr("width", 100)
      .attr("height", 200);

    const legendScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, 200]);

    const legendAxis = d3.axisLeft(legendScale)
      .tickValues([0, 25, 50, 75, 100]);

    legend.select(".legend-axis")
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", `${labelFontSize}px`)
      .style("font-family", "Arial");

    legend.selectAll("rect")
      .data(d3.range(0, 101))
      .enter()
      .append("rect")
      .attr("x", 30) // Shift the rect to the right
      .attr("y", (d) => legendScale(d))
      .attr("width", 20)
      .attr("height", 2)
      .style("fill", (d) => colorScale(d));

    legend.selectAll(".legend-label")
      .data(d3.range(0, 101))
      .enter()
      .append("text")
      .attr("x", 0) // Shift the text to the left
      .attr("y", (d) => legendScale(d) + 1)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .style("font-size", `${labelFontSize}px`)
      .style("font-family", "Arial")
      .text((d) => d);
  }, [filteredData, renamed, showUpper, getColorScale, fontSize, labelFontSize, margin]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap, colorScheme]);

  useEffect(() => {
    const colorScale = getColorScale();
    const legend = d3.select("#legend-container svg");

    legend.selectAll("rect")
      .data(d3.range(0, 101))
      .style("fill", (d) => colorScale(d));
  }, [colorScheme, getColorScale]);

  const downloadSVG = () => {
    const svg = d3.select("#heatmap svg").node();
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "heatmap.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2>Pairwise Identity Heatmap</h2>
      <CSVReader onFileLoaded={handleFileLoad} />
      <div>
        {filteredData.slice(1).map((row, index) => (
          <div key={index} style={{ padding: "5px", margin: "5px", backgroundColor: "#ddd" }}>
            <input
              type="text"
              value={renamed[row[0]] || row[0]}
              onChange={(e) => renameSequence(row[0], e.target.value)}
            />
          </div>
        ))}
      </div>
      <button onClick={() => setShowUpper(!showUpper)}>Toggle Upper/Lower Triangular View</button>
      <button onClick={() => setColorScheme("Gray")}>Gray</button>
      <button onClick={() => setColorScheme("GrayReverse")}>Gray Reverse</button>
      <button onClick={() => setColorScheme("Blue")}>Blue</button>
      <button onClick={() => setColorScheme("BlueReverse")}>Blue Reverse</button>
      <button onClick={() => setColorScheme("Viridis")}>Viridis</button>
      <button onClick={() => setColorScheme("ViridisReverse")}>Viridis Reverse</button>
      <label>
        Font Size:
        <input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
      </label>
      <label>
        Label Font Size:
        <input type="number" value={labelFontSize} onChange={(e) => setLabelFontSize(e.target.value)} />
      </label>
      <button onClick={downloadSVG}>Download as SVG</button>
      <div id="heatmap"></div>
      <Draggable>
        <div id="legend-container">
          <svg>
            <g className="legend-axis"></g>
          </svg>
        </div>
      </Draggable>
    </div>
  );
};

export default Heatmap;
