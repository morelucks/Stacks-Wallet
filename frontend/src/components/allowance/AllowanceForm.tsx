import React, { useState } from 'react';
import { AllowanceFormData } from '../../types/allowance';
import { validateStacksAddress, validateAmount } from '../../utils/allowanceValidation';
import './allowance.css';

interface AllowanceFormProps {
  onSubmit: (data: AllowanceFormData) => void;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
}

const AllowanceForm: React.FC<AllowanceFormProps> = ({
  onSubmit,
  loading,
  error,
  onClearError,
}) => {
  const [formData, setFormData] = useState<AllowanceFormData>({
    spender: '',
    amount: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    spender?: string;
    amount?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { spender?: string; amount?: string } = {};
    
    // Validate spender address
    if (!formData.spender) {
      errors.spender = 'Spender address is required';
    } else if (!validateStacksAddress(formData.spender)) {
      errors.spender = 'Invalid Stacks address format';
    }
    
    // Validate amount
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof AllowanceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (error) {
      onClearError();
    }
  };

  const isFormValid = formData.spender && formData.amount && Object.keys(validationErrors).length === 0;

  return (
    <form onSubmit={handleSubmit} className="allowance-form">
      <div className="grid two">
        <label className="field">
          <span>Spender Address</span>
          <input
            type="text"
            value={formData.spender}
            onChange={(e) => handleInputChange('spender', e.target.value)}
            placeholder="ST... address to grant allowance"
            className={validationErrors.spender ? 'error-input' : ''}
            required
          />
          {validationErrors.spender && (
            <span className="field-error">{validationErrors.spender}</span>
          )}
        </label>
        <label className="field">
          <span>Amount</span>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="Amount to approve"
            min="1"
            step="1"
            className={validationErrors.amount ? 'error-input' : ''}
            required
          />
          {validationErrors.amount && (
            <span className="field-error">{validationErrors.amount}</span>
          )}
        </label>
      </div>
      
      {error && (
        <div className="error" style={{ marginTop: '1rem' }}>
          {error}
          <button 
            type="button" 
            onClick={onClearError}
            style={{ 
              marginLeft: '1rem', 
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="actions" style={{ marginTop: '1rem' }}>
        <button type="submit" disabled={loading || !isFormValid}>
          {loading ? 'Approving...' : 'Approve Allowance'}
        </button>
      </div>
    </form>
  );
};

export default AllowanceForm;