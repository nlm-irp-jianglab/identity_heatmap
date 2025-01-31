import React, { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.css";
import CSVReader from "react-csv-reader";
import * as d3 from "d3";
import Draggable from "react-draggable";

const Heatmap = () => {
  const [matrixData, setMatrixData] = useState([]);
  const [renamed, setRenamed] = useState({});
  const [showUpper, setShowUpper] = useState(true);

  const [domainStart, setDomainStart] = useState(0);
  const [domainEnd, setDomainEnd] = useState(100);
  const [color1, setColor1] = useState("#08306b");
  const [color2, setColor2] = useState("#ffffff");

  const [fontSize, setFontSize] = useState(12);
  const [labelFontSize, setLabelFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState("Arial");

  // Heatmap dimensions
  const width = 360;
  const height = 360;
  const margin = { top: 50, right: 80, bottom: 120, left: 120 };

  // === CSV Loading ===
  const handleFileLoad = (data) => {
    const nonEmpty = data.filter((row) => row.some((cell) => cell !== ""));
    setMatrixData(nonEmpty);
  };

  // === Rename Logic ===
  const renameSequence = (original, newName) => {
    setRenamed((prev) => ({ ...prev, [original]: newName }));
  };

  // === Color Helpers ===
  const getColorScale = useCallback(() => {
    return d3.scaleLinear().domain([domainStart, domainEnd]).range([color1, color2]);
  }, [domainStart, domainEnd, color1, color2]);

  const getTextColor = (bgColor) => {
    const color = d3.color(bgColor);
    if (!color) return "black";
    const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    return luminance > 150 ? "black" : "white";
  };

  // === Draw Heatmap ===
  const drawHeatmap = useCallback(() => {
    d3.select("#heatmap").selectAll("*").remove();
    d3.select("#legend-svg").selectAll("*").remove();

    if (!matrixData.length || matrixData.length < 2) return;

    const labels = matrixData[0].slice(1).map((seq) => renamed[seq] || seq);
    const values = matrixData.slice(1).map((row) => row.slice(1).map(Number));

    // Main SVG
    const svg = d3
      .select("#heatmap")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand().range([0, width]).domain(labels).padding(0.05);
    const y = d3.scaleBand().range([0, height]).domain(labels).padding(0.05);
    const colorScale = getColorScale();

    // Flatten matrix into cell data
    const cellsData = values.flatMap((row, i) =>
      row.map((val, j) => ({
        xLabel: labels[j],
        yLabel: labels[i],
        value: val,
        i,
        j,
      }))
    );

    // Filter upper/lower triangle
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
      .attr("transform", (d) => `rotate(45, ${x(d) + x.bandwidth() / 2}, ${height + 40})`)
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

    // =========== Legend ===========
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
    fontSize,
    labelFontSize,
    fontFamily,
    getColorScale,
    height,
    width,
    margin
  ]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  // === Download Heatmap + Legend as single SVG *exactly as displayed* ===
  const downloadSVG = () => {
    // 1) Grab the on-screen SVG elements
    const heatmapSvg = document.querySelector("#heatmap svg");
    const legendContainer = document.getElementById("legend-container");
    const legendSvg = document.getElementById("legend-svg");

    if (!heatmapSvg || !legendSvg || !legendContainer) return;

    // 2) Clone both
    const heatmapClone = heatmapSvg.cloneNode(true);
    const legendClone = legendSvg.cloneNode(true);

    // 3) Get their bounding boxes in the browser
    //    This lets us calculate how far the legend was dragged relative to the heatmap
    const heatmapRect = heatmapSvg.getBoundingClientRect();
    const legendRect = legendContainer.getBoundingClientRect();

    // Relative offsets
    const offsetX = legendRect.left - heatmapRect.left;
    const offsetY = legendRect.top - heatmapRect.top;

    // We'll figure out how big the final <svg> must be to show both
    // The heatmap might be, for example, 600x530, plus we must account for how far the legend is dragged
    const finalWidth = Math.max(
      heatmapRect.width,
      offsetX + legendRect.width
    );
    const finalHeight = Math.max(
      heatmapRect.height,
      offsetY + legendRect.height
    );

    // 4) Create a brand new <svg> in memory
    const finalSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    finalSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    finalSvg.setAttribute("width", Math.ceil(finalWidth));
    finalSvg.setAttribute("height", Math.ceil(finalHeight));

    // 5) Append the heatmap at (0,0)
    finalSvg.appendChild(heatmapClone);

    // 6) Put the legend in the same relative position it is on-screen
    legendClone.setAttribute("x", offsetX);
    legendClone.setAttribute("y", offsetY);
    finalSvg.appendChild(legendClone);

    // 7) Serialize & Download
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

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Pairwise Identity Heatmap</h2>

      <div className="row">
        {/* Left Column (Controls & Renaming) */}
        <div className="col-md-4">
          {/* Domain Start / End */}
          <div className="row mb-2">
            <div className="col">
              <label className="form-label">Domain Start</label>
              <input
                type="number"
                className="form-control"
                value={domainStart}
                onChange={(e) => setDomainStart(Number(e.target.value))}
              />
            </div>
            <div className="col">
              <label className="form-label">Domain End</label>
              <input
                type="number"
                className="form-control"
                value={domainEnd}
                onChange={(e) => setDomainEnd(Number(e.target.value))}
              />
            </div>
          </div>

          <hr />

          {/* Color 1 / Color 2 */}
          <div className="row mb-2">
            <div className="col d-flex align-items-center">
              <label className="form-label me-2">Color Start</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
              />
            </div>

            <div className="col d-flex align-items-center">
              <label className="form-label me-2">Color End</label>
              <input
                type="color"
                className="form-control form-control-color"
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
              />
            </div>
          </div>

          <hr />

          {/* Font Size / Label Font Size / Font Family */}
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Font Size</label>
              <input
                type="number"
                className="form-control"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>
            <div className="col">
              <label className="form-label">Label Size</label>
              <input
                type="number"
                className="form-control"
                value={labelFontSize}
                onChange={(e) => setLabelFontSize(Number(e.target.value))}
              />
            </div>
            <div className="col">
              <label className="form-label">Font Family</label>
              <select
                className="form-select"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>
          </div>

          <hr />

          {/* Toggle & Download */}
          <div className="row mb-3">
            <div className="col d-flex">
              <button
                className="btn btn-secondary me-2"
                onClick={() => setShowUpper(!showUpper)}
              >
                Toggle Upper/Lower Triangular
              </button>
              <button className="btn btn-primary" onClick={downloadSVG}>
                Download SVG
              </button>
            </div>
          </div>

          <hr />

          {/* Rename Rows & Columns */}
          {matrixData.length > 0 && (
            <div className="mb-3">
              <h5>Rename Rows & Columns</h5>
              {matrixData[0].slice(1).map((seq, i) => (
                <div key={i} className="mb-1 d-flex align-items-center">
                  <label className="me-1">{seq}→</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ maxWidth: "300px" }}
                    value={renamed[seq] || seq}
                    onChange={(e) => renameSequence(seq, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (Upload & Heatmap) */}
        <div
          className="col-md-8"
          style={{
            top: "10px",
            right: "10px",
            background: "white",
            padding: "5px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        >
          {/* CSV Upload */}
          <div className="mb-3">
            <CSVReader onFileLoaded={handleFileLoad} />
          </div>

          {/* Heatmap */}
          <div id="heatmap"></div>
        </div>
      </div>

      {/* Show legend ONLY AFTER data is loaded */}
      {matrixData.length > 0 && (
        <Draggable>
          <div
            id="legend-container"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "white",
              padding: "5px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          >
            <h5>Legend</h5>
            <svg id="legend-svg"></svg>
          </div>
        </Draggable>
      )}
    </div>
  );
};

export default Heatmap;
