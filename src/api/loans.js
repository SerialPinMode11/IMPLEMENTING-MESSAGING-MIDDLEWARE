const express = require('express');
const router = express.Router();
const LoanProducer = require('../integration/middleware/producer');

// In-memory storage for loans
let loans = [
  { 
    id: 1, 
    borrowerId: 1, 
    amount: 5000, 
    term: 6,
    status: "active",
    approvalStatus: "approved",
    createdAt: new Date().toISOString()
  }
];

let nextId = 2;
let producer = null;

/**
 * Initialize RabbitMQ producer
 */
async function initProducer() {
  if (!producer) {
    try {
      producer = new LoanProducer();
      await producer.connect();
      console.log('✓ Loan API connected to message queue');
    } catch (error) {
      console.error('Failed to initialize producer:', error.message);
      // Continue without producer - system degrades gracefully
    }
  }
  return producer;
}

/**
 * GET /loans
 * Returns all loans
 */
router.get('/', (req, res) => {
  const { status, borrowerId } = req.query;
  
  let filteredLoans = loans;
  
  // Filter by status if provided
  if (status) {
    filteredLoans = filteredLoans.filter(loan => loan.status === status);
  }
  
  // Filter by borrowerId if provided
  if (borrowerId) {
    filteredLoans = filteredLoans.filter(loan => loan.borrowerId === parseInt(borrowerId));
  }
  
  res.json({
    success: true,
    count: filteredLoans.length,
    data: filteredLoans
  });
});

/**
 * GET /loans/:id
 * Returns a specific loan by ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const loan = loans.find(l => l.id === id);
  
  if (!loan) {
    return res.status(404).json({
      success: false,
      message: `Loan with ID ${id} not found`
    });
  }
  
  res.json({
    success: true,
    data: loan
  });
});

/**
 * POST /loans
 * Creates a new loan and sends to approval queue
 */
router.post('/', async (req, res) => {
  const { borrowerId, amount, term } = req.body;
  
  // Validation
  if (!borrowerId || !amount || !term) {
    return res.status(400).json({
      success: false,
      message: "borrowerId, amount, and term are required"
    });
  }
  
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Loan amount must be greater than 0"
    });
  }
  
  if (term <= 0 || term > 60) {
    return res.status(400).json({
      success: false,
      message: "Loan term must be between 1 and 60 months"
    });
  }
  
  // Create new loan with pending status
  const newLoan = {
    id: nextId++,
    borrowerId: parseInt(borrowerId),
    amount: parseFloat(amount),
    term: parseInt(term),
    status: "pending",
    approvalStatus: "pending_approval",
    interestRate: 5.5, // Default interest rate
    createdAt: new Date().toISOString()
  };
  
  loans.push(newLoan);
  
  // Send to approval queue asynchronously
  try {
    const prod = await initProducer();
    if (prod) {
      await prod.sendLoanRequest({
        id: newLoan.id,
        borrower: `Borrower ${borrowerId}`,
        borrowerId: borrowerId,
        amount: amount,
        term: term,
        timestamp: newLoan.createdAt
      });
      
      res.status(201).json({
        success: true,
        message: "Loan created and submitted for approval",
        data: newLoan,
        info: "Loan approval is being processed asynchronously"
      });
    } else {
      // Fallback if producer not available
      res.status(201).json({
        success: true,
        message: "Loan created (approval queue unavailable)",
        data: newLoan,
        warning: "Loan will require manual approval"
      });
    }
  } catch (error) {
    console.error('Error sending to queue:', error.message);
    res.status(201).json({
      success: true,
      message: "Loan created (approval queue error)",
      data: newLoan,
      warning: "Loan will require manual approval"
    });
  }
});

/**
 * PUT /loans/:id
 * Updates a loan (e.g., approval status)
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { status, approvalStatus, amount, term } = req.body;
  
  const loanIndex = loans.findIndex(l => l.id === id);
  
  if (loanIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Loan with ID ${id} not found`
    });
  }
  
  // Update loan
  loans[loanIndex] = {
    ...loans[loanIndex],
    status: status || loans[loanIndex].status,
    approvalStatus: approvalStatus || loans[loanIndex].approvalStatus,
    amount: amount || loans[loanIndex].amount,
    term: term || loans[loanIndex].term,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: "Loan updated successfully",
    data: loans[loanIndex]
  });
});

/**
 * DELETE /loans/:id
 * Deletes a loan
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const loanIndex = loans.findIndex(l => l.id === id);
  
  if (loanIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Loan with ID ${id} not found`
    });
  }
  
  const deletedLoan = loans.splice(loanIndex, 1)[0];
  
  res.json({
    success: true,
    message: "Loan deleted successfully",
    data: deletedLoan
  });
});

/**
 * GET /loans/borrower/:borrowerId
 * Returns all loans for a specific borrower
 */
router.get('/borrower/:borrowerId', (req, res) => {
  const borrowerId = parseInt(req.params.borrowerId);
  const borrowerLoans = loans.filter(l => l.borrowerId === borrowerId);
  
  res.json({
    success: true,
    borrowerId: borrowerId,
    count: borrowerLoans.length,
    data: borrowerLoans
  });
});

module.exports = router;