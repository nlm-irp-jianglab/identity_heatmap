import React, { useState, useEffect, useCallback } from 'react';
import CSVReader from 'react-csv-reader';
import * as d3 from 'd3';
import Draggable from 'react-draggable';

const Heatmap = () => {
  const [matrixData, setMatrixData] = useState([]);
  const [renamed, setRenamed] = useState({});
  const [showUpper, setShowUpper] = useState(true);

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

  // =============== CSV Data Loading ===============
  const handleFileLoad = (data) => {
    // Filter out empty rows
    const nonEmpty = data.filter((row) => row.some((cell) => cell !== ""));
    setMatrixData(nonEmpty);
  };

  // =============== Name Renaming Logic ===============
  const renameSequence = (original, newName) => {
    setRenamed((prev) => ({ ...prev, [original]: newName }));
  };

  // =============== Color Scale and Text Color ===============
  const getColorScale = useCallback(() => {
    return d3
      .scaleLinear()
      .domain([domainStart, domainEnd])
      .range([color1, color2]);
  }, [domainStart, domainEnd, color1, color2]);

  const getTextColor = (bgColor) => {
    const color = d3.color(bgColor);
    if (!color) return "black";
    const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    return luminance > 150 ? "black" : "white";
  };

  // =============== Main Heatmap Drawing ===============
  const drawHeatmap = useCallback(() => {
    // Clear previous render
    d3.select("#heatmap").selectAll("*").remove();
    d3.select("#legend-svg").selectAll("*").remove();

    if (!matrixData.length || matrixData.length < 2) return;

    // First row has the sequence IDs (excluding the first cell)
    const labels = matrixData[0].slice(1).map((seq) => renamed[seq] || seq);
    const values = matrixData.slice(1).map((row) => row.slice(1).map(Number));

    // Create the main SVG for the heatmap
    const svg = d3
      .select("#heatmap")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    // 'g' that actually holds the heatmap
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define scales
    const x = d3.scaleBand().range([0, width]).domain(labels).padding(0.05);
    const y = d3.scaleBand().range([0, height]).domain(labels).padding(0.05);
    const colorScale = getColorScale();

    // Flatten values to build cell data
    const cellsData = values.flatMap((row, i) =>
      row.map((val, j) => ({
        xLabel: labels[j],
        yLabel: labels[i],
        value: val,
        i,
        j,
      }))
    );

    // Filter for upper or lower triangle
    const filteredCells = cellsData.filter((d) =>
      showUpper ? d.i <= d.j : d.i >= d.j
    );

    // Rectangles
    g.selectAll(".cell")
      .data(filteredCells)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.xLabel))
      .attr("y", (d) => y(d.yLabel))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d) => colorScale(d.value))
      .style("stroke", "#fff");

    // Text labels
    g.selectAll(".cell-text")
      .data(filteredCells)
      .enter()
      .append("text")
      .attr("x", (d) => x(d.xLabel) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.yLabel) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", fontSize)
      .attr("font-family", fontFamily)
      .attr("fill", (d) => getTextColor(colorScale(d.value)))
      .text((d) => d.value.toFixed(1));

    // X-axis labels
    g.selectAll(".x-label")
      .data(labels)
      .enter()
      .append("text")
      .attr("x", (d) => x(d) + x.bandwidth() / 2)
      .attr("y", height + 40)
      .attr(
        "transform",
        (d) => `rotate(45, ${x(d) + x.bandwidth() / 2}, ${height + 40})`
      )
      .attr("text-anchor", "middle")
      .attr("font-size", labelFontSize)
      .attr("font-family", fontFamily)
      .text((d) => d);

    // Y-axis labels
    g.selectAll(".y-label")
      .data(labels)
      .enter()
      .append("text")
      .attr("x", -10)
      .attr("y", (d) => y(d) + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("font-size", labelFontSize)
      .attr("font-family", fontFamily)
      .text((d) => d);

    // =============== Legend (Drawn into #legend-svg) ===============
    const legendSvg = d3.select("#legend-svg").attr("width", 80).attr("height", 250);

    const legendScale = d3
      .scaleLinear()
      .domain([domainStart, domainEnd])
      .range([200, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);

    legendSvg.append("g").attr("transform", "translate(50,20)").call(legendAxis);

    legendSvg
      .selectAll("rect")
      .data(d3.range(domainStart, domainEnd, (domainEnd - domainStart) / 100))
      .enter()
      .append("rect")
      .attr("x", 30)
      .attr("y", (d) => legendScale(d) + 20)
      .attr("width", 20)
      .attr("height", 2)
      .style("fill", (d) => colorScale(d));
  }, [
    matrixData,
    renamed,
    showUpper,
    domainStart,
    domainEnd,
    color1,
    color2,
    fontSize,
    labelFontSize,
    fontFamily,
    getColorScale,
  ]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  // =============== Download Single SVG (Heatmap + Legend) ===============
  const downloadSVG = () => {
    // 1) Grab the heatmap SVG (the one we drew into #heatmap)
    const heatmapSvg = document.querySelector("#heatmap svg");
    if (!heatmapSvg) return;

    // 2) Grab the legend SVG (the one in #legend-svg)
    const legendSvg = document.getElementById("legend-svg");
    if (!legendSvg) return;

    // --- Clone both ---
    const heatmapClone = heatmapSvg.cloneNode(true);
    const legendClone = legendSvg.cloneNode(true);

    // 3) Create a brand new <svg> to hold them both
    // Adjust width/height as needed to fit your combined figure
    const combinedWidth = 600;
    const combinedHeight = 600;

    const finalSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    finalSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    finalSvg.setAttribute("width", combinedWidth);
    finalSvg.setAttribute("height", combinedHeight);

    // 4) Place the heatmap at (0,0) in the new SVG
    //    (Optionally adjust transforms, etc.)
    finalSvg.appendChild(heatmapClone);

    // 5) Position the legend next to it
    //    We'll set an x/y or a transform on the <svg> node
    legendClone.setAttribute("x", "520"); 
    legendClone.setAttribute("y", "10"); 
    finalSvg.appendChild(legendClone);

    // 6) Serialize and download
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(finalSvg);

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "heatmap_with_legend.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // =============== Render JSX ===============
  return (
    <div>
      <h2>Pairwise Identity Heatmap</h2>
      <CSVReader onFileLoaded={handleFileLoad} />

      {/* Controls */}
      <div style={{ margin: "1em 0" }}>
        <label style={{ marginRight: "1em" }}>
          Domain Start:
          <input
            type="number"
            value={domainStart}
            onChange={(e) => setDomainStart(Number(e.target.value))}
          />
        </label>

        <label style={{ marginRight: "1em" }}>
          Domain End:
          <input
            type="number"
            value={domainEnd}
            onChange={(e) => setDomainEnd(Number(e.target.value))}
          />
        </label>

        <label style={{ marginRight: "1em" }}>
          Color 1:
          <input
            type="color"
            value={color1}
            onChange={(e) => setColor1(e.target.value)}
          />
        </label>

        <label style={{ marginRight: "1em" }}>
          Color 2:
          <input
            type="color"
            value={color2}
            onChange={(e) => setColor2(e.target.value)}
          />
        </label>

        <label style={{ marginRight: "1em" }}>
          Font Size:
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </label>

        <label style={{ marginRight: "1em" }}>
          Label Font Size:
          <input
            type="number"
            value={labelFontSize}
            onChange={(e) => setLabelFontSize(Number(e.target.value))}
          />
        </label>

        <label style={{ marginRight: "1em" }}>
          Font Family:
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </label>
      </div>

      <button onClick={downloadSVG}>Download Combined SVG</button>

      {/* Rename Rows & Columns */}
      {matrixData.length > 0 && (
        <div style={{ margin: "1em 0" }}>
          <h3>Rename Rows & Columns</h3>
          {matrixData[0].slice(1).map((seq, i) => (
            <div key={i} style={{ marginBottom: "0.5em" }}>
              <label>{seq} → </label>
              <input
                type="text"
                value={renamed[seq] || seq}
                onChange={(e) => renameSequence(seq, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowUpper(!showUpper)}>
        Toggle Upper/Lower Triangular View
      </button>

      {/* Heatmap Container (drawn into #heatmap > svg via D3) */}
      <div id="heatmap" />

      {/* Draggable Legend + Download Button */}
      <Draggable>
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "white",
            padding: "5px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
          id="legend-container"
        >
          <h4>Legend</h4>
          <svg id="legend-svg" />
        </div>
      </Draggable>
    </div>
  );
};

export default Heatmap;


