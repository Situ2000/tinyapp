const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// Pass along the urlDatabase to the urls_index template.
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Create new route to render the urls_new template.
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Create new route /urls/:id, the content will be shown when add the keyword id for searching.
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
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