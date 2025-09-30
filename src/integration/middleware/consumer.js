const amqp = require('amqplib');
const config = require('./config');

class LoanConsumer {
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
      this.channel.prefetch(1);
      console.log('✓ Consumer connected to RabbitMQ');
      console.log('✓ Listening to queue:', config.rabbitMQ.queue);
      console.log('⏳ Waiting for loan approval requests...\n');
    } catch (error) {
      console.error('❌ Consumer connection error:', error.message);
      throw error;
    }
  }

  processLoanRequest(loanRequest) {
    const APPROVAL_THRESHOLD = 50000;
    const decision = loanRequest.amount <= APPROVAL_THRESHOLD ? 'APPROVED ✓' : 'REJECTED ✗';
    const reason = loanRequest.amount <= APPROVAL_THRESHOLD 
      ? 'Amount within approval limit'
      : 'Amount exceeds approval threshold (₱50,000)';

    console.log('═══════════════════════════════════════════');
    console.log(`📥 Processing: Loan request for ${loanRequest.borrower}`);
    console.log(`   Loan ID: ${loanRequest.id}`);
    console.log(`   Amount: ₱${loanRequest.amount.toLocaleString()}`);
    console.log(`   Term: ${loanRequest.term} months`);
    console.log(`   Submitted: ${new Date(loanRequest.timestamp).toLocaleString()}`);
    console.log(`   Decision: ${decision}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Processed at: ${new Date().toLocaleTimeString()}`);
    console.log('═══════════════════════════════════════════\n');

    return { 
      ...loanRequest, 
      decision: decision.includes('APPROVED') ? 'APPROVED' : 'REJECTED', 
      reason, 
      processedAt: new Date().toISOString() 
    };
  }

  async startConsuming() {
    this.channel.consume(config.rabbitMQ.queue, (msg) => {
      if (msg !== null) {
        try {
          const loanRequest = JSON.parse(msg.content.toString());
          
          // Simulate processing time
          setTimeout(() => {
            const result = this.processLoanRequest(loanRequest);
            this.channel.ack(msg);
          }, 1500); // 1.5 second processing time
        } catch (error) {
          console.error('❌ Error processing message:', error.message);
          this.channel.nack(msg, false, false); // Don't requeue on error
        }
      }
    });
  }

  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      console.log('✓ Consumer connection closed');
    } catch (error) {
      console.error('Error closing connection:', error.message);
    }
  }
}

// Run consumer
async function runConsumer() {
  const consumer = new LoanConsumer();
  
  try {
    await consumer.connect();
    await consumer.startConsuming();
    
    // Keep the process running
    console.log('Press Ctrl+C to stop the consumer\n');
  } catch (error) {
    console.error('❌ Consumer failed:', error.message);
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down consumer...');
    await consumer.close();
    process.exit(0);
  });
}

if (require.main === module) {
  runConsumer().catch(console.error);
}

module.exports = LoanConsumer;