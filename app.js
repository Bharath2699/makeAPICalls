const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// return a list of all states in the states table

app.get("/states/", async (request, response) => {
  const getStates = `
    SELECT * FROM state`;
  const data = await db.all(getStates);
  const updatedData = data.map((each) => ({
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  }));
  response.send(updatedData);
});
module.exports = app;

// return a state based stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStates = `
    SELECT * FROM state WHERE state_id=${stateId};`;

  const data = await db.get(getStates);
  const updatedData = {
    stateId: data.state_id,
    stateName: data.state_name,
    population: data.population,
  };
  response.send(updatedData);
});
module.exports = app;

//create a district in district table

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrict = `
    INSERT INTO district
    (district_name,state_id,cases,cured,active,deaths)
    VALUES (
        "${districtName}",
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
        );`;
  const data = await db.run(postDistrict);
  response.send("District Successfully Added");
});
module.exports = app;

// return a district based on districtId

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
    SELECT * FROM district WHERE district_id=${districtId};`;
  const data = await db.get(getDistrict);
  const updatedData = {
    districtId: data.district_id,
    districtName: data.district_name,
    stateId: data.state_id,
    cases: data.cases,
    cured: data.cured,
    active: data.active,
    deaths: data.deaths,
  };
  response.send(updatedData);
});
module.exports = app;

// delete a district based on districtId

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE From district WHERE district_id=${districtId};`;

  await db.run(deleteDistrict);
  response.send("District Removed");
});
module.exports = app;

// update a district based on districtId

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = `
    UPDATE district 
    SET
    district_name="${districtName}",
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE 
    district_id=${districtId};
    `;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});
module.exports = app;

// return an object contained stateName based on districtId

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `
    SELECT state_name FROM state NATURAL JOIN district WHERE district_id=${districtId};`;

  const data = await db.get(getStateName);
  const updatedData = { stateName: data.state_name };
  response.send(updatedData);
});
module.exports = app;

// return total cases,cured,active cases and deaths based on stateId

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalStats = `
    SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) AS totalDeaths
    FROM district 
    WHERE state_id=${stateId};`;

  const data = await db.get(totalStats);
  response.send(data);
});
module.exports = app;
