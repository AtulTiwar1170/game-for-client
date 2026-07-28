const mongoose = require('mongoose');

// ==========================================
// MONGOOSE SCHEMAS (For Future Implementation)
// ==========================================

const ResultSchema = new mongoose.Schema({
  marketName: { type: String, required: true },
  currentResult: { type: String, maxLength: 2 },
  previousResult: { type: String, maxLength: 2 },
  date: { type: Date, default: Date.now },
  openingTime: { type: String, required: true }
});

const PredictionSchema = new mongoose.Schema({
  marketName: { type: String, required: true },
  singleJodi: { type: String, maxLength: 2 },
  damdarJodi: [{ type: String, maxLength: 2 }],
  saportJodi: [{ type: String, maxLength: 2 }],
  andarHurf: { type: String, maxLength: 1 },
  baharHurf: { type: String, maxLength: 1 },
  date: { type: Date, default: Date.now }
});

const GameLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  guess: { type: String, required: true },
  winningNumber: { type: String, required: true },
  matched: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  conditionApplied: { type: String } // 'NORMAL', 'FORCE_WIN', 'FORCE_LOSE'
});

const AdminOverrideSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String },
  override: { type: String, enum: ['NORMAL', 'WIN', 'LOSE'], default: 'NORMAL' }
});

// ==========================================
// IN-MEMORY DATA STORAGE (Current Active State)
// ==========================================

let mockResults = [
  {
    id: 1,
    marketName: 'Desawar',
    currentResult: '74',
    previousResult: '42',
    openingTime: '05:00 AM',
    lastUpdated: new Date() // Set to now to show flashing live indicator
  },
  {
    id: 2,
    marketName: 'Gali',
    currentResult: '19',
    previousResult: '83',
    openingTime: '11:00 PM',
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
  },
  {
    id: 3,
    marketName: 'Faridabad',
    currentResult: '58',
    previousResult: '91',
    openingTime: '06:15 PM',
    lastUpdated: new Date(Date.now() - 5 * 60 * 1000) // 5 mins ago (LIVE)
  },
  {
    id: 4,
    marketName: 'Gaziyabad',
    currentResult: '32',
    previousResult: '15',
    openingTime: '08:00 PM',
    lastUpdated: new Date(Date.now() - 10 * 60 * 1000) // 10 mins ago (LIVE)
  },
  {
    id: 5,
    marketName: 'Delhi Bazar',
    currentResult: '48',
    previousResult: '35',
    openingTime: '03:00 PM',
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    id: 6,
    marketName: 'Shri Ganesh',
    currentResult: '85',
    previousResult: '62',
    openingTime: '04:30 PM',
    lastUpdated: new Date(Date.now() - 3.5 * 60 * 60 * 1000) // 3.5 hours ago
  },
  {
    id: 7,
    marketName: 'Taj',
    currentResult: '29',
    previousResult: '73',
    openingTime: '02:00 PM',
    lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
  }
];

let mockPredictions = {
  'Desawar': { singleJodi: '87', damdarJodi: ['12', '45', '78', '90'], andarHurf: '8', baharHurf: '7', saportJodi: ['04', '23', '35', '56', '67', '79', '88', '99'] },
  'Gali': { singleJodi: '34', damdarJodi: ['23', '56', '89', '01'], andarHurf: '3', baharHurf: '4', saportJodi: ['11', '22', '33', '44', '55', '66', '77', '88'] },
  'Faridabad': { singleJodi: '56', damdarJodi: ['14', '25', '36', '47'], andarHurf: '5', baharHurf: '6', saportJodi: ['09', '18', '27', '36', '45', '54', '63', '72'] },
  'Gaziyabad': { singleJodi: '12', damdarJodi: ['02', '13', '24', '35'], andarHurf: '1', baharHurf: '2', saportJodi: ['05', '10', '15', '20', '25', '30', '35', '40'] },
  'Delhi Bazar': { singleJodi: '90', damdarJodi: ['19', '28', '37', '46'], andarHurf: '9', baharHurf: '0', saportJodi: ['08', '17', '26', '35', '44', '53', '62', '71'] },
  'Shri Ganesh': { singleJodi: '75', damdarJodi: ['07', '18', '29', '30'], andarHurf: '7', baharHurf: '5', saportJodi: ['03', '12', '21', '30', '39', '48', '57', '66'] },
  'Taj': { singleJodi: '48', damdarJodi: ['15', '26', '37', '48'], andarHurf: '4', baharHurf: '8', saportJodi: ['06', '12', '18', '24', '30', '36', '42', '48'] }
};

