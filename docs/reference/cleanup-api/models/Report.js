const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  clientName: { 
    type: String, 
    required: true,
    trim: true
  },
  reportUrl: { 
    type: String, 
    required: true 
  },
  finalizedAt: { 
    type: Date, 
    default: Date.now 
  },
  // Useful for your dashboard statistics
  summary: {
    photoCount: { type: Number, default: 0 },
    archivedBy: { type: String, default: 'System' }
  }
}, { timestamps: true });

// Indexing for faster lookups when the client asks for their history
reportSchema.index({ jobId: 1 });
reportSchema.index({ clientName: 1 });

module.exports = mongoose.model('Report', reportSchema);