const express = require('express');
const router = express.Router();

// In-memory storage for borrowers
let borrowers = [
  { 
    id: 1, 
    name: "Juan Dela Cruz", 
    email: "juan@email.com",
    phone: "09171234567",
    address: "Manila, Philippines",
    createdAt: new Date().toISOString()
  }
];

// Counter for generating new IDs
let nextId = 2;

/**
 * GET /borrowers
 * Returns all borrowers
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: borrowers.length,
    data: borrowers
  });
});

/**
 * GET /borrowers/:id
 * Returns a specific borrower by ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const borrower = borrowers.find(b => b.id === id);
  
  if (!borrower) {
    return res.status(404).json({
      success: false,
      message: `Borrower with ID ${id} not found`
    });
  }
  
  res.json({
    success: true,
    data: borrower
  });
});

/**
 * POST /borrowers
 * Adds a new borrower
 */
router.post('/', (req, res) => {
  const { name, email, phone, address } = req.body;
  
  // Validation
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: "Name and email are required"
    });
  }
  
  // Check if email already exists
  const existingBorrower = borrowers.find(b => b.email === email);
  if (existingBorrower) {
    return res.status(409).json({
      success: false,
      message: "Borrower with this email already exists"
    });
  }
  
  // Create new borrower
  const newBorrower = {
    id: nextId++,
    name,
    email,
    phone: phone || null,
    address: address || null,
    createdAt: new Date().toISOString()
  };
  
  borrowers.push(newBorrower);
  
  res.status(201).json({
    success: true,
    message: "Borrower created successfully",
    data: newBorrower
  });
});

/**
 * PUT /borrowers/:id
 * Updates an existing borrower
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, phone, address } = req.body;
  
  const borrowerIndex = borrowers.findIndex(b => b.id === id);
  
  if (borrowerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Borrower with ID ${id} not found`
    });
  }
  
  // Update borrower
  borrowers[borrowerIndex] = {
    ...borrowers[borrowerIndex],
    name: name || borrowers[borrowerIndex].name,
    email: email || borrowers[borrowerIndex].email,
    phone: phone !== undefined ? phone : borrowers[borrowerIndex].phone,
    address: address !== undefined ? address : borrowers[borrowerIndex].address,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: "Borrower updated successfully",
    data: borrowers[borrowerIndex]
  });
});

/**
 * DELETE /borrowers/:id
 * Deletes a borrower
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const borrowerIndex = borrowers.findIndex(b => b.id === id);
  
  if (borrowerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Borrower with ID ${id} not found`
    });
  }
  
  const deletedBorrower = borrowers.splice(borrowerIndex, 1)[0];
  
  res.json({
    success: true,
    message: "Borrower deleted successfully",
    data: deletedBorrower
  });
});

module.exports = router;