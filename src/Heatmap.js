import React, { useState, useEffect } from "react";
import * as d3 from "d3";

const Heatmap = ({ matrixData }) => {
  const [renamed, setRenamed] = useState({});
  const [showUpper, setShowUpper] = useState(true);
  const [colorScaleType, setColorScaleType] = useState("interpolateCool");
  const [filteredData, setFilteredData] = useState(matrixData);
  const width = 500;
  const height = 500;
  const margin = { top: 50, right: 50, bottom: 50, left: 100 };

  useEffect(() => {
    drawHeatmap();
  }, [filteredData, renamed, showUpper, colorScaleType]);

  const renameSequence = (original, newName) => {
    setRenamed({ ...renamed, [original]: newName });
  };

  const deleteColumn = (sequence) => {
    const updatedData = filteredData.map((row) =>
      row.filter((_, index) => index === 0 || filteredData[0].indexOf(sequence) !== index)
    );
    setFilteredData(updatedData);
  };

  const downloadSVG = () => {
    const svgElement = document.querySelector("#heatmap svg");
    const serializer = new XMLSerializer();
    const svgBlob = new Blob([serializer.serializeToString(svgElement)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "heatmap.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const drawHeatmap = () => {
    d3.select("#heatmap").selectAll("*").remove();

    if (!filteredData) return;

    const rows = filteredData.length - 1;
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
    const colorScale = d3.scaleSequential(d3[colorScaleType]).domain([0, 100]);

    svg
      .selectAll()
      .data(values.flatMap((row, i) =>
        row.map((val, j) => ({ x: labels[j], y: labels[i], value: +val, i, j }))
      ))
      .enter()
      .filter((d) => (showUpper ? d.i <= d.j : d.i >= d.j)) // Show only one triangle
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
      .filter((d) => (showUpper ? d.i <= d.j : d.i >= d.j)) // Show only one triangle
      .append("text")
      .attr("x", (d) => x(d.x) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.y) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", "black")
      .attr("font-size", "12px")
      .text((d) => d.value.toFixed(1));

    svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x).tickSize(0));
    svg.append("g").call(d3.axisLeft(y).tickSize(0));
  };

  return (
    <div>
      <h2>Pairwise Identity Heatmap</h2>
      <div>
        {filteredData[0].slice(1).map((seq, i) => (
          <div key={i}>
            <label>
              {seq} →{" "}
              <input
                type="text"
                value={renamed[seq] || seq}
                onChange={(e) => renameSequence(seq, e.target.value)}
              />
            </label>
            <button onClick={() => deleteColumn(seq)}>Delete</button>
          </div>
        ))}
      </div>
      <button onClick={() => setShowUpper(!showUpper)}>Toggle Upper/Lower Triangular View</button>
      <button onClick={downloadSVG}>Download SVG</button>
      <label>
        Color Scale:
        <select value={colorScaleType} onChange={(e) => setColorScaleType(e.target.value)}>
          <option value="interpolateCool">Cool</option>
          <option value="interpolateWarm">Warm</option>
          <option value="interpolatePlasma">Plasma</option>
          <option value="interpolateViridis">Viridis</option>
          <option value="interpolateInferno">Inferno</option>
        </select>
      </label>
      <div id="heatmap"></div>
    </div>
  );
};

const App = () => {
  const rawData = `
    ,ABV59991.1,GCA_900167205.1_00702,GCA_005121165.3_00523,GCA_900167205.1_00778
    ABV59991.1,100.0,14.0,17.8,15.1
    GCA_900167205.1_00702,14.0,100.0,39.5,10.7
    GCA_005121165.3_00523,17.8,39.5,100.0,9.6
    GCA_900167205.1_00778,15.1,10.7,9.6,100.0
  `;

  const parseCSV = (csv) =>
    csv
      .trim()
      .split("\n")
      .map((line) => line.split(",").map((val) => val.trim()));

  return <Heatmap matrixData={parseCSV(rawData)} />;
};

export default App;

