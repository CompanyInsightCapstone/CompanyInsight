const dotenv = require("dotenv");
const database = require("./utilities/database");
dotenv.config();

/**
 * makeObject creates an object from the headers and the row
 * @param {*} headers - headers of the table
 * @param {*} row - row of the table
 *
 */
function makeObject(headers, row) {
  const newObject = {};
  headers.reduce((acc, header, index) => {
    acc[header] = row[index];
  }, newObject);
  return newObject;
}
/**
 * Async function to seed the database with the companies from the Alpha Vantage API
 * @param {*} url - url of the API to fetch from
 */
async function seeding(url) {
  const response = await fetch(url);
  const data = await response.text();
  const rawDatasetCSV = data.split("\n");
  const headers = rawDatasetCSV[0].split(",").map((s) => s.replace(/\r/g, ""));
  rawDatasetCSV.slice(1).forEach((line) => {
    const updatedLine = line.split(",").map((s) => s.replace(/\r/g, ""));
    if (updatedLine[0] !== "") {
      database.create(
        database.TABLE_NAMES_ENUM.COMPANIES,
        makeObject(headers, updatedLine),
      );
    }
  });
}

const main = async () => {
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
};

main();
