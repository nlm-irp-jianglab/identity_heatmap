import React, { useState, useEffect, useCallback } from "react";
import * as d3 from "d3";
import CSVReader from 'react-csv-reader';
import Draggable from 'react-draggable';

const Heatmap = () => {
  const [matrixData, setMatrixData] = useState([]);
  const [renamed, setRenamed] = useState({});
  const [showUpper, setShowUpper] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [domainStart, setDomainStart] = useState(0);
  const [domainEnd, setDomainEnd] = useState(100);
  const [color1, setColor1] = useState("#08306b"); // Dark Blue
  const [color2, setColor2] = useState("#ffffff"); // White
  const [fontSize, setFontSize] = useState(12);
  const [labelFontSize, setLabelFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState("Arial");

  const width = 500;
  const height = 500;
  const margin = { top: 50, right: 80, bottom: 120, left: 120 }; // Increased bottom margin for column labels

  useEffect(() => {
    setFilteredData([...matrixData]);
  }, [matrixData]);

  const handleFileLoad = (data) => {
    console.log("CSV Data Loaded:", data);
    const filteredData = data.filter(row => row.some(cell => cell !== ""));
    setMatrixData(filteredData);
  };

  // ✅ Rename rows and columns dynamically
  const renameSequence = (original, newName) => {
    setRenamed((prev) => ({ ...prev, [original]: newName }));
  };

  const getColorScale = useCallback(() => {
    return d3.scaleLinear().domain([domainStart, domainEnd]).range([color1, color2]);
  }, [domainStart, domainEnd, color1, color2]);

  const getTextColor = (bgColor) => {
    const color = d3.color(bgColor);
    if (!color) return "black";
    const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    return luminance > 150 ? "black" : "white";
  };

  const drawHeatmap = useCallback(() => {
    d3.select("#heatmap").selectAll("*").remove();
    if (!filteredData.length) return;

    const labels = filteredData[0].slice(1).map((seq) => renamed[seq] || seq);
    const values = filteredData.slice(1).map((row) => row.slice(1).map(Number));

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

    // Draw heatmap squares
    svg
      .selectAll()
      .data(values.flatMap((row, i) =>
        row.map((val, j) => ({ x: labels[j], y: labels[i], value: val, i, j }))
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

    // Add text labels with automatic color adjustment
    svg
      .selectAll(".text")
      .data(values.flatMap((row, i) =>
        row.map((val, j) => ({ x: labels[j], y: labels[i], value: val, i, j }))
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
      .attr("font-family", fontFamily)
      .text((d) => d.value.toFixed(1));

    // ✅ Add column labels at the bottom
    svg.append("g")
      .selectAll("text")
      .data(labels)
      .enter()
      .append("text")
      .attr("x", (d) => x(d) + x.bandwidth() / 2)
      .attr("y", height + 40) // Positioned below the heatmap
      .attr("text-anchor", "middle")
      .attr("transform", (d) => `rotate(45, ${x(d) + x.bandwidth() / 2}, ${height + 40})`)
      .style("font-size", `${labelFontSize}px`)
      .style("font-family", fontFamily)
      .text((d) => d);

    // ✅ Add row labels
    svg.append("g")
      .selectAll("text")
      .data(labels)
      .enter()
      .append("text")
      .attr("x", -10)
      .attr("y", (d) => y(d) + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .style("font-size", `${labelFontSize}px`)
      .style("font-family", fontFamily)
      .text((d) => d);

  }, [filteredData, renamed, showUpper, getColorScale, fontSize, labelFontSize, fontFamily]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  return (
    <div>
      <h2>Pairwise Identity Heatmap</h2>
      <CSVReader onFileLoaded={handleFileLoad} />

      <button onClick={() => setShowUpper(!showUpper)}>Toggle Upper/Lower Triangular View</button>
      <div id="heatmap"></div>

      <Draggable>
        <div id="legend-container" style={{ position: "absolute", top: "10px", right: "10px", background: "white", padding: "5px", borderRadius: "5px" }}>
          <h4>Legend</h4>
        </div>
      </Draggable>
    </div>
  );
};

export default Heatmap;
