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
  const margin = { top: 50, right: 80, bottom: 50, left: 120 };

  // Define columnNames and columnWidth
  const columnNames = ["Column1", "Column2", "Column3"]; // Example column names
  const columnWidth = 100; // Example column width

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

    // ✅ Draw Legend
    d3.select("#legend-container").selectAll("*").remove();
    const legendSvg = d3.select("#legend-container")
      .append("svg")
      .attr("width", 80)
      .attr("height", 250);

    const legendScale = d3.scaleLinear()
      .domain([domainStart, domainEnd])
      .range([200, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);

    legendSvg.append("g")
      .attr("transform", "translate(50,20)")
      .call(legendAxis);

    legendSvg.selectAll("rect")
      .data(d3.range(domainStart, domainEnd, (domainEnd - domainStart) / 100))
      .enter()
      .append("rect")
      .attr("x", 30)
      .attr("y", (d) => legendScale(d) + 20)
      .attr("width", 20)
      .attr("height", 2)
      .style("fill", (d) => colorScale(d));

    // Move column names under the plot and rotate text
    legendSvg.selectAll(".column-name")
      .data(columnNames)
      .enter()
      .append("text")
      .attr("class", "column-name")
      .attr("x", (d, i) => i * columnWidth + columnWidth / 2)
      .attr("y", height + margin.bottom - 10) // Adjust y position to be under the plot
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")
      .text((d) => d);

    }, [filteredData, renamed, showUpper, getColorScale, fontSize, labelFontSize, fontFamily, domainStart, domainEnd, margin.bottom, margin.left, margin.right, margin.top, columnNames]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  return (
    <div>
      <h2>Pairwise Identity Heatmap</h2>
      <CSVReader onFileLoaded={handleFileLoad} />

      {/* ✅ User Input for Customization */}
      <div>
        <label>Domain Start:
          <input type="number" value={domainStart} onChange={(e) => setDomainStart(Number(e.target.value))} />
        </label>
        <label>Domain End:
          <input type="number" value={domainEnd} onChange={(e) => setDomainEnd(Number(e.target.value))} />
        </label>
        <label>Color 1:
          <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} />
        </label>
        <label>Color 2:
          <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} />
        </label>

        <label>Font Size:
          <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
        </label>
        <label>Label Font Size:
          <input type="number" value={labelFontSize} onChange={(e) => setLabelFontSize(Number(e.target.value))} />
        </label>
        <label>Font Family:
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </label>
      </div>

      {/* ✅ Row & Column Renaming */}
      <div>
        <h3>Rename Rows & Columns</h3>
        {filteredData.length > 0 && filteredData[0].slice(1).map((seq, i) => (
          <div key={i}>
            <label>{seq} → </label>
            <input
              type="text"
              value={renamed[seq] || seq}
              onChange={(e) => renameSequence(seq, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button onClick={() => setShowUpper(!showUpper)}>Toggle Upper/Lower Triangular View</button>
      <div id="heatmap"></div>

      <Draggable>
        <div id="legend-container" style={{ position: "absolute", top: "10px", right: "10px", background: "white", padding: "5px", borderRadius: "5px" }}>
          <h4>Legend</h4>
          <svg id="legend-svg"></svg> {/* Added missing SVG element for the legend */}
        </div>
      </Draggable>
    </div>
  );
};

export default Heatmap;
