import React, { useState, useEffect, useCallback, useRef } from "react";
import "bootstrap/dist/css/bootstrap.css";
import CSVReader from "react-csv-reader";
import * as d3 from "d3";
import Draggable from "react-draggable";

const Heatmap = () => {
  const [matrixData, setMatrixData] = useState([]);
  const [sequenceOrder, setSequenceOrder] = useState([]); // Single order for rows & columns
  const [renamed, setRenamed] = useState({});
  const [showUpper, setShowUpper] = useState(true);

  // Domain, Colors
  const [domainStart, setDomainStart] = useState(0);
  const [domainEnd, setDomainEnd] = useState(100);
  const [color1, setColor1] = useState("#08306b");
  const [color2, setColor2] = useState("#ffffff");

  // Text styles
  const [fontSize, setFontSize] = useState(12);
  const [labelFontSize, setLabelFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState("Arial");

  // === NEW: Let users specify heatmap size (with default 360) ===
  const [heatmapWidth, setHeatmapWidth] = useState(360);
  const [heatmapHeight, setHeatmapHeight] = useState(360);

  // Margins
  const margin = { top: 50, right: 80, bottom: 120, left: 120 };

  // ====== CSV Loading ======
  const handleFileLoad = (data) => {
    // Remove empty rows
    const nonEmpty = data.filter((row) => row.some((cell) => cell !== ""));
    setMatrixData(nonEmpty);

    if (nonEmpty.length > 1) {
      // For a symmetrical NxN matrix,
      // the top row (minus the top-left cell) are the labels
      const initialLabels = nonEmpty[0].slice(1);
      setSequenceOrder(initialLabels);
    }
  };

  // ====== Helper: rename logic ======
  const renameSequence = (original, newName) => {
    setRenamed((prev) => ({ ...prev, [original]: newName }));
  };

  // ====== Color scale & text color ======
  const getColorScale = useCallback(() => {
    return d3.scaleLinear().domain([domainStart, domainEnd]).range([color1, color2]);
  }, [domainStart, domainEnd, color1, color2]);

  const getTextColor = (bgColor) => {
    const color = d3.color(bgColor);
    if (!color) return "black";
    const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    return luminance > 150 ? "black" : "white";
  };

  // ====== Draw Heatmap ======
  const drawHeatmap = useCallback(() => {
    // Clear existing
    d3.select("#heatmap").selectAll("*").remove();
    d3.select("#legend-svg").selectAll("*").remove();

    if (!matrixData.length || sequenceOrder.length < 2) return;

    // Build a lookup from label -> index in matrixData
    const topRow = matrixData[0].slice(1); // all labels
    const labelToIndex = {};
    topRow.forEach((label, i) => {
      labelToIndex[label] = i + 1; // +1 because col 0 is the row labels
    });

    // Build color scale
    const colorScale = getColorScale();

    // Prepare main SVG
    const svg = d3
      .select("#heatmap")
      .append("svg")
      .attr("width", heatmapWidth + margin.left + margin.right)
      .attr("height", heatmapHeight + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // The display labels reflect renaming
    const displayLabels = sequenceOrder.map((lab) => renamed[lab] || lab);

    // Create scales based on user-specified width/height
    const x = d3
      .scaleBand()
      .range([0, heatmapWidth])
      .domain(displayLabels)
      .padding(0.05);

    const y = d3
      .scaleBand()
      .range([0, heatmapHeight])
      .domain(displayLabels)
      .padding(0.05);

    // Build cell data
    const cellsData = [];
    for (let i = 0; i < sequenceOrder.length; i++) {
      for (let j = 0; j < sequenceOrder.length; j++) {
        const rowLabel = sequenceOrder[i];
        const colLabel = sequenceOrder[j];
        const rowIndex = labelToIndex[rowLabel];
        const colIndex = labelToIndex[colLabel];
        if (rowIndex && colIndex) {
          const val = parseFloat(matrixData[rowIndex][colIndex]) || 0;
          cellsData.push({
            rowOriginal: rowLabel,
            colOriginal: colLabel,
            rowDisplay: renamed[rowLabel] || rowLabel,
            colDisplay: renamed[colLabel] || colLabel,
            value: val,
            i,
            j,
          });
        }
      }
    }

    // Filter for upper or lower triangle
    const filteredCells = cellsData.filter((d) =>
      showUpper ? d.i <= d.j : d.i >= d.j
    );

    // Rects
    g.selectAll(".cell")
      .data(filteredCells)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.colDisplay))
      .attr("y", (d) => y(d.rowDisplay))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d) => colorScale(d.value))
      .style("stroke", "#fff");

    // Text
    g.selectAll(".cell-text")
      .data(filteredCells)
      .enter()
      .append("text")
      .attr("x", (d) => x(d.colDisplay) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.rowDisplay) + y.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", fontSize)
      .attr("font-family", fontFamily)
      .attr("fill", (d) => getTextColor(colorScale(d.value)))
      .text((d) => d.value.toFixed(1));

    // X-axis labels
    g.selectAll(".x-label")
      .data(displayLabels)
      .enter()
      .append("text")
      .attr("x", (d) => x(d) + x.bandwidth() / 2)
      .attr("y", heatmapHeight + 40)
      .attr(
        "transform",
        (d) => `rotate(45, ${x(d) + x.bandwidth() / 2}, ${heatmapHeight + 40})`
      )
      .attr("text-anchor", "middle")
      .attr("font-size", labelFontSize)
      .attr("font-family", fontFamily)
      .text((d) => d);

    // Y-axis labels
    g.selectAll(".y-label")
      .data(displayLabels)
      .enter()
      .append("text")
      .attr("x", -10)
      .attr("y", (d) => y(d) + y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("font-size", labelFontSize)
      .attr("font-family", fontFamily)
      .text((d) => d);

    // Draw legend
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
    sequenceOrder,
    renamed,
    showUpper,
    domainStart,
    domainEnd,
    fontSize,
    labelFontSize,
    fontFamily,
    heatmapWidth,
    heatmapHeight,
    margin,
    getColorScale
  ]);

  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  // ====== Download logic (unchanged) ======
  const downloadSVG = () => {
    const heatmapSvg = document.querySelector("#heatmap svg");
    const legendContainer = document.getElementById("legend-container");
    const legendSvg = document.getElementById("legend-svg");
    if (!heatmapSvg || !legendSvg || !legendContainer) return;

    const heatmapRect = heatmapSvg.getBoundingClientRect();
    const legendRect = legendContainer.getBoundingClientRect();
    const offsetX = legendRect.left - heatmapRect.left;
    const offsetY = legendRect.top - heatmapRect.top;

    const finalWidth = Math.max(heatmapRect.width, offsetX + legendRect.width);
    const finalHeight = Math.max(heatmapRect.height, offsetY + legendRect.height);

    const finalSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    finalSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    finalSvg.setAttribute("width", Math.ceil(finalWidth));
    finalSvg.setAttribute("height", Math.ceil(finalHeight));

    // Clone
    const heatmapClone = heatmapSvg.cloneNode(true);
    const legendClone = legendSvg.cloneNode(true);

    // Place
    finalSvg.appendChild(heatmapClone);
    legendClone.setAttribute("x", offsetX);
    legendClone.setAttribute("y", offsetY);
    finalSvg.appendChild(legendClone);

    // Serialize & download
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

  // ====== Drag & Drop for single-order (optional, if you still want reordering) ======
  const draggingItemIndexRef = useRef(null);

  const handleDragStart = (index) => {
    draggingItemIndexRef.current = index;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const reorderList = (list, fromIndex, toIndex) => {
    const updated = [...list];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return updated;
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = draggingItemIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) return;
    const newOrder = reorderList(sequenceOrder, dragIndex, dropIndex);
    setSequenceOrder(newOrder);
    draggingItemIndexRef.current = null;
  };

  const SequenceOrderList = () => (
    <ul className="list-group" style={{ marginBottom: "1em" }}>
      {sequenceOrder.map((label, index) => {
        const displayName = renamed[label] || label;
        return (
          <li
            key={label}
            className="list-group-item"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            style={{ cursor: "move" }}
          >
            {displayName}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Pairwise Identity Heatmap (Single Order for Rows & Columns)</h2>

      <div className="row">
        {/* Left Column (Controls) */}
        <div className="col-md-4">
          {/* 1) Heatmap Dimensions */}
          <div className="row mb-2">
            <div className="col">
              <label className="form-label">Heatmap Width</label>
              <input
                type="number"
                className="form-control"
                value={heatmapWidth}
                onChange={(e) => setHeatmapWidth(Number(e.target.value))}
              />
            </div>
            <div className="col">
              <label className="form-label">Heatmap Height</label>
              <input
                type="number"
                className="form-control"
                value={heatmapHeight}
                onChange={(e) => setHeatmapHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <hr />

          {/* 2) Domain Start / End */}
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

          {/* 3) Color 1 / Color 2 */}
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

          {/* 4) Font Size / Label Font Size / Font Family */}
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

          {/* 5) Toggle & Download */}
          <div className="row mb-3">
            <div className="col d-flex">
              <button
                className="btn btn-secondary me-2"
                onClick={() => setShowUpper(!showUpper)}
              >
                Toggle Upper/Lower
              </button>
              <button className="btn btn-primary" onClick={downloadSVG}>
                Download SVG
              </button>
            </div>
          </div>

          <hr />

          {/* 6) Draggable Reorder for single sequenceOrder */}
          {sequenceOrder.length > 0 && (
            <>
              <h5>Reorder (Rows & Columns)</h5>
              <SequenceOrderList />
            </>
          )}

          <hr />

          {/* 7) Rename Items */}
          {sequenceOrder.length > 0 && (
            <div>
              <h5>Rename Sequences</h5>
              {sequenceOrder.map((label) => (
                <div key={label} className="mb-1 d-flex align-items-center">
                  <label className="me-1">{label} →</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ maxWidth: "300px" }}
                    value={renamed[label] || label}
                    onChange={(e) => renameSequence(label, e.target.value)}
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
      {sequenceOrder.length > 1 && (
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
