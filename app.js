const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const databasePath = path.join(__dirname, "twitterClone.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
///api1

const validatePassword = (password) => {
  return password.length > 5;
};

app.post("/register/", async (request, response) => {
  const { username, password, gender, name } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);

  if (databaseUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username,password,name,gender)
     VALUES
      (
       '${username}',
       '${hashedPassword}',
       '${name}',
       '${gender}'
        
      );`;
    if (validatePassword(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//api2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

/// middlewarefn

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

///api 3
app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const query = `select username,tweet,date_time as dateTime from user join tweet 
   on user.user_id=tweet.user_id where user_id=${feed} order by date_time limit 4 `;

  const rew = await db.all(query);

  response.send(rew);
});

///api4
app.get("/user/following/", authenticateToken, async (request, response) => {
  const query = `select name from user natural join follower 
                 where  user_id=following_user_id;`;

  const res = await db.all(query);
  response.send(res);
});

/// api5

app.get("/user/followers/", authenticateToken, async (request, response) => {});

///api6

app.get(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {}
);

///api7

app.get(
  "/tweets/:tweetId/likes/",
  authenticateToken,
  async (request, response) => {}
);

///api8

app.get(
  "/tweets/:tweetId/replies/",
  authenticateToken,
  async (request, response) => {}
);

///api9

app.get("/user/tweets/", authenticateToken, async (request, response) => {});

/// api 10

app.post("/user/tweets/", authenticateToken, async (request, response) => {
  const { tweet } = request.body;
  const query = `insert into tweet (tweet) values ('${tweet}');`;
  await db.run(query);
  response.send("Created a Tweet");
});
/// api 11

app.delete(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const qq = `delete from tweet where tweet_id=${tweetId};`;
    await db.run(qq);
    response.send("Tweet Removed");
  }
);

module.exports = app;
