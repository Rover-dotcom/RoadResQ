const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * Handles the logic for logging in a user.
 * Throws errors if user is not found or password is incorrect.
 */
const loginUser = async (email, password) => {
  // 1. Find user by email
  const user = await User.findOne({ email });

  // 2. Logic: User must exist
  if (!user) {
    throw new Error("You don't have an account with us, try to sign up.");
  }

  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    // You can use a generic "Invalid credentials" here for security 
    // or be specific if you prefer for UX
    throw new Error("Invalid password.");
  }

  // 4. Return the user (or generate a JWT token here)
  return user;
};

/**
 * Handles the logic for password recovery.
 */
const initiatePasswordReset = async (email) => {
  // 1. Find user by email
  const user = await User.findOne({ email });

  // 2. Logic: User must exist
  if (!user) {
    throw new Error("You don't have an account with us, try to sign up.");
  }

  // 3. Logic to generate a reset token and send email
  // Example: 
  // const token = generateResetToken(user);
  // await sendEmail(user.email, token);
  
  return { success: true };
};

module.exports = {
  loginUser,
  initiatePasswordReset
};
