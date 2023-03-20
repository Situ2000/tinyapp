const express = require("express");
const cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");
const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers');
const { urlDatabase, users } = require('./database');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["lighthouse"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
// Reset the database each time after existing
app.use((req, res, next) => {
  const user = users[req.session.user_id];
  if (!user) {
    req.session.user_id = undefined;
  }
  next();
});



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
  if (!req.session["user_id"]) {
    return res.status(401).send("Only registered users can access their URLs");
  } 

  const user = users[req.session.user_id];
  if (!user) {
    return res.status(403).send("User is not found");
  }

  const templateVars = { 
    user_id: req.session["user_id"],
    username: user.email,
    urls: urlsForUser(req.session["user_id"], urlDatabase)
  };
  res.render("urls_index", templateVars);
});

// Create new route to render the urls_new template.
app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
  } 

  const templateVars = { 
    user_id: req.session["user_id"],
    username: users[req.session.user_id].email
  };
  res.render("urls_new", templateVars);
});

// Create new route /urls/:id, the content will be shown when add the keyword id for searching.
app.get("/urls/:id", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(401).send("Only registered users can access and edit their URLs");
  }
  
  const URL = urlDatabase[req.params.id];
  if (!URL) {
    return res.status(404).send("The short URL does not exist");
  }

  if (URL.userID !== req.session["user_id"]) {
    return res.status(401).send("Users can only access and edit their own URLs");
  }

  const templateVars = { 
    user_id: req.session["user_id"],
    username: users[req.session.user_id].email,
    id: req.params.id, 
    longURL: URL['longURL']
  };
  res.render("urls_show", templateVars);
});

// Redirect any request to /u/:id to its longURL.
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("The short URL does not exist");
  }

  const longURL = urlDatabase[req.params.id]['longURL'];
  res.redirect(longURL);
});

// Create new route to render the urls_register template for registration page.
app.get("/register", (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {
    const templateVars = { 
      user_id: req.session["user_id"],
    };
    res.render("urls_register", templateVars);
  }
});

// Create new route to render the urls_login template for log-in page.
app.get("/login", (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
  } else {
  const templateVars = { 
    user_id: req.session["user_id"],
  };
  res.render("urls_login", templateVars);
  }
});

// Make a post request to /urls.
app.post("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(401).send("Only registered users can shorten URLs");
  } 
  let randomId = generateRandomString();
  urlDatabase[randomId] = {
    longURL: req.body.longURL,
    userID: req.session["user_id"]
  };
  res.redirect(`/urls/${randomId}`);
});

// Delete a URL resource.
app.post("/urls/:id/delete", (req, res) => {
  let URL = urlDatabase[req.params.id];
  if (req.params.id === 'undefined') {
    return res.status(404).send("The short URl does not exist");
  }
  if (!req.session["user_id"]) {
    return res.status(401).send("Only registered users can delete their URLs");
   }
  if (URL.userID !== req.session["user_id"]) {
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
  if (!req.session["user_id"]) {
    return res.status(401).send("Only registered users can access and edit their URLs");
  } 
  if (URL.userID !== req.session["user_id"]) {
    return res.status(401).send("Users can only access and edit their own URLs");
  }
    
  URL['longURL'] = req.body.longURL;
  res.redirect("/urls");
});

// Make a post request to /register, submiting email and password in the registration page.
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send("Email or Password should be provided");
  }
  
  let result = getUserByEmail(req.body.email, users);
  if (result) {
    return res.status(400).send("User has been registered");
  }

  const randomId = generateRandomString();
  users[randomId] = {
    id: randomId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = randomId;
  res.redirect("/urls");
});

// Make a post request to /login, submiting email and password in the log-in page.
app.post("/login", (req, res) => {
  let result = getUserByEmail(req.body.email, users);
  if (!result) {
    return res.status(403).send("User cannot be found");
  }

  for (key in users) {
    if (req.body['email'] === users[key]['email'] && bcrypt.compareSync(req.body['password'], users[key]['password'])) {
      req.session.user_id = key;
      return res.redirect("/urls");
    }
  }

  return res.status(403).send("The password is not matched");
});

// Add a logout route.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Show the port number in the terminal.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});