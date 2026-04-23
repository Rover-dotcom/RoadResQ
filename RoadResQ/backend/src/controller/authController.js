const authService = require("../services/authService");

// Controller for Sign In
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // The Controller just passes the data to the Service
    const result = await authService.loginUser(email, password);
    
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(401).json({ status: "fail", message: error.message });
  }
};
// This is your controller logic
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password); // Logic is clean!
    res.status(200).json({ status: "success", user });
  } catch (error) {
    // If the error message matches your string, you can even check the type here
    res.status(401).json({ status: "fail", message: error.message });
  }
};
// Controller for Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // The Controller just passes the email to the Service
    await authService.initiatePasswordReset(email);
    
    res.status(200).json({ status: "success", message: "If account exists, email sent." });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
