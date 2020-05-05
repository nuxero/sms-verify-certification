require("dotenv").load();

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const SmsProxy = require("./SmsProxy");

const app = express();
const smsProxy = new SmsProxy();

let drivers = [];
let users = [];

let verifyRequestId = null;
let verifyRequestNumber = null;

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
  verifyRequestNumber = req.body.number;
  try {
    const result = await smsProxy.requestCode(verifyRequestNumber);
    verifyRequestId = result;
    console.log(`request_id: ${verifyRequestId}`);
    /* 
        Redirect to page where the user can 
        enter the code that they received
     */
    res.render("entercode");
  } catch (err) {
    console.error(err);
  }
});

app.post("/check-code", async (req, res) => {
  // Check the code provided by the user
  try {
    const result = await smsProxy.checkVerificationCode(
      verifyRequestId,
      req.body.code
    );
    if (result.status == 0) {
      /* 
                  User provided correct code,
                  so create a session for that user
              */
      req.session.user = {
        number: verifyRequestNumber,
      };
    }
    res.redirect("/");
  } catch (err) {
    console.error(err);
  }
});

app.get("/logout", (req, res) => {
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
