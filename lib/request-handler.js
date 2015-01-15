var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/config').models.User;
var Link = require('../app/config').models.Url;

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}, function(err, links){
    console.log("fetchLinks = ", links);
    res.json(200, links)
  });

  // Links.reset().fetch().then(function(links) {
  //   res.send(200, links.models);
  // })
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;
  console.log("URI==>", uri)
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Link.findOne({ url: uri }, function(err, foundLink){
    if (foundLink) {
      res.json(200, foundLink);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
        Link.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        }, function(err, link){
            if(link){
              res.json(200, link);
            } else {
              res.status(500).end();
            }
        });
      });

    }
  });

  // new Link({ url: uri }).fetch().then(function(found) {
  //   if (found) {
  //     res.send(200, found.attributes);
  //   } else {
  //     util.getUrlTitle(uri, function(err, title) {
  //       if (err) {
  //         console.log('Error reading URL heading: ', err);
  //         return res.send(404);
  //       }


  //       var link = new Link({
  //         url: uri,
  //         title: title,
  //         base_url: req.headers.origin
  //       });

  //       link.save().then(function(newLink) {
  //         Links.add(newLink);
  //         res.send(200, newLink);
  //       });
  //     });
  //   }
  // });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username }, function(err, foundUser){
    if(foundUser){
      foundUser.checkPass(password, function(success){
        if(success){
          util.createSession(req, res, foundUser);
        } else {
          res.redirect('/login');
        }
      });
    }
  })

};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var user = User.where({ username: username });

  user.findOne(function(err, user){
    if (user) {
      console.log("Account already exists");
      res.redirect('/signup');
    } else {
      var newUser = User.create({ username: username, password: password },
        function(err, user){
          if (err) {
            console.error(err);
          }
          if (user) {
            console.log("new user", user);
            util.createSession(req, res, user);
            // res.redirect('/');
          }
      });
    }
  });

};

exports.navToLink = function(req, res) {

  var link = Link.where({ code: req.params[0] });
  link.findOne(function(err, foundLink){
    if (!foundLink) {
      res.redirect('/');
    } else {
      console.log(">>>", foundLink.visits)
      link.update({ visits: foundLink.visits+1 },
        function(err){
          console.log("updated link == ", foundLink);
          res.redirect(foundLink.url);
        });
    }
  });

  // new Link({ code: req.params[0] }).fetch().then(function(link) {
  //   if (!link) {
  //     res.redirect('/');
  //   } else {
  //     link.set({ visits: link.get('visits') + 1 })
  //       .save()
  //       .then(function() {
  //         return res.redirect(link.get('url'));
  //       });
  //   }
  // });
};
