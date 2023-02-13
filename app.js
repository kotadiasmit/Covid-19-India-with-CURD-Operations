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

//Returns a district based on the district ID//
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district
    WHERE district_id=${districtId}`;
  const district = await db.get(getDistrictQuery);

  let camelCaseDistrict = {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
  response.send(camelCaseDistrict);
});

//Delete district from district table based on district ID//
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    DELETE FROM district
    WHERE district_id=${districtId}`;
  const district = await db.run(getDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDistrictDetail = request.body;
  console.log(updateDistrictDetail);
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = updateDistrictDetail;

  const updateDistrictDetailQuery = `
   UPDATE district
   SET district_name='${districtName}', 
    state_id=${stateId}, 
    cases=${cases}, 
    cured=${cured}, 
    active=${active}, 
    deaths=${deaths}
   WHERE district_id=${districtId}`;

  const updatedDistrictDetail = await db.run(updateDistrictDetailQuery);
  response.send("District Details Updated");
});

//Return statistics of total cases, cured, active, deaths of a specific state based on state ID//
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalStatisticsQuery = `
    SELECT 
        SUM(cases) as totalCases, 
        SUM(cured) as totalCured, 
        SUM(active) as totalActive, 
        SUM(deaths) as totalDeaths
    FROM district
    WHERE state_id=${stateId}`;
  const totalStatistics = await db.get(totalStatisticsQuery);
  console.log(totalStatistics);
  response.send(totalStatistics);
});

//Return an object containing state name of a district based on district ID//
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `
    SELECT state_name as stateName
    FROM district NATURAL JOIN state
    WHERE district_id=${districtId}`;
  const stateName = await db.get(stateNameQuery);
  console.log(stateName);
  response.send(stateName);
});
module.exports = app;
