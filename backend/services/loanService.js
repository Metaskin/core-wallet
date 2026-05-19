const { withTransaction } = require('../config/database');
const loanRepo            = require('../repositories/loanRepository');
const AppError            = require('../utils/AppError');
const { notify }          = require('./notificationService');

const getMyLoans = async (userId) => {
  const loans = await loanRepo.findByUserId(userId);
  return loans.map(loan => {
    const principal         = parseFloat(loan.principal_amount || loan.principal);
    const remainingBalance  = parseFloat(loan.remaining_balance);
    const payoffPercentage  = principal > 0
      ? parseFloat(((principal - remainingBalance) / principal * 100).toFixed(2))
      : 0;
    return { ...loan, payoff_percentage: payoffPercentage };
  });
};

const getLoanDetail = async (id, userId) => {
  const loan = await loanRepo.findById(id);
  if (!loan) throw new AppError('Loan not found', 404);
  if (loan.user_id !== userId) throw new AppError('Not authorised to view this loan', 403);

  const payments = await loanRepo.findPaymentsByLoanId(id);
  return { ...loan, payments };
};

const makePayment = async (loanId, userId, amount) => {
  const loanCheck = await loanRepo.findById(loanId);
  if (!loanCheck) throw new AppError('Loan not found', 404);
  if (loanCheck.user_id !== userId) throw new AppError('Not authorised to make payment on this loan', 403);

  let _notif = null;

  const payment = await withTransaction(async (client) => {
    // Re-fetch inside transaction with lock
    const { rows } = await client.query(
      `SELECT * FROM loans WHERE id = $1 FOR UPDATE`,
      [loanId]
    );
    const loan = rows[0];
    if (!loan) throw new AppError('Loan not found', 404);

    const remainingBalance = parseFloat(loan.remaining_balance);
    const interestRate     = parseFloat(loan.interest_rate);

    const interestPortion  = remainingBalance * (interestRate / 100 / 12);
    const principalPortion = amount - interestPortion;
    const newBalance       = Math.max(0, remainingBalance - principalPortion);

    if (amount <= 0) throw new AppError('Payment amount must be greater than zero', 400);
    if (amount > remainingBalance + interestPortion) {
      throw new AppError('Payment amount exceeds outstanding balance', 400);
    }

    const result = await loanRepo.makePayment({
      loanId,
      amount,
      principalPaid:    principalPortion,
      interestPaid:     interestPortion,
      remainingBalance: newBalance,
    }, client);

    _notif = { userId, amount, loanId, reference: loan.loan_number || loanId };
    return result;
  });

  if (_notif) {
    notify({
      userId:   _notif.userId,
      type:     'loan_payment_made',
      title:    'Loan payment made',
      message:  `Your loan payment of $${parseFloat(_notif.amount).toFixed(2)} has been processed successfully.`,
      severity: 'success',
      metadata: { loanId: _notif.loanId, amount: _notif.amount },
    });
  }

  return payment;
};

module.exports = { getMyLoans, getLoanDetail, makePayment };
