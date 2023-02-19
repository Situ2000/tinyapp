const express = require("express");
var cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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
  if (!req.cookies["user_id"]) {
    return res.status(401).send("Only registered users can access their URLs");
  } 
  const templateVars = { 
    user_id: req.cookies["user_id"],
    urls: urlsForUser(req.cookies["user_id"], urlDatabase)
  };
  res.render("urls_index", templateVars);
});

// Create new route to render the urls_new template.
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } 
  const templateVars = { 
    user_id: req.cookies["user_id"]
  } 
  res.render("urls_new", templateVars);
});

// Make a post request to /urls.
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(401).send("Only registered users can shorten URLs");
  } 
  let randomId = generateRandomString();
  urlDatabase[randomId] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  }
  res.redirect(`/urls/${randomId}`);
});

// Create new route /urls/:id, the content will be shown when add the keyword id for searching.
app.get("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(401).send("Only registered users can access and edit their URLs");
  }
  
  const URL = urlDatabase[req.params.id];
  if (URL.userID !== req.cookies["user_id"]) {
    return res.status(401).send("Users can only access and edit their own URLs");
  }
  const templateVars = { 
    user_id: req.cookies["user_id"],
    id: req.params.id, 
    longURL: URL['longURL']
  }
  res.render("urls_show", templateVars);
});

// Redirect any request to /u/:id to its longURL.
app.get("/u/:id", (req, res) => {
  if (req.params.id === 'undefined') {
    return res.status(404).send("The short URl does not exist");
  }
  const longURL = urlDatabase[req.params.id]['longURL'];
  res.redirect(longURL);
});

// Delete a URL resource.
app.post("/urls/:id/delete", (req, res) => {
  let URL = urlDatabase[req.params.id];
  if (req.params.id === 'undefined') {
    return res.status(404).send("The short URl does not exist");
  }
  if (!req.cookies["user_id"]) {
    return res.status(401).send("Only registered users can delete their URLs");
   }
  if (URL.userID !== req.cookies["user_id"]) {
    return res.status(401).send("Users can only delete their own URLs");
  }
    
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Update new urls from edit page, and then go back to the main page.
app.post("/urls/:id", (req, res) => {
  let URL = urlDatabase[req.params.id];
  if (req.params.id === 'undefined') {
    return res.status(404).send("The short URl does not exist");
  } 
  if (!req.cookies["user_id"]) {
    return res.status(401).send("Only registered users can access and edit their URLs");
  } 
  if (URL.userID !== req.cookies["user_id"]) {
    return res.status(401).send("Users can only access and edit their own URLs");
  }
    
  URL['longURL'] = req.body.longURL;
  res.redirect("/urls");
});

// Create new route to render the urls_register template for registration page.
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    const templateVars = { 
      user_id: req.cookies["user_id"]
    };
    res.render("urls_register", templateVars);
  }
});

// Make a post request to /register, submiting email and password in the registration page.
app.post("/register", (req, res) => {
  let result = getUserByEmail(req.body, users);
  if (!result) {
    return res.status(404).send("User does not exist or has been registered");
  }

  const randomId = generateRandomString();
  users[randomId] = {
    id: randomId,
    email: req.body.email,
    password: req.body.password
  };
  // req.body['id'] = randomId;
  // users[randomId] = req.body;
  res.cookie("user_id", randomId);
  res.redirect("/urls");
});

// Create new route to render the urls_login template for log-in page.
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
  const templateVars = { 
    user_id: req.cookies["user_id"]
  };
  res.render("urls_login", templateVars);
  }
});

// Make a post request to /login, submiting email and password in the log-in page.
app.post("/login", (req, res) => {
  let result = getUserByEmail(req.body, users);
  if (result) {
    return res.status(403).send("User cannot be found");
  }

  for (key in users) {
    if (req.body['email'] === users[key]['email'] && req.body['password'] === users[key]['password']) {
      res.cookie("user_id", key);
      return res.redirect("/urls");
    }
  }

  return res.status(403).send("The password is not matched");
});

// Add a logout route.
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
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

// Check whether register information empty or repeated.
function getUserByEmail(newObj, objCollection) {
  for (key in objCollection) {
    if (newObj['email'] === objCollection[key]['email']) {
      return null;
    }
  }

  if (newObj['email'] === '' || newObj['password'] === '') {
    return null;
  } else {
    return objCollection;
  } 
};

// Comparing the userID in the urlDatabase with the logged-in user's ID from their cookie.
function urlsForUser(id, database) {
  let result = {};
  for (let key in database) {
    if (database[key]['userID'] === id) {
      result[key] = database[key];
    }
  }
  return result;
};