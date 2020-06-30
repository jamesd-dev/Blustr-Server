const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

let StoryModel = require("../models/Story.model");
const { isLoggedIn, doesOwn } = require("../helpers/auth-helper"); // to check if user is loggedIn
const UserModel = require("../models/User.model");

router.get("/story", (req, res) => {
  StoryModel.find()
    .then((stories) => {
      res.status(200).json(stories);
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to get all stories",
        message: err,
      });
    });
});

// breaks data into pages, or blocks of data for infinite scrolling
// pages start at 0
router.get("/story/page/:page", (req, res) => {
  const storiesPerPage = 20;
  let skip = req.params.page * storiesPerPage;
  StoryModel.find({}).sort({dateCreated: -1}).skip(skip).limit(storiesPerPage)
    .then((stories) => {
      res.status(200).json(stories);
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to get page",
        message: err,
      });
    });
});

router.post("/story/create", isLoggedIn, (req, res) => {
  const { content} = req.body;
  console.log(req.body);
  StoryModel.create({
    author: req.session.loggedInUser._id,
    content: content,
    dateCreated: new Date(),
    likes: 0,
    dislikes: 0,
    views: 0,
  })
    .then((response) => {
      UserModel.findByIdAndUpdate(req.session.loggedInUser._id, {
        $push: { stories: response._id },
      })
        .then(() => {
          res.status(200).json(response);
        })
        .catch((err) => {
          res.status(500).json({
            error: "Failed to add story to user/author",
            message: err,
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to create story",
        message: err,
      });
    });
});

router.get("/story/:id", (req, res) => {
  StoryModel.findById(req.params.id)
    .then((story) => {
      StoryModel.findByIdAndUpdate(req.params.id, {
        $set: { views: story.views + 1 },
      })
        .then((response) => res.status(200).json(response))
        .catch((err) => {
          res.status(500).json({
            error: "Failed add view to story",
            message: err,
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to get specific story",
        message: err,
      });
    });
});

router.delete("/story/:id", (req, res) => {
  StoryModel.findById(req.params.id)
    .then((story) => {
        StoryModel.findByIdAndDelete(req.params.id)
          .then((response) => {
            res.status(200).json(response);
          })
          .catch((err) => {
            res.status(500).json({
              error: "Failed to delete story",
              message: err,
            });
          });
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to find story (to delete)",
        message: err,
      });
    });
});

router.patch("/story/:id/like", isLoggedIn, (req, res) => {
  const storyId = req.params.id;
  const userId = req.session.loggedInUser._id;

  getStoryAndUser(storyId, userId)
  .then((storyAndUser) => {

    const story = storyAndUser[0];
    const user = storyAndUser[1];
    let altStory = getAlt(user, story);

    const {liked, disliked} = altStory;
    
    let setAlt;

    if (!liked && !disliked) {
      // unaltered
      setAlt = setAlts(true, false, 1, 0, user, story);
    } else if (liked) {
      // already liked
      setAlt = setAlts(false, false, -1, 0, user, story);
    } else if (disliked && !liked) {
      // already disliked
      setAlt = setAlts(true, false, 1, -1, user, story);
    }

    setAlt
    .then((response) => {
      console.log('set story and user alt');
      console.log(`likes: ${response[1].likes} dislikes: ${response[1].dislikes}`)
      res.status(200).json(response);
    })

  })
  .catch((err) => {
    console.log('failed to get user and story');
    console.log('err: ', err);
    res.status(500).json({
      error: "failed to get user and story",
      message: err,
    });
  })
});

router.patch("/story/:id/dislike", isLoggedIn, (req, res) => {
  const storyId = req.params.id;
  const userId = req.session.loggedInUser._id;

  getStoryAndUser(storyId, userId)
  .then((storyAndUser) => {

    const story = storyAndUser[0];
    const user = storyAndUser[1];
    let altStory = getAlt(user, story);

    const {liked, disliked} = altStory;
    
    let setAlt;

    if (!liked && !disliked) {
      // unaltered
      setAlt = setAlts(false, true, 0, 1, user, story);
    } else if (disliked) {
      // already disliked
      setAlt = setAlts(false, false, 0, -1, user, story);
    } else if (!disliked && liked) {
      // already liked
      setAlt = setAlts(false, true, -1, 1, user, story);
    }

    setAlt
    .then((response) => {
      console.log('set story and user alt');
      console.log(`likes: ${response[1].likes} dislikes: ${response[1].dislikes}`)
      res.status(200).json(response);
    })

  })
  .catch((err) => {
    console.log('failed to get user and story');
    console.log('err: ', err);
    res.status(500).json({
      error: "failed to get user and story",
      message: err,
    });
  })

});

// easier to bundle all the essential promises here, instead of wrapping the whole function in them
function getStoryAndUser(storyId, userId) {
  let getStory = StoryModel.findById(storyId);  
  let getUser = UserModel.findById(userId);
  return Promise.all([getStory, getUser]);
}

function getAlt(user, story) {
    let altStory = user.alteredStories.find((e) => {
    return e.storyId.toString() === story._id.toString();
    });
    // only need to know the true false pattern. if there is no alt story they're essentially both false
    console.log(altStory);
    return (altStory) ? altStory : {storyId: story._id, liked: false, disliked: false};
}

function setUserAlt(liked, disliked, user, story) {
  return new Promise((resolve, reject) => {
    if(user.alteredStories.find((e) => {
      return e.storyId.toString() === story._id.toString();
      })) {
    UserModel.findByIdAndUpdate(user._id, 
      {$set: {"alteredStories.$[element].liked": liked, "alteredStories.$[element].disliked": disliked}},
       {arrayFilters: [{"element.storyId": story._id}], multi: true})
    .then((res) => {
      resolve(res);
    })
    .catch((err) => {
      console.log(err);
      reject(err);
    })
  } else {
    UserModel.findByIdAndUpdate(user._id, {
      $push: { alteredStories: {storyId: story._id, liked: liked, disliked: disliked} }
    })
    .then((res) => {
      resolve(res);
    })
    .catch((err) => {
      reject(err);
    })
  }
  });
}

function setStoryAlt(dLikes, dDislikes, story) {
  return StoryModel.findByIdAndUpdate(story._id, {
    $inc: {likes: dLikes, dislikes: dDislikes},
  });
}

function setAlts(liked, disliked, dLikes, dDislikes, user, story) {
  let setUserAltPromise = setUserAlt(liked, disliked, user, story);
  let setStoryAltPromise = setStoryAlt(dLikes, dDislikes, story);
  return Promise.all([setUserAltPromise, setStoryAltPromise]);
}



module.exports = router;
