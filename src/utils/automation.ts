import { supabase } from '../lib/supabase';

interface MessageData {
    phone: string;
    customerName: string;
    type: 'welcome' | 'bill_reminder' | 'operator_report';
    details?: any;
}

export const sendAutomationMessage = async ({ phone, customerName, type, details }: MessageData) => {
    // Standardize phone number
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    let message = '';

    switch (type) {
        case 'welcome':
            message = `*Welcome to KKR CABLE NETWORKS!* 📺\n\nHello ${customerName},\nYour connection has been successfully established.\n\n*Details:*\nPackage: Base Pack\nBox ID: ${details?.box_id || 'N/A'}\n\nThank you for choosing us! 🙏`;
            break;
        case 'bill_reminder':
            message = `*Bill Reminder - KKR CABLE NETWORKS* 🧾\n\nHello ${customerName},\nYour bill for ${details?.period} of ₹${details?.amount} is pending.\n\n*Due Date:* 10th of the month.\nPlease pay to avoid disconnection.\n\nContact: 91kkrcablenetworks@gmail.com`;
            break;
        case 'operator_report':
            message = `*KKR CABLE - OPERATOR REPORT* 📊\n\nMonthly status update for ${details?.month}/${details?.year}:\n- Total Customers: ${details?.total}\n- Active: ${details?.active}\n- Pending Collections: ₹${details?.pending}`;
            break;
    }

    // 1. Log the notification attempt in Supabase
    try {
        await supabase.from('notifications').insert({
            message: `Sent ${type} to ${customerName} (${phone})`,
            type: type === 'operator_report' ? 'report' : 'info',
            created_at: new Date().toISOString()
        });
    } catch (e) {
        console.error('Error logging notification:', e);
    }

    // 2. Return the WhatsApp link (Manual trigger for now as requested for reliability)
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // For automation, we open the link in a new tab if it's a one-off
    // In a real cloud environment, a server would send this via Twilio/Interakt
    return whatsappLink;
};
