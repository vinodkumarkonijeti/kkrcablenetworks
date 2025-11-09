const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

const twilioAccountSid = functions.config().twilio?.account_sid;
const twilioAuthToken = functions.config().twilio?.auth_token;
const twilioWhatsAppNumber = functions.config().twilio?.whatsapp_number;

exports.monthlyBillingAutomation = functions.pubsub
  .schedule('0 0 29 * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const usersSnapshot = await db.collection('users').get();
      const customersSnapshot = await db.collection('customers').get();

      const activeCustomers = [];
      const deactiveCustomers = [];

      for (const doc of customersSnapshot.docs) {
        const customer = doc.data();
        const customerId = doc.id;

        if (customer.status === 'Active') {
          activeCustomers.push(customer);
        } else {
          deactiveCustomers.push(customer);
        }

        const nextBillDate = new Date();
        nextBillDate.setDate(nextBillDate.getDate() + 30);

        await db.collection('customers').doc(customerId).update({
          billStatus: 'Not Paid',
          updatedAt: new Date()
        });

        if (twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
          const client = twilio(twilioAccountSid, twilioAuthToken);

          try {
            await client.messages.create({
              body: `Dear ${customer.firstName} ${customer.lastName}, your cable bill of ₹${customer.billAmount} is due. Please pay before the due date. Thank you! - KKR CABLE NETWORKS`,
              from: `whatsapp:${twilioWhatsAppNumber}`,
              to: `whatsapp:${customer.phoneNumber}`
            });
          } catch (error) {
            console.error(`Error sending WhatsApp to customer ${customerId}:`, error);
          }
        }
      }

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();

        if (userData.phoneNumber && twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
          const client = twilio(twilioAccountSid, twilioAuthToken);

          const customerListMessage = `Monthly Report - KKR CABLE NETWORKS\n\n` +
            `Active Customers: ${activeCustomers.length}\n` +
            `Deactive Customers: ${deactiveCustomers.length}\n\n` +
            `Total Customers: ${activeCustomers.length + deactiveCustomers.length}`;

          try {
            await client.messages.create({
              body: customerListMessage,
              from: `whatsapp:${twilioWhatsAppNumber}`,
              to: `whatsapp:${userData.phoneNumber}`
            });
          } catch (error) {
            console.error(`Error sending WhatsApp to operator ${userDoc.id}:`, error);
          }
        }
      }

      console.log('Monthly billing automation completed successfully');
      return null;
    } catch (error) {
      console.error('Error in monthly billing automation:', error);
      throw error;
    }
  });
