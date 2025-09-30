const amqp = require('amqplib');
const config = require('./config');

class LoanProducer {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      console.log('Connecting to RabbitMQ (CloudAMQP)...');
      this.connection = await amqp.connect(config.rabbitMQ.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(config.rabbitMQ.queue, { durable: true });
      console.log('✓ Producer connected to RabbitMQ');
      console.log('✓ Queue ready:', config.rabbitMQ.queue);
    } catch (error) {
      console.error('❌ Producer connection error:', error.message);
      throw error;
    }
  }

  async sendLoanRequest(loanRequest) {
    try {
      const message = JSON.stringify(loanRequest);
      this.channel.sendToQueue(
        config.rabbitMQ.queue,
        Buffer.from(message),
        { persistent: true }
      );
      
      console.log(`📤 Loan request submitted: ${loanRequest.borrower}, ₱${loanRequest.amount.toLocaleString()}, ${loanRequest.term} months`);
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error.message);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      console.log('✓ Producer connection closed');
    } catch (error) {
      console.error('Error closing connection:', error.message);
    }
  }
}

// Demo: Send multiple loan requests
async function runProducerDemo() {
  const producer = new LoanProducer();
  
  try {
    await producer.connect();

    console.log('\n--- Starting Loan Request Submission ---\n');

    const loanRequests = [
      {
        id: Date.now() + 1,
        borrower: 'Juan Dela Cruz',
        amount: 30000,
        term: 12,
        timestamp: new Date().toISOString()
      },
      {
        id: Date.now() + 2,
        borrower: 'Maria Santos',
        amount: 75000,
        term: 24,
        timestamp: new Date().toISOString()
      },
      {
        id: Date.now() + 3,
        borrower: 'Pedro Reyes',
        amount: 45000,
        term: 18,
        timestamp: new Date().toISOString()
      }
    ];

    for (const request of loanRequests) {
      await producer.sendLoanRequest(request);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }

    console.log('\n--- All loan requests sent! ---\n');

    // Close after 2 seconds
    setTimeout(async () => {
      await producer.close();
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run demo if executed directly
if (require.main === module) {
  runProducerDemo().catch(console.error);
}

module.exports = LoanProducer;