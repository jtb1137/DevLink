const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

const validateProfileInput = require("../../validation/profile");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route GET api/profile/test
// @desc Tests profile route
// @access Public
router.get("/test", (req, res) => {
  res.json({ message: "Profile functional" });
});

// @route GET api/profile
// @desc Current user profile
// @access Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user.";
          return res.status(404).json(errors);
        }
        res.json(profile);
      });
    //.catch(err => res.status(404).json(err))
  }
);

// @route POST api/profile
// @desc Create or update user profile
// @access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Validations
    const { errors, isValid } = validateProfileInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    // Profilefields
    const profilefields = {};
    profilefields.user = req.user.id;
    if (req.body.username) profilefields.username = req.body.username;
    if (req.body.company) profilefields.company = req.body.company;
    if (req.body.website) profilefields.website = req.body.website;
    if (req.body.location) profilefields.location = req.body.location;
    if (req.body.status) profilefields.status = req.body.status;
    if (req.body.bio) profilefields.bio = req.body.bio;
    // skills from CSV
    if (typeof req.body.skills !== "undefined")
      profilefields.skills = req.body.skills.split(",");
    // Social
    profilefields.social = {};
    if (req.body.githubusername)
      profilefields.social.githubusername = req.body.githubusername;
    if (req.body.youtube) profilefields.social.youtube = req.body.youtube;
    if (req.body.twitter) profilefields.social.twitter = req.body.twitter;
    if (req.body.facebook) profilefields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profilefields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profilefields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        // Update the profile
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profilefields },
          { new: true }
        ).then(profile => {
          res.json(profile);
        });
      } else {
        // Create a profile
        Profile.findOne({ username: profilefields.username }).then(profile => {
          if (profile) {
            errors.username = "That username already exists.";
            res.status(404).json(errors);
          }
          new Profile(profilefields).save().then(profile => {
            res.json(profile);
          });
        });
      }
    });
  }
);

module.exports = router;
