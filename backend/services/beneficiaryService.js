const beneficiaryRepo = require('../repositories/beneficiaryRepository');
const AppError        = require('../utils/AppError');

const getMyBeneficiaries = async (userId) => {
  return beneficiaryRepo.findByUserId(userId);
};

const addBeneficiary = async (userId, data) => {
  const { name, relationship, dateOfBirth, email, phone, address, percentage, isEmergencyContact } = data;

  // Validate total percentage won't exceed 100 after add
  if (percentage !== undefined && percentage !== null) {
    const existing = await beneficiaryRepo.findByUserId(userId);
    const totalExisting = existing.reduce((sum, b) => sum + parseFloat(b.percentage || 0), 0);
    if (totalExisting + parseFloat(percentage) > 100) {
      throw new AppError(`Total beneficiary percentage cannot exceed 100%. Currently at ${totalExisting.toFixed(2)}%`, 400);
    }
  }

  return beneficiaryRepo.create({ userId, name, relationship, dateOfBirth, email, phone, address, percentage, isEmergencyContact });
};

const updateBeneficiary = async (id, userId, data) => {
  const beneficiary = await beneficiaryRepo.findById(id);
  if (!beneficiary) throw new AppError('Beneficiary not found', 404);
  if (beneficiary.user_id !== userId) throw new AppError('Not authorised to update this beneficiary', 403);

  return beneficiaryRepo.update(id, data);
};

const deleteBeneficiary = async (id, userId) => {
  const beneficiary = await beneficiaryRepo.findById(id);
  if (!beneficiary) throw new AppError('Beneficiary not found', 404);
  if (beneficiary.user_id !== userId) throw new AppError('Not authorised to delete this beneficiary', 403);

  await beneficiaryRepo.remove(id);
};

module.exports = { getMyBeneficiaries, addBeneficiary, updateBeneficiary, deleteBeneficiary };
