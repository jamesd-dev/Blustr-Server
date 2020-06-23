const isLoggedIn = (req, res, next) => {
  //console.log('Middleware', req.session)  
  if (req.session.loggedInUser) next();
  else {
      res.status(401).json({
          message: 'Unauthorized user',
          code: 401,
      })
  };
};

function doesOwn(userId, story) {
    if (userId == story.author) return true;
    return false;
};


module.exports = {
    isLoggedIn,
    doesOwn
}