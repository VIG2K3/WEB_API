const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const NotificationSettingsSchema = new mongoose.Schema({
  tripReminders: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: false },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 8 },
  phone:      { type: String, default: "" },
  bio:        { type: String, default: "" },
  homeCity:   { type: String, default: "" },
  currency:   { type: String, default: "MYR" },
  language:   { type: String, default: "English" },
  profilePic: { type: String, default: "" },

  // Each user now has their own notification preferences.
  notificationSettings: {
    type: NotificationSettingsSchema,
    default: () => ({ tripReminders: true, emailNotifications: false }),
  },

  // Used for email verification during signup.
  emailVerified: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", UserSchema);
