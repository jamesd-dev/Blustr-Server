const express = require("express");
const router = express.Router();

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

router.post("/story/create", isLoggedIn, (req, res) => {
  const { content } = req.body;
  console.log(req.body);
  StoryModel.create({
    author: req.session.loggedInUser._id,
    content,
    dateCreated: new Date(),
    likes: 0,
    dislikes: 0,
    views: 0,
  })
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to create story",
        message: err,
      });
    });
});

router.get("/story/:id", isLoggedIn, (req, res) => {
  StoryModel.findById(req.params.id)
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to get specific story",
        message: err,
      });
    });
});

router.delete("/story/:id", isLoggedIn, (req, res) => {
  StoryModel.findById(req.params.id)
    .then((story) => {
      const userId = req.session.loggedInUser._id;
      // checks if the user is allowed to delete story
      if (doesOwn(userId, story)) {
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
      } else {
        res.status(401).json({
          error: "Non owner tried to delete story",
          message: err,
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to find story (to delete)",
        message: err,
      });
    });
});

// router.patch('/todos/:id', isLoggedIn, (req, res) => {
//     let id = req.params.id
//     const {name, description, completed} = req.body;
//     TodoModel.findByIdAndUpdate(id, {$set: {name: name, description: description, completed: completed}})
//           .then((response) => {
//                res.status(200).json(response)
//           })
//           .catch((err) => {
//                console.log(err)
//                res.status(500).json({
//                     error: 'Something went wrong',
//                     message: err
//                })
//           })
// })

router.patch("/story/:id/like", isLoggedIn, (req, res) => {
  const storyId = req.params.id;
  const userId = req.session.loggedInUser._id;

  // must check if story exists first, for security
  StoryModel.findById(storyId)
    .then((story) => {
      //  find the current user
      UserModel.findById(userId)
      .then((user) => {

          console.log('found user: ', user.username);
           // check if alt story exists
           let altStory = user.alteredStories.find((e) => {return e.story == storyId;});
           console.log(altStory);

           if(!altStory) { // if none, push new alt story to user

               console.log('found user\'s alteredStories contains: ', altStory);

                altStory = {story: storyId, liked: true, disliked: false}

                console.log('user\'s proposed alteredStories contains: ', altStory);
                
                // push new story to user
                UserModel.findByIdAndUpdate(userId, {$push: {alteredStories: altStory}})
                .then((updatedAltStory) => {

                    console.log('created new altered story for user: ', updatedAltStory);

                     // update story with new like
                     StoryModel.findByIdAndUpdate(storyId, {$set: {likes: story.likes + 1}})
                     .then((updatedStory) => {
                         console.log('Updated story to: ', updatedStory);
                         // return success 
                         res.status(200).json({updatedStory});
                     })
                     .catch((err) => {
                         console.log('failed to update story');
                         // return failure
                         res.status(500).json({
                              error: "Failed to update story",
                              message: err,
                         });
                     })

                })
                .catch((err) => {
                    console.log('Failed to push alt story to user');
                     res.status(500).json({
                          error: "Failed to push alt story to user",
                          message: err,
                     });
                })
           } else {

               console.log('found user\'s alteredStories contains: ', altStory);
                // check if user already liked the story. Can only like once.
                if(!altStory.liked) {
                    
                    let changes = {likes: story.likes + 1};
                    altStory.liked = true;

                    if(altStory.disliked) { // if disliked, dislikes must be reduced by one and the boolean toggled
                         changes.dislikes = story.dislikes - 1;
                         altStory.disliked = false;
                    }

                    console.log('pushing changes... ', changes)

                    // push changes to story
                    StoryModel.findByIdAndUpdate({$set: changes})
                    .then((updatedStory) => {
                         console.log('Updated story to: ', updatedStory);
                     })
                     .catch((err) => {
                         console.log('failed to update story');
                         // return failure
                         res.status(500).json({
                              error: "Failed to update story",
                              message: err,
                         });
                     })

                    // push changes to user alt stories copy
                    let userAltStoriesCopy = user.alteredStories.map((elem) => {
                         if(elem.story == storyId) {
                              return Object.assign(elem, altStory);
                         }
                         return elem;
                    });

                    // push changes to user
                    UserModel.findByIdAndUpdate(userId, {$set: {alteredStories: userAltStoriesCopy}})
                    .then((updatedAltStory) => {
                         console.log('Updated user\'s alt story to: ', updatedAltStory);
                         // return success 
                         res.status(200).json({updatedStory});
                     })
                     .catch((err) => {
                         console.log('failed to update user\'s alt story');
                         // return failure
                         res.status(500).json({
                              error: 'failed to update user\'s alt story',
                              message: err,
                         });
                     })


                } else { // otherwise mustn't alter the story
                console.log('Story already liked.');
                    res.status(500).json({
                         error: "Story already liked"
                    });
                }
           }
      })
      .catch((err) => {
           res.status(500).json({
                error: "Failed to find user",
                message: err,
           });
      })
    })
    .catch((err) => {
      res.status(500).json({
        error: "Failed to find story from id",
        message: err,
      });
    });
});

module.exports = router;
