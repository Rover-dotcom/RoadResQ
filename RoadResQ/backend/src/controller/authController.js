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
