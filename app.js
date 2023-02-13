const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running on http:/localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//Return a list of all states in the state table//
app.get("/states/", async (request, response) => {
  const allStateNameQuery = `
    SELECT * FROM state`;
  const allStateName = await db.all(allStateNameQuery);
  console.log(allStateName);
  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  camelCaseResult = [];
  let camelCaseOutput = allStateName.map((each) =>
    camelCaseResult.push(convertDbObjectToResponseObject(each))
  );
  response.send(camelCaseResult);
});

//Return a state based on the state ID//
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state
    WHERE state_id=${stateId}`;
  const state = await db.get(getStateQuery);

  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  });
});

//Create district in district table,`district_id` is auto-incremented//
app.post("/districts/", async (request, response) => {
  const addDistrictDetail = request.body;
  console.log(addDistrictDetail);
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = addDistrictDetail;

  const addDistrictQuery = `
  INSERT INTO 
  district(district_name, state_id, cases, cured, active, deaths)
  VALUES
  ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})`;

  const addedDistrictDetail = await db.run(addDistrictQuery);
  const districtId = addedDistrictDetail.lastId;
  response.send("District Successfully Added");
});
module.exports = app;
