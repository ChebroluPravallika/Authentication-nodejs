const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "userData.db");
const app = express();

const bcrypt = require("bcrypt");
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: databasePath, driver: sqlite3.Database });
    app.listen(3001, () => {
      console.log("Server is running on http://localhost:3001");
    });
  } catch (error) {
    console.log(`Data base error is ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();
console.log("hi");

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT username FROM user WHERE username = '${username}';`;
  const user = await db.get(selectUserQuery);

  if (user === undefined) {
    if (password.length >= 5) {
      const data = `insert into user values('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(data);
      response.status = 200;
      response.send("User created successfully");
    } else {
      response.status = 400;
      response.send("Password is too short");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query = `select * from user where username = ${username};`;
  const user = await db.get(query);
  if (user === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (isPasswordMatched) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserQuery = `select * from user where username = '${username}';`;
  const userDetails = await db.get(checkUserQuery);
  if (userDetails !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (isPasswordValid) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `update user set 
        password = '${hashedPassword}' where username = '${username}';`;
        const updatePasswordResponse = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } else {
    response.status(400);
    response.send(`Invalid user`);
  }
});

module.exports = app;
