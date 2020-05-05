require("dotenv").load();

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const SmsProxy = require("./SmsProxy");

const app = express();
const smsProxy = new SmsProxy();

let users = Array();

app.use(express.static("public"));

app.use(
  session({
    secret: "loadsofrandomstuff",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");

app.get("/", (req, res) => {
  /*
        If there is a session for the user, the `index.html`
        page will display the number that was used to log
        in. If not, it will prompt them to log in.
    */
  if (!req.session.user) {
    res.render("index", {
      brand: smsProxy.brand,
    });
  } else {
    res.render("index", {
      number: req.session.user.number,
      brand: smsProxy.brand,
    });
  }
});

app.get("/login", (req, res) => {
  // Display the login page
  res.render("login");
});

app.post("/verify", async (req, res) => {
  // Start the verification process
  const user = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    number: req.body.number,
    role: req.body.role,
  };

  try {
    const result = await smsProxy.requestCode(user.number);
    user.verifyRequestId = result;

    // saves the user
    users.push(user);
    console.log(`request_id: ${user.verifyRequestId}`);
    /* 
        Redirect to page where the user can 
        enter the code that they received
     */
    res.render("entercode", {
      requestid: user.verifyRequestId,
    });
  } catch (err) {
    console.error(err);
  }
});

app.post("/check-code", async (req, res) => {
  // Check the code provided by the user
  const user = users.filter(
    (user) => user.verifyRequestId === req.body.requestid
  )[0];

  try {
    const result = await smsProxy.checkVerificationCode(
      req.body.requestid,
      req.body.code
    );
    if (result.status == 0) {
      /* 
                  User provided correct code,
                  so create a session for that user
              */
      req.session.user = {
        number: user.number,
      };
    }
    res.redirect("/");
  } catch (err) {
    console.error(err);
  }
});

app.get("/logout", (req, res) => {
  users = users.filter((user) => user.number != req.session.user.number);
  req.session.destroy();
  res.redirect("/");
});

app.post("/chat", (req, res) => {
  const userANumber = req.body.userANumber;
  const userBNumber = req.body.userBNumber;

  smsProxy.createChat(userANumber, userBNumber, (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json(result);
    }
  });
  res.send("OK");
});

app.get("/webhooks/inbound-sms", (req, res) => {
  const from = req.query.msisdn;
  const to = req.query.to;
  const text = req.query.text;

  console.log("got message from", from);

  // Route virtual number to real number
  smsProxy.proxySms(from, text);

  res.sendStatus(204);
});

const server = app.listen(3000, () => {
  console.log(`Server running on port ${server.address().port}`);
});
