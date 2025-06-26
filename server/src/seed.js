const dotenv = require("dotenv");
const database = require("./utilities/database");
dotenv.config();

function makeObject(headers, row) {
  const newObject = {};
  for (let index = 0; index < headers.length; index++) {
    newObject[headers[index]] = row[index];
  }
  return newObject;
}

async function seeding(url) {
  const response = await fetch(url);
  const data = await response.text();
  const rawDatasetCSV = data.split("\n");
  const headers = rawDatasetCSV[0].split(",").map((s) => s.replace(/\r/g, ""));
  rawDatasetCSV.slice(1).forEach((line) => {
    const updatedLine = line.split(",").map((s) => s.replace(/\r/g, ""));
    if (updatedLine[0] !== "") {
      database.create(database.TABLE_NAMES_ENUM.COMPANIES, makeObject(headers, updatedLine));
    }
  });
}

async function main() {
  while (process.env.VITE_ALPHA_VANTAGE_API == undefined) {
    0;
  }
  const tableCardinality = await database.tableCardinality(
    database.TABLE_NAMES_ENUM.COMPANIES,
  );
  if (tableCardinality !== 0) {
    return 0;
  } else {
    seeding(
      `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${process.env.VITE_ALPHA_VANTAGE_API}`,
    );
  }
}

main();