// Guessing Game State
let totalAttempts = 0;
const WINNING_INDEX = Math.floor(Math.random() * 120); // Choose a random attempt index between 0-119 to win

let gameLogs = [];
let adminOverrides = {}; // userId -> 'NORMAL' | 'WIN' | 'LOSE'
let userBids = []; // { id, userId, username, market, type, guess, points, status: 'PENDING' | 'WON' | 'LOST', lockedAt }

module.exports = {
  // Mongoose models export placeholder
  ResultModel: mongoose.models.Result || mongoose.model('Result', ResultSchema),
  PredictionModel: mongoose.models.Prediction || mongoose.model('Prediction', PredictionSchema),
  
  // Active In-Memory Data & Functions
  getResults: () => mockResults,
  getPredictions: () => mockPredictions,
  getGameLogs: () => gameLogs,
  getAdminOverrides: () => adminOverrides,
  setAdminOverride: (userId, username, override) => {
    adminOverrides[userId] = { username, override };
  },
  
  // Satta Bidding System Functions
  getAllBids: () => userBids,
  getUserBids: (userId) => {
    return userBids.filter(b => b.userId === userId);
  },
  addBid: (bidData) => {
    const isJodiType = ['jodi', 'damdar_jodi', 'support_jodi'].includes(bidData.type);
    const guessNum = Number(bidData.guess);

    if (isJodiType) {
      if (isNaN(guessNum) || guessNum < 11 || guessNum > 99) {
        return { success: false, message: 'Validation Error: Jodi guess must be a number between 11 and 99.' };
      }
    } else if (bidData.type === 'single_haraf') {
      if (isNaN(guessNum) || guessNum < 0 || guessNum > 9) {
        return { success: false, message: 'Validation Error: Single Haraf must be a digit between 0 and 9.' };
      }
      if (!['andar', 'bahar'].includes(bidData.harafSide)) {
        return { success: false, message: 'Validation Error: Haraf side must be Andar or Bahar.' };
      }
    } else {
      return { success: false, message: 'Validation Error: Invalid play type.' };
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    const targetResultDate = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    // Strict single bid limit per market area per user for the target result date
    const existingBid = userBids.find(b => 
      b.userId === bidData.userId &&
      b.market.toLowerCase() === bidData.market.toLowerCase() &&
      b.targetResultDate === targetResultDate &&
      b.status === 'PENDING'
    );
    if (existingBid) {
      const typeStr = existingBid.type === 'single_haraf' ? `Haraf (${existingBid.harafSide})` : existingBid.type.replace('_', ' ');
      return { 
        success: false, 
        message: `Limit Exceeded: You already have a locked bid in ${bidData.market} (${typeStr}) for this session. Only one bid is allowed per market area.` 
      };
    }

    const user = usersList.find(u => u.id === bidData.userId);
    if (user) {
      if (user.points === undefined) user.points = 10000;
      if (user.points < Number(bidData.points)) {
        return { success: false, message: `Insufficient Points! You only have ${user.points} points.` };
      }
      user.points -= Number(bidData.points);
    }

    const newBid = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      userId: bidData.userId,
      username: bidData.username || 'Anonymous',
      market: bidData.market,
      type: bidData.type,
      harafSide: bidData.type === 'single_haraf' ? bidData.harafSide : undefined,
      guess: bidData.guess,
      points: Number(bidData.points),
      status: 'PENDING',
      targetResultDate,
      lockedAt: new Date()
    };
    userBids.push(newBid);
    return { success: true, bid: newBid };
  },
  settleUserBids: (userId) => {
    const bids = userBids.filter(b => b.userId === userId);
    bids.forEach(bid => {
      if (bid.status !== 'PENDING') return;

      const marketInfo = mockResults.find(r => r.marketName.toLowerCase() === bid.market.toLowerCase());
      if (!marketInfo || !marketInfo.currentResult || marketInfo.currentResult === '--') {
        // Still pending
        return;
      }

      const resVal = marketInfo.currentResult;
      let won = false;

      const marketPred = mockPredictions[bid.market] || {};
      if (bid.type === 'jodi') {
        won = (bid.guess === resVal);
      } else if (bid.type === 'damdar_jodi') {
        won = Array.isArray(marketPred.damdarJodi) && marketPred.damdarJodi.includes(bid.guess);
      } else if (bid.type === 'support_jodi') {
        won = Array.isArray(marketPred.saportJodi) && marketPred.saportJodi.includes(bid.guess);
      } else if (bid.type === 'single_haraf') {
        if (bid.harafSide === 'andar') {
          won = (resVal.length > 0 && bid.guess === resVal.charAt(0));
        } else if (bid.harafSide === 'bahar') {
          won = (resVal.length > 1 && bid.guess === resVal.charAt(1));
        }
      }

      bid.status = won ? 'WON' : 'LOST';
      if (won) {
        const user = usersList.find(u => u.id === userId);
        if (user) {
          const isJodi = ['jodi', 'damdar_jodi', 'support_jodi'].includes(bid.type);
          const multiplier = isJodi ? 90 : 9;
          if (user.points === undefined) user.points = 10000;
          user.points += bid.points * multiplier;
        }
      }
    });
    return bids;
  },

  // Game attempt counter and check function
  incrementAttempts: () => {
    totalAttempts++;
    return totalAttempts;
  },
  getAttempts: () => totalAttempts,
  getWinningIndex: () => WINNING_INDEX,
  addGameLog: (log) => {
    gameLogs.push({
      ...log,
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date()
    });
  },

  // Authentication & Authorization Functions
  registerUser: (username, password, role = 'user') => {
    const exists = usersList.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return { success: false, message: 'Username is already taken.' };
    }
    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      username,
      password,
      role,
      points: 0 // Initialize with 0 points; user must request deposit and wait for admin approval
    };
    usersList.push(newUser);
    return { success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role, points: newUser.points } };
  },
  loginUser: (username, password) => {
    const user = usersList.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) {
      return { success: false, message: 'Invalid username or password.' };
    }
    if (user.points === undefined) {
      user.points = 0;
    }
    return { success: true, user: { id: user.id, username: user.username, role: user.role, points: user.points } };
  },

  // Payment Options & Balance Requests Functions
  getPaymentMethods: () => paymentMethods,
  addPaymentMethod: (name, qrImage) => {
    const newMethod = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      name,
      qrImage, // Base64 image
      createdAt: new Date()
    };
    paymentMethods.push(newMethod);
    return newMethod;
  },
  deletePaymentMethod: (id) => {
    paymentMethods = paymentMethods.filter(p => p.id !== id);
    return true;
  },
  getBalanceRequests: () => balanceRequests,
  addBalanceRequest: (userId, username, points, screenshot) => {
    const newRequest = {
      id: 'req_' + Math.random().toString(36).substr(2, 9),
      userId,
      username,
      points: Number(points),
      screenshot, // Base64 screenshot
      status: 'PENDING',
      createdAt: new Date()
    };
    balanceRequests.push(newRequest);
    return newRequest;
  },
  updateBalanceRequest: (id, status) => {
    const request = balanceRequests.find(r => r.id === id);
    if (!request) return { success: false, message: 'Request not found' };
    
    request.status = status;
    if (status === 'APPROVED') {
      const user = usersList.find(u => u.id === request.userId);
      if (user) {
        if (user.points === undefined) user.points = 0;
        user.points += request.points;
      }
    }
    return { success: true, request };
  },
  getUserPoints: (userId) => {
    const user = usersList.find(u => u.id === userId);
    return user ? (user.points !== undefined ? user.points : 0) : 0;
  },
  updateUserPoints: (userId, points) => {
    const user = usersList.find(u => u.id === userId);
    if (user) {
      user.points = Number(points);
      return { success: true, points: user.points };
    }
    return { success: false, message: 'User not found' };
  }
};

let usersList = [
  { id: 'admin_id', username: 'admin', password: 'admin123', role: 'admin', points: 1000000 }
];

let paymentMethods = [
  {
    id: 'pay_default_1',
    name: 'Official GooglePay / PhonePe UPI QR',
    qrImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="white"/><g fill="black"><rect x="15" y="15" width="40" height="40"/><rect x="25" y="25" width="20" height="20"/><rect x="95" y="15" width="40" height="40"/><rect x="105" y="25" width="20" height="20"/><rect x="15" y="95" width="40" height="40"/><rect x="25" y="105" width="20" height="20"/><rect x="65" y="65" width="20" height="20"/><rect x="85" y="85" width="20" height="20"/><rect x="65" y="95" width="10" height="40"/><rect x="115" y="65" width="20" height="20"/><rect x="95" y="95" width="40" height="10"/></g></svg>',
    createdAt: new Date()
  }
];

let balanceRequests = [];
