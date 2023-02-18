const express = require("express");
var cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Show "hello" message in the home website.
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Show the JSON string in the /urls.json route.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Show “hello world" in the /hello route.
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Pass along the urlDatabase and username to the urls_index template.
app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

// Create new route to render the urls_new template.
app.get("/urls/new", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

// Make a post request to /urls.
app.post("/urls", (req, res) => {
  let randomId = generateRandomString();
  urlDatabase[randomId] = req.body.longURL;
  res.redirect(`/urls/${randomId}`);
});

// Create new route /urls/:id, the content will be shown when add the keyword id for searching.
app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id] 
  };
  res.render("urls_show", templateVars);
});

// Redirect any request to /u/:id to its longURL.
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// Delete a URL resource.
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Update new urls from edit page, and then go back to the main page.
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// Add a login route.
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

// Add a logout route.
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

// Create new route to render the urls_register template for registration page.
app.get("/register", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"]
  };
  res.render("urls_register", templateVars);
});

// Make a post request to /register, submiting email and password in the registration page.
app.post("/register", (req, res) => {
  let randomId = generateRandomString();
  req.body['id'] = randomId;
  users[randomId] = req.body;
  res.cookie("user_id", randomId);
  res.redirect("/urls");
});

// Show the port number in the terminal.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


// Generate a string of 6 random alphanumeric characters.
function generateRandomString() {
  let result = '';
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = 6; i > 0; i--) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};