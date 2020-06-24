const express = require('express')
const router = express.Router()

//we installed bcrypt.js
const bcrypt = require('bcryptjs');

const UserModel = require('../models/User.model');

const { isLoggedIn } = require('../helpers/auth-helper'); // to check if user is loggedIn

router.post('/signup', (req, res) => {
    const {username, email, password } = req.body;
    console.log(username, email, password);
 
    if (!username || !email || !password) {
        res.status(500)
          .json({
            errorMessage: 'Please enter username, email and password'
          });
        return;  
    }

    const myRegex = new RegExp(/^[a-z0-9](?!.*?[^\na-z0-9]{2})[^\s@]+@[^\s@]+\.[^\s@]+[a-z0-9]$/);
    if (!myRegex.test(email)) {
        res.status(500)
          .json({
            errorMessage: 'Email format not correct'
        });
        return;  
    }

    const myPassRegex = new RegExp(/^(?=.*\d*)(?=.*[a-z]*)(?=.*[A-Z]*)(?=.*[a-zA-Z]*).{8,}$/);
    if (!myPassRegex.test(password)) {
      res.status(500)
          .json({
            errorMessage: 'Password needs to have at least 8 characters'
          });
        return;  
    }

    bcrypt.genSalt(12)
      .then((salt) => {
        console.log('Salt: ', salt);
        bcrypt.hash(password, salt)
          .then((passwordHash) => {

            // Create User
            UserModel.create({email, username, passwordHash, dateJoined: new Date()})
              .then((user) => {
                user.passwordHash = "***";
                req.session.loggedInUser = user;
                console.log(req.session)
                res.status(200).json(user);
              })
              .catch((err) => {
                if (err.code === 11000) {
                  res.status(500)
                  .json({
                    errorMessage: 'username or email entered already exists!',
                    message: err
                  });
                  return;  
                } 
                else {
                  res.status(500)
                  .json({
                    errorMessage: 'Something went wrong creating user'
                  });
                  return; 
                }
              })
          });  
  });

});
 
router.post('/signin', (req, res) => {
    const {username, password } = req.body;
    if ( !username || !password) {
        res.status(500).json({
            error: 'Please enter username and password',
       })
      return;  
    }
  
    // Find if the user exists in the database 
    UserModel.findOne({username})
      .then((userData) => {
           //check if passwords match
          bcrypt.compare(password, userData.passwordHash)
            .then((isMatch) => {
                if (isMatch) {
                  // hide the user password hash in session
                  userData.passwordHash = "***";
                  req.session.loggedInUser = userData;
                  console.log('Successfully signed in as ' + username);
                  res.status(200).json(userData)
                }
                //if passwords do not match
                else {
                    res.status(500).json({
                        error: 'Incorrect password, I\'m afraid',
                    })
                  return; 
                }
            })
            .catch((err) => {
                res.status(500).json({
                    error: 'Failed to compare password and hash',
                })
              return; 
            });
      })
      //throw an error if the user does not exists 
      .catch((err) => {
        res.status(500).json({
            error: 'Hmm, that username isn\'t in the database, want to sign up with it?',
            message: err
        })
        return;  
      });
  
});
 
router.post('/logout', (req, res) => {
    req.session.destroy();
    res
    .status(204) //  No Content
    .send();
})

router.get("/user", isLoggedIn, (req, res, next) => {
  res.status(200).json(req.session.loggedInUser);
});

  module.exports = router;