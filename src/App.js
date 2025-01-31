import React from "react";
import Heatmap from "./Heatmap";

function App() {
  const rawData = `
    ,ABV59991.1,GCA_900167205.1_00702,GCA_005121165.3_00523,GCA_900167205.1_00778
    ABV59991.1,100.0,14.0,17.8,15.1
    GCA_900167205.1_00702,14.0,100.0,39.5,10.7
    GCA_005121165.3_00523,17.8,39.5,100.0,9.6
    GCA_900167205.1_00778,15.1,10.7,9.6,100.0
  `;

  const parseCSV = (csv) =>
    csv.trim().split("\n").map((line) => line.split(",").map((val) => val.trim()));

  return <Heatmap matrixData={parseCSV(rawData)} />;
}

export default App;
