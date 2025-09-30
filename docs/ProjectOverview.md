# Team Asset - Lending System with Message-Oriented Middleware

## Project Overview

The Lending System is a microservices-based application that implements asynchronous loan approval processing using Message-Oriented Middleware (MOM). The system enables borrowers to submit loan applications and receive immediate confirmation while the approval process happens asynchronously in the background.

---

## System Architecture

### Components

1. **REST API Server**
   - Express.js server handling HTTP requests
   - Endpoints for borrowers and loans management
   - Runs on port 3000

2. **Message Queue (RabbitMQ/CloudAMQP)**
   - Cloud-hosted message broker
   - Manages loan approval queue
   - Ensures reliable message delivery

3. **Producer Module (Loan Submission)**
   - Sends loan requests to approval queue
   - Integrated with REST API
   - Non-blocking operation

4. **Consumer Module (Approval Processing)**
   - Listens to approval queue
   - Processes loan requests asynchronously
   - Auto-approves/rejects based on amount

### Architecture Diagram

```
Client (Postman/Browser)
         |
         v
   REST API Server
    (Express.js)
         |
         +--> Borrowers API (/borrowers)
         |
         +--> Loans API (/loans)
                |
                v
         Producer Module
                |
                v
         RabbitMQ Queue
       (loan_approval_queue)
                |
                v
         Consumer Module
         (Approval Logic)
```

---

## Messaging Workflow

### How does the loan approval process work asynchronously?

The loan approval process uses RabbitMQ message queue to enable asynchronous communication between the Loan Module (producer) and the Approval Module (consumer). This decouples the loan submission from the approval processing.

#### Step 1: Loan Submission (Producer Side)
- User submits loan via POST /loans
- Loan Module creates record with status "pending_approval"
- Producer sends message to `loan_approval_queue`
- API returns immediate confirmation to user
- User doesn't wait for approval processing

#### Step 2: Message Queuing
- Message stored persistently in RabbitMQ queue
- FIFO (First In, First Out) ordering
- Messages persist even if consumer is offline
- No data loss during system failures

#### Step 3: Asynchronous Processing (Consumer Side)
- Consumer monitors queue continuously
- Retrieves and processes messages one by one
- Applies approval logic:
  - Amount ≤ ₱50,000 → Auto-approve
  - Amount > ₱50,000 → Reject (manual review needed)
- Acknowledges message after processing

#### Step 4: Decoupled Operation
- Modules operate independently
- Can update/scale/restart without affecting each other
- Communication only through message queue

### Benefits

1. **Non-Blocking** - Users get instant response
2. **Fault Tolerance** - Messages persist if services crash
3. **Scalability** - Add more consumers to process faster
4. **Decoupling** - Modules don't depend on each other
5. **Load Management** - Queue absorbs traffic spikes

---

## Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **RabbitMQ/CloudAMQP** - Message broker
- **amqplib** - RabbitMQ client library

---

## API Endpoints

### Borrowers Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /borrowers | Get all borrowers |
| GET | /borrowers/:id | Get borrower by ID |
| POST | /borrowers | Create new borrower |
| PUT | /borrowers/:id | Update borrower |
| DELETE | /borrowers/:id | Delete borrower |

### Loans Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /loans | Get all loans |
| GET | /loans/:id | Get loan by ID |
| POST | /loans | Create loan (sends to queue) |
| PUT | /loans/:id | Update loan status |
| DELETE | /loans/:id | Delete loan |
| GET | /loans/borrower/:id | Get loans by borrower |

---

## How to Run

### Prerequisites
- Node.js (v16+)
- npm
- CloudAMQP account

### Installation
```bash
npm install
```

### Running
**Terminal 1 - API Server:**
```bash
npm start
```

**Terminal 2 - Consumer:**
```bash
npm run consumer
```

**Terminal 3 - Test Producer:**
```bash
npm run producer
```

---

## Team Contributions

**Team Asset Members:**
- Member 1: REST API Development
- Member 2: Middleware Integration
- Member 3: Testing & Documentation
- Member 4: Server Setup

---

## Conclusion

This project demonstrates Message-Oriented Middleware for building scalable, reliable systems. The asynchronous architecture allows high-volume request handling while maintaining excellent user experience and system reliability.