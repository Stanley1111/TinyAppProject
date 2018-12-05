const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
// The body-parser library will allow us to access POST request parameters, such as req.body.longURL, which we will store in a variable called urlDatabase.
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//page to display all urls
app.get("/urls", (req, res) => {
  let templateVars = {  urls: urlDatabase,
                        username: req.cookies.username
                      };
  res.render("urls_index", templateVars);
});

//page to add new URL
app.get("/urls/new", (req, res) => {
  let templateVars = {  urls: urlDatabase,
                        username: req.cookies.username
                      };
  res.render("urls_new", templateVars);
});

//page to display specific URL id details
app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    let templateVars =  { shortURL: req.params.id,
                          urls: urlDatabase,
                          username: req.cookies.username
                        };
  res.render("urls_show", templateVars);
  } else {
    res.end("ID not found");
  }
});

//Adds url to Database
app.post("/urls", (req, res) => {
  let randomURL = generateRandomString();
  urlDatabase[randomURL] = req.body.longURL;

  res.redirect(`/urls/${randomURL}`);
});

//redirect shortened URLs to full url site
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//delete a url entry
app.post("/urls/:id/delete", (req, res) => {
  //req.params.id
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

//update/edit the url entry
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect('/urls');
});

//login: respond with a cookie withe the entered 'username'
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  console.log(req.body);
  res.redirect('/urls');
});

function generateRandomString() {
  let randoText = "";
  let range = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for(var i = 0; i < 6; i++){
    randoText += range.charAt(Math.floor(Math.random() * range.length));
  }
  return randoText;
}


