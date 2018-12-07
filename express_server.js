const express = require("express");
const PORT = 8080; // default port 8080
// The body-parser library will allow us to access POST request parameters, such as req.body.longURL, which we will store in a variable called urlDatabase.
const bodyParser = require("body-parser");
//const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const methodOverride = require('method-override');

const app = express();

app.use(methodOverride('_method'));
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["stan"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    url : "http://www.lighthouselabs.ca",
    userID : "12p00p",
    totalVisits : 0
  },
  "9sm5xK": {
    url : "http://www.google.com",
    userID : "funk22",
    totalVisits : 0
  },
  "zxcv12": {
    url : "http://www.funkytown.com",
    userID : "funk22",
    totalVisits : 0
  }
};

const users = {
  "12p00p" : {
    id : "12p00p",
    email : "poopie@gmail.com",
    password : bcrypt.hashSync("password", 10)
  },
  "funk22" : {
    id : "funk22",
    email : "funky@gmail.com",
    password : bcrypt.hashSync("abc", 10)
  }
};

//Helper Functions
function generateRandomString() {
  let randoText = "";
  let range = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for(var i = 0; i < 6; i++){
    randoText += range.charAt(Math.floor(Math.random() * range.length));
  }
  return randoText;
}

//Return TRUE if duplicate email found in user db
function dupEmail(email){
  for(var i in users){
    if(users[i].email === email){
      return true;
    }
  }
  return false;
}

//Return 0 for invalid email
//Return -1 for invalid password
//Return User Object for matching email and password
function validAccount(email, password){
  for(var i in users){
    if(users[i].email === email){
      if (bcrypt.compareSync(password, users[i].password) ) {

        return users[i];
      } else {
        return -1;
      }
    }
  }
  return 0;
}

//Return an object of urls associated with userID
function userUrls (checkID){
  let urls = {};
  for (var i in urlDatabase){
    if (urlDatabase[i].userID === checkID){
      urls[i] = urlDatabase[i];
    }
  }
  return urls;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  if (req.session.user_id){
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



//Route DISPLAY ALL urls associated with the user
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const tempUrlDB = userUrls(userID);
  let templateVars = {  urls: tempUrlDB,
                        user: users[userID]
                      };
  res.render("urls_index", templateVars);
});

//Route to page to add URLs
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if(user_id){
    let templateVars = {  urls: urlDatabase,
                          user: users[req.session.user_id]
                        };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }

});

//Route DISPLAY SPECIFIC URL id details
app.get("/urls/:id", (req, res) => {

  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    let templateVars =  { shortURL: req.params.id,
                          urlObj: urlDatabase[req.params.id],
                          user: users[req.session.user_id]
                        };
    res.render("urls_show", templateVars);
  } else {
    res.end("ID not found");
  }
});

//CREATE URL Handler
app.post("/urls", (req, res) => {
  const randomURL = generateRandomString();
  const fullURL = req.body.longURL;
  const userID = req.session.user_id;
  const urlObj =  { url : fullURL,
                    userID : userID,
                    totalVisits : 0
                  };
  urlDatabase[randomURL] = urlObj;

  res.redirect(`/urls/${randomURL}`);
});

//Redirect shortened URLs to full url site
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]){
    let longURL = urlDatabase[req.params.shortURL].url;
    urlDatabase[req.params.shortURL].totalVisits++;
    res.redirect(longURL);
  } else {
    res.status(404).send("URL not found");
  }
});

//DELETE an url entry only if user created the URL
app.delete("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id === urlDatabase[req.params.id].userID){
    delete urlDatabase[req.params.id];
  }

  res.redirect('/urls');
});

//UPDATE the url entry
app.put("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id === urlDatabase[req.params.id].userID){
    urlDatabase[req.params.id].url = req.body.newURL;
  }

  res.redirect('/urls');
});

//LOGIN handler
app.post("/login", (req, res) => {
  //get email and password
  const {email, password} = req.body;
  const user = validAccount(email, password);

  //match email to db
  if (user === 0){
    res.status(403).send("Email not found");
  }
  //match password to db
  else if (user === -1){
    res.status(403).send("Invalid password");
  }
  else {
    //respond with user_id cookie & redirect to '/'
    req.session.user_id = user.id;
    res.redirect('/');
  }

});

//logout handler
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//route to the registration page
app.get("/register", (req, res) => {
  if (req.session.user_id){
    res.redirect("/urls");
  } else {
    res.render("user_registration");
  }
});

//handle registration form data
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const newEmail = req.body.email;
  const newPass = req.body.password;
  const hashedPassword = bcrypt.hashSync(newPass, 10);

  if(!newEmail || !newPass){
    res.status(401).send("error: Empty email or password"); //error message???

  } else if (dupEmail(newEmail)){
    res.status(409).send("error: Duplicate Email"); //error message???

  } else {
    //generate new user object and add to user db
    const userObj = {
      id : userID,
      email : newEmail,
      password : hashedPassword
    };
    users[userID] = userObj;
    req.session.user_id = userID;
    res.redirect("/urls");
  }

});

//Login Page
app.get("/login", (req, res) => {
  if (req.session.user_id){
    res.redirect("/urls");
  } else {
    let templateVars = {  user: users[req.session.user_id]
                        };
    res.render("user_login", templateVars);
  }
});



