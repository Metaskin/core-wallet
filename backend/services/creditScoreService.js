const creditScoreRepo = require('../repositories/creditScoreRepository');
const AppError        = require('../utils/AppError');

const getOverallRating = (score) => {
  if (score >= 750) return 'excellent';
  if (score >= 700) return 'good';
  if (score >= 650) return 'fair';
  return 'needs_work';
};

const getCreditScore = async (userId) => {
  const history = await creditScoreRepo.findHistoryByUserId(userId);
  if (!history.length) throw new AppError('No credit score data found', 404);

  const current  = history[0];
  const previous = history[1] || null;

  const currentScore  = parseInt(current.score);
  const monthlyChange = previous ? currentScore - parseInt(previous.score) : 0;

  const insights = {
    utilizationScore:    current.utilization_score    ?? null,
    paymentHistoryScore: current.payment_history_score ?? null,
    creditAgeScore:      current.credit_age_score      ?? null,
    overallRating:       getOverallRating(currentScore),
  };

  return {
    current: {
      ...current,
      score: currentScore,
    },
    history,
    insights,
    monthlyChange,
  };
};

module.exports = { getCreditScore };
