const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
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

initializeDBAndServer();

// Register User
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const findUserQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(findUserQuery);

  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const insertQuery = `INSERT INTO user(username,name,password,gender,location) 
        VALUES("${username}","${name}","${hashedPassword}","${gender}","${location}");`;
      await db.run(insertQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

// Login User
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const findUserQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(findUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const findUserQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const dbUser = await db.get(findUserQuery);
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);

  if (isPasswordMatched === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (isPasswordMatched === true && newPassword.length < 5) {
      response.send(400);
      response.send("Password is too short");
    } else if (isPasswordMatched === true && newPassword.length >= 5) {
      const modifiedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `UPDATE user SET password = "${modifiedPassword}" WHERE username = "${username}";`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
