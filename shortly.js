var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var session = require('express-session');
var bcrypt = require('bcrypt');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');



var app = express();  

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(cookieParser());

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'wodemimi'
}));

// function restrict(req, res, next) {
//   if (req.session.user) {
//     next();
//   } else {
//     req.session.error = 'Access denied!';
//     res.redirect('/login');
//   }
// }

app.get('/', util.checkUser, function(req, res){

//.loggedIn(? set it to whatever)

// if(req.session.??? === true){
//These two lines of code are identical.

  //this is now being tested in util.checkUser;
  // if(!util.isLoggedIn(req)){
  //   res.redirect('/login');
  // } else {
    res.render('index');
  // }
});


app.get('/create', util.checkUser, function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res){
  res.render('signup');
});

app.get('/links', util.checkUser, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/login', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  new User({username: username}).fetch().then(function(user) {
    if( !user ){
      res.send(200, 'You entered an incorrect name or password.');
      res.redirect('/login');
    } else {
      //var sessionId = generateSessionId();
      bcrypt.compare(password, user.get('password'), function(match){
        if( match ){
          util.createSession(req, res, user);
          res.redirect('/');
        } else {
          res.redirect('/login');
        }
      })
      // req.session.regenerate
      // res.render('index');
      // res.send(200, 'Hello!');
    }
  });

 //  if(username == 'demo' && password == 'demo'){
 //    request.session.regenerate(function(){
 //      request.session.user = username;
 //      response.redirect('/restricted');
 //    });
 //  }
 //  else {
 //   res.redirect('login');
 // }

 //console.log(username, password, '--------------------');
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});

// app.post('/login', function(request, response) {

//   var username = request.body.username;
//   var password = request.body.password;
//   var salt = bcrypt.genSaltSync(10);
//   var hash = bcrypt.hashSync(password, salt);
//   var userObj = db.users.findOne({ username: username, password: hash });

//   if(userObj){
//     request.session.regenerate(function(){
//       request.session.user = userObj.username;
//       response.redirect('/home');
//     });
//   }
//   else {
//     res.redirect('signup');
//   }

// });



app.post('/signup', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  var user = new User({
    username: username
  })
  .fetch()
  .then(function(user) {
    if (!user) {
      bcrypt.hash(password, null, null, function(err, hash){
        Users.create({
          username: username,
          password: hash
        }).then(function(user){
          util.createSession(req, res, user);
        });
      })
    } else {
      res.redirect('/login');
    }
  })

  // user.save().then(function(newUser){
  //   Users.add(newUser);
  //   console.log('USERS-----------', Users.models)
  //   res.send(200, newUser);
  // })

  // res.send(200, user);
  //console.log('you signed up!');
});



app.post('/links', 
  function(req, res) {
  //console.log(req.body.url);
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/






/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
        .where('code', '=', link.get('code'))
        .update({
          visits: link.get('visits') + 1,
        }).then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 3000');
app.listen(3000);
