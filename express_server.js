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
  "b2xVn2": {
    url : "http://www.lighthouselabs.ca",
    userID : "12p00p"
  },
  "9sm5xK": {
    url : "http://www.google.com",
    userID : "funk22"
  },
  "zxcv12": {
    url : "http://www.funkytown.com",
    userID : "funk22"
  }
};

const users = {
  "12p00p" : {
    id : "12p00p",
    email : "poopie@gmail.com",
    password : "password"
  },
  "funk22" : {
    id : "funk22",
    email : "funky@gmail.com",
    password : "abc"
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
      if (users[i].password === password) {
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
  res.send("Hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



//page to display all urls associated with the user
app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  const tempUrlDB = userUrls(userID);
  let templateVars = {  urls: tempUrlDB,
                        user: users[userID]
                      };
  res.render("urls_index", templateVars);
});

//Route to page to add URLs
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  if(user_id){
    let templateVars = {  urls: urlDatabase,
                          user: users[req.cookies.user_id]
                        };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }

});

//page to display specific URL id details
app.get("/urls/:id", (req, res) => {

  if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
    let templateVars =  { shortURL: req.params.id,
                          url: urlDatabase[req.params.id].url,
                          user: users[req.cookies.user_id]
                        };
    res.render("urls_show", templateVars);
  } else {
    res.end("ID not found");
  }
});

//ADD URL Handler url to Database
app.post("/urls", (req, res) => {
  const randomURL = generateRandomString();
  const fullURL = req.body.longURL;
  const userID = req.cookies.user_id;
  const urlObj =  { url : fullURL,
                    userID : userID
                  };
  urlDatabase[randomURL] = urlObj;

  console.log(urlDatabase);
  res.redirect(`/urls/${randomURL}`);
});

//redirect shortened URLs to full url site
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

//DELETE an url entry only if user created the URL
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.cookies.user_id;
  if (user_id === urlDatabase[req.params.id].userID){
    delete urlDatabase[req.params.id];
  }

  res.redirect('/urls');
});

//update/edit the url entry
app.post("/urls/:id", (req, res) => {
  const user_id = req.cookies.user_id;
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
    res.status(403).send("Invalid email");
  }
  //match password to db
  else if (user === -1){
    res.status(403).send("Invalid password");
  }
  else {
    //respond with user_id cookie & redirect to '/'
    res.cookie("user_id", user.id);
    res.redirect('/');
  }

});

//logout handler
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//route to the registration page
app.get("/register", (req, res) => {
  res.render("user_registration");
});

//handle registration form data
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const newEmail = req.body.email;
  const newPass = req.body.password;
  if(!newEmail || !newPass){
    res.send(400, "error: Empty email or password"); //error message???

  } else if (dupEmail(newEmail)){
    res.send(400, "error: Duplicate Email"); //error message???

  } else {
    //generate new user object and add to user db
    const userObj = {
      id : userID,
      email : newEmail,
      password : newPass
    };
    users[userID] = userObj;
    //console.log(users);
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }

});

//Login Page
app.get("/login", (req, res) => {
  let templateVars = {  user: users[req.cookies.user_id]
                      };
  res.render("user_login", templateVars);
});



