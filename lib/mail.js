import nodemailer from 'nodemailer';

const port = parseInt(process.env.SMTP_PORT || '465');
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const secure = port === 465;

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: port,
    secure: secure,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html, text, replyTo, fromName }) {
    try {
        const smtpUser = process.env.SMTP_USER;

        // If fromName and replyTo are provided, we show "Admin Name <admin@email.com>" 
        // as the display name, while the technical sender remains the SMTP_USER.
        const fromDisplayName = fromName || 'Fakhri IT Services (India) Pvt. Ltd.';

        console.log(`[Email] Sending to: ${to} | on behalf of: ${fromDisplayName}`);

        const info = await transporter.sendMail({
            from: `"${fromDisplayName}" <${process.env.SMTP_FROM || smtpUser}>`,
            to,
            subject,
            text,
            html,
            replyTo: replyTo || smtpUser,
        });

        console.log(`[Email] Success! ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email] Error details:', error.message);
        return { success: false, error: error.message };
    }
}

export const emailTemplates = {
    contactForm: (data) => ({
        subject: `New Contact Inquiry from ${data.name}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #880808;">New Contact Inquiry</h2>
                <div style="background: #fdf2f2; padding: 15px; border-left: 4px solid #880808; margin-top: 20px;">
                    <p><strong>Name:</strong> ${data.name}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
                    <p><strong>Subject:</strong> ${data.subject || 'General Inquiry'}</p>
                </div>
                <div style="background: #f9fafb; padding: 15px; border-top: 1px solid #eee; margin-top: 20px;">
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${data.message}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.fakhriitservices.com/login" style="display: inline-block; padding: 12px 25px; background-color: #880808; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Go to Dashboard</a>
                </div>
                <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">This email was sent from the contact form on Fakhri IT Services (India) Pvt. Ltd..</p>
            </div>
        `,
        text: `New Contact Inquiry\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || 'Not provided'}\nSubject: ${data.subject || 'General Inquiry'}\n\nMessage:\n${data.message}\n\nGo to Dashboard: https://www.fakhriitservices.com/login`
    }),

    contactAcknowledgment: (data) => ({
        subject: `Thank you for contacting Fakhri IT Services (India) Pvt. Ltd.`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #880808;">
                    <h1 style="color: #880808; margin: 0; font-size: 24px;">Fakhri IT Services (India) Pvt. Ltd.</h1>
                </div>
                <div style="padding: 30px 20px;">
                    <h2 style="color: #333; margin-top: 0;">Hi ${data.name},</h2>
                    <p style="color: #555; line-height: 1.6;">Thank you for reaching out to us. We have received your inquiry and our team will get back to you shortly.</p>
                    <div style="background: #fdf2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #880808; margin-top: 25px;">
                        <p style="margin-top: 0; font-weight: bold; color: #880808;">Your Message:</p>
                        <p style="color: #444; margin-bottom: 0; font-style: italic;">"${data.message}"</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://www.fakhriitservices.com/login" style="display: inline-block; padding: 12px 25px; background-color: #880808; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Go to Dashboard</a>
                    </div>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #777; font-size: 14px;">Best Regards,<br><strong style="color: #880808;">The Fakhri IT Team</strong></p>
                </div>
            </div>
        `,
        text: `Hi ${data.name},\n\nThank you for reaching out to us. We have received your inquiry and our team will get back to you shortly.\n\nGo to Dashboard: https://www.fakhriitservices.com/\n\nBest Regards,\nThe Fakhri IT Team`
    }),

    clientMessage: (data) => ({
        subject: data.subject || "Important Update from Fakhri IT Services (India) Pvt. Ltd.",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;">
                <!-- Header with Brand Color -->
                <div style="background-color: #880808; padding: 25px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">FAKHRI IT SERVICES (INDIA) PVT. LTD.</h1>
                </div>

                <div style="padding: 40px 30px;">
                    <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px; font-weight: 600;">Hello,</h2>
                    <div style="color: #4a4a4a; line-height: 1.8; font-size: 16px;">
                        ${data.body}
                    </div>
                    ${data.includeDashboardButton ? `
                    <div style="text-align: center; margin-top: 40px;">
                        <a href="https://www.fakhriitservices.com/login" style="display: inline-block; padding: 12px 25px; background-color: #880808; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Go to Dashboard</a>
                    </div>
                    ` : ''}
                </div>

                <!-- Sign-off -->
                <div style="padding: 0 30px 40px 30px;">
                    <div style="border-top: 1px solid #f0f0f0; padding-top: 30px;">
                        <p style="margin: 0; color: #1a1a1a; font-weight: 600;">Best Regards,</p>
                        <p style="margin: 5px 0 0 0; color: #880808; font-size: 18px; font-weight: 700;">${data.adminName}</p>
                        <p style="margin: 2px 0 0 0; color: #777; font-size: 13px;">Team Leader | Fakhri IT Services (India) Pvt. Ltd.</p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999; font-size: 12px;">
                        Digital Goods & IT Services Excellence<br>
                        © ${new Date().getFullYear()} Fakhri IT Services (India) Pvt. Ltd.. All rights reserved.
                    </p>
                </div>
            </div>
        `,
        text: `Hello,\n\n${data.body.replace(/<[^>]*>/g, '')}\n\n${data.includeDashboardButton ? 'Go to Dashboard: https://www.fakhriitservices.com/\n\n' : ''}Best Regards,\n${data.adminName}\nTeam Leader | Fakhri IT Services (India) Pvt. Ltd.`
    }),

    notification: (data) => ({
        subject: `[Notification] ${data.title}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #880808; padding: 15px 25px;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">Fakhri IT Services (India) Pvt. Ltd.</h2>
                </div>
                <div style="padding: 30px;">
                    <h3 style="color: #1a1a1a; margin-top: 0; font-size: 20px;">${data.title}</h3>
                    <p style="color: #4a4a4a; line-height: 1.6; font-size: 15px;">${data.message}</p>
                    <div style="margin-top: 25px;">
                        ${data.link && data.link !== '#' ? `
                            <a href="${data.link}" style="display: inline-block; padding: 10px 20px; background-color: #880808; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 10px;">View Details</a>
                        ` : ''}
                        <a href="https://www.fakhriitservices.com/login" style="display: inline-block; padding: 10px 20px; background-color: #333; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Go to Dashboard</a>
                    </div>
                </div>
                <div style="background-color: #f8f9fa; padding: 15px 25px; border-top: 1px solid #eeeeee; text-align: center;">
                    <p style="margin: 0; color: #999; font-size: 11px;">You received this email because a notification was triggered for your account.</p>
                </div>
            </div>
        `,
        text: `Fakhri IT Services (India) Pvt. Ltd. Notification\n\n${data.title}\n${data.message}\n\nView Details: ${data.link}\nGo to Dashboard: https://www.fakhriitservices.com/login`
    }),

    taskEventNotification: (data) => {
        const {
            eventTitle,
            task,
            client,
            initiator,
            statusColor = '#00af50',
            priorityColor = '#0069bf',
            dueDateColor = '#c00000'
        } = data;

        return {
            subject: `[Work Update] ${task.title}, ${task.status} and ${task.taskId}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); background-color: #ffffff;">
                    <!-- Brand Header -->
                    <div style="background-color: #880808; padding: 20px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">FAKHRI IT SERVICES (INDIA) PVT. LTD.</h1>
                    </div>

                    <div style="padding: 30px;">
                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Dear Team,</p>
                        <p style="margin: 0 0 20px 0; font-size: 15px; color: #555;">We hope you are doing well.</p>
                        <p style="margin: 0 0 25px 0; font-size: 15px; color: #555; border-left: 4px solid #880808; padding-left: 15px; font-style: italic;">
                            ${eventTitle} in our system for your account. Here are the details:
                        </p>
                        
                        <!-- Main Table -->
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #ddd; table-layout: fixed;">
                            <thead>
                                <tr style="background-color: #333; color: #ffffff;">
                                    <th colspan="2" style="padding: 12px; font-size: 16px; text-align: center; border: 1px solid #333; font-style: italic;">Work Update Summary</th>
                                </tr>
                            </thead>
                            <tbody style="font-size: 14px; color: #333;">
                                <tr>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd; width: 35%; background-color: #f9f9f9; font-weight: 600;">Account Name</td>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd;">${task.client?.company || client?.company || task.client?.companyName || client?.companyName || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">Marketplace</td>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd;">${client?.marketplace || 'Amazon.in'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">Plan for the week</td>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd;">${task.planForWeek || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">Task ID</td>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd;">${task.taskId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">Title</td>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd;">${task.title}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">Your Account POC</td>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd;">
                                        <strong>${client?.managerDetails?.name || client?.manager || 'N/A'}</strong><br>
                                        <span style="font-size: 12px; color: #666;">
                                            Email: ${client?.managerDetails?.email || 'N/A'}<br>
                                            Phone: ${client?.managerDetails?.phone || 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">Supervisor </td>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd;">
                                        <strong>${client?.supervisorDetails?.name || 'N/A'}</strong><br>
                                        <span style="font-size: 12px; color: #666;">
                                            Email: ${client?.supervisorDetails?.email || 'N/A'}<br>
                                            Phone: ${client?.supervisorDetails?.phone || 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">Assigned To</td>
                                    <td style="padding: 10px 15px; border: 1px solid #ddd;">${task.assignee?.name || 'Unassigned'}</td>
                                </tr>
                                <tr style="background-color: ${dueDateColor};">
                                    <td style="padding: 12px 15px; border: 1px solid #ddd; font-weight: 600;">Due Date</td>
                                    <td style="padding: 12px 15px; border: 1px solid #ddd; font-weight: 600;">${task.dueDate || 'N/A'}</td>
                                </tr>
                                <tr style="background-color: ${priorityColor};">
                                    <td style="padding: 12px 15px; border: 1px solid #ddd; font-weight: 600;">Priority</td>
                                    <td style="padding: 12px 15px; border: 1px solid #ddd; font-weight: 600;">${task.priority || 'Medium'}</td>
                                </tr>
                                <tr style="background-color: ${statusColor};">
                                    <td style="padding: 12px 15px; border: 1px solid #ddd; font-weight: 600;">Task Status</td>
                                    <td style="padding: 12px 15px; border: 1px solid #ddd; font-weight: 600;">${task.status}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600; vertical-align: top;">Task Description</td>
                                    <td style="padding: 15px; border: 1px solid #ddd; line-height: 1.5; word-break: break-word;">${task.description || 'N/A'}</td>
                                </tr>
                                ${task.attachment && task.attachment.url ? `
                                <tr>
                                    <td style="padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600; vertical-align: top;">Attachment</td>
                                    <td style="padding: 15px; border: 1px solid #ddd; line-height: 1.5; white-space: pre-wrap; word-break: break-all;"><a href="${task.attachment.url}" target="_blank" style="color: #880808; text-decoration: underline; font-weight: 600;">${task.attachment.name || 'View/Download Attachment'}</a></td>
                                </tr>
                                ` : ''}
                            </tbody>
                        </table>

                        <div style="text-align: center; margin-bottom: 35px;">
                            <a href="https://www.fakhriitservices.com/login" style="display: inline-block; padding: 14px 35px; background-color: #880808; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(136, 8, 8, 0.25);">Go to Dashboard</a>
                        </div>

                        <!-- Initiator Section -->
                        <div style="margin-bottom: 30px;">
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid #4a4a00;">
                                <thead style="background-color: #4a4a00; color: #ffffff;">
                                    <tr>
                                        <th colspan="3" style="padding: 10px; text-align: left; font-size: 14px;">Activity Initiated By:</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 8px 12px; border: 1px solid #4a4a00; font-weight: 600; font-size: 13px; background-color: #f5f5f5;">Name</td>
                                        <td style="padding: 8px 12px; border: 1px solid #4a4a00; font-weight: 600; font-size: 13px; background-color: #f5f5f5;">Email ID</td>
                                        <td style="padding: 8px 12px; border: 1px solid #4a4a00; font-weight: 600; font-size: 13px; background-color: #f5f5f5;">Phone Number</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 12px; border: 1px solid #4a4a00; font-size: 13px;">${initiator?.name || 'N/A'}</td>
                                        <td style="padding: 8px 12px; border: 1px solid #4a4a00; font-size: 13px;"><a href="mailto:${initiator?.email}" style="color: #880808; text-decoration: none;">${initiator?.email || 'N/A'}</a></td>
                                        <td style="padding: 8px 12px; border: 1px solid #4a4a00; font-size: 13px;">${initiator?.phone || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Escalation Section -->
                        <div style="background-color: #fdf2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #880808;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #333;">
                                Additionally, for any <strong>feedback, queries, or complaints</strong>, kindly use the escalation link below:
                            </p>
                            <p style="margin: 0; font-size: 14px;">
                                <strong>Escalation / Feedback Link:</strong> <br>
                                <a href="https://www.fakhriitservices.com/contact" style="color: #880808; text-decoration: underline; font-weight: 600;">https://www.fakhriitservices.com/contact</a>
                            </p>
                        </div>
                        
                        <p style="margin: 25px 0 0 0; font-size: 14px; color: #555;">Please use this link to report any concerns so we can address them promptly.</p>
                        <p style="margin: 20px 0 0 0; font-size: 14px; color: #555;">Thank you for your continued cooperation.</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 15px; color: #333;">Best regards,</p>
                            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 700; ">${initiator?.name || 'N/A'}</p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()} Fakhri IT Services (India) Pvt. Ltd.. All rights reserved.</p>
                    </div>
                </div>
            `,
            text: `Dear Team,\n\nWe hope you are doing well.\n\n${eventTitle} in our system for your account.\n\nTask details:\nID: ${task.taskId}\nTitle: ${task.title}\nStatus: ${task.status}\n\nGo to Dashboard: https://www.fakhriitservices.com/login\n\nEscalation Link: https://www.fakhriitservices.com/contact\n\nThank you for your continued cooperation.\n\nBest regards,\nFakhri IT Services (India) Pvt. Ltd. Team`
        };
    },


    welcomeClient: (data) => ({
        subject: `Welcome to Fakhri IT Services (India) Pvt. Ltd., ${data.name}!`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #880808; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome Aboard!</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <h2 style="color: #333; margin-top: 0;">Hi ${data.name},</h2>
                    <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
                        We are thrilled to have you join Fakhri IT Services (India) Pvt. Ltd.. You've taken the first step towards transforming your digital presence with our premium IT solutions.
                    </p>
                    <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
                        To get started, please log in to your dashboard and choose a plan that best fits your business needs. Our team is ready to assist you every step of the way.
                    </p>
                    <a href="https://www.fakhriitservices.com/login" style="display: inline-block; padding: 14px 28px; background-color: #880808; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #777; font-size: 14px;">Need help? <a href="mailto:support@fakhriitservices.com" style="color: #880808; text-decoration: none;">Contact Support</a></p>
                </div>
            </div>
        `,
        text: `Welcome to Fakhri IT Services (India) Pvt. Ltd., ${data.name}!\n\nWe are thrilled to have you join us. Please log in to your dashboard and choose a plan to get started.\n\nGo to Dashboard: https://www.fakhriitservices.com/\n\nBest Regards,\nThe Fakhri IT Team`
    }),
    welcomeAccount: (data) => ({
        subject: `Welcome to Fakhri IT Services, ${data.name}! Your Account Details Inside`,
        html: `
            <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                <div style="background-color: #880808; padding: 35px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome Aboard! 🎉</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <p style="font-size: 18px; color: #1e293b; font-weight: 600; margin-top: 0;">Hi ${data.name},</p>
                    <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 25px;">
                        We are thrilled to officially welcome you to <strong>Fakhri IT Services (India) Pvt. Ltd.</strong>! Your account has been successfully provisioned. You have taken the first step towards transforming your digital presence with our premium IT solutions.
                    </p>
                    
                    <h3 style="color: #0f172a; margin-top: 30px; margin-bottom: 15px; font-size: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Your Login Credentials</h3>
                    
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 0 0 30px 0; border: 1px solid #e2e8f0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; width: 30%;">Access Portal</td>
                                <td style="padding: 10px 0; color: #0f172a; font-weight: 500;"><a href="${data.dashboardUrl || 'https://www.fakhriitservices.com/login'}" style="color: #880808; text-decoration: none;">fakhriitservices.com/login</a></td>
                            </tr>
                            <tr style="border-top: 1px dashed #cbd5e1;">
                                <td style="padding: 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Email ID</td>
                                <td style="padding: 10px 0; color: #0f172a; font-weight: 600;">${data.email}</td>
                            </tr>
                            <tr style="border-top: 1px dashed #cbd5e1;">
                                <td style="padding: 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Password</td>
                                <td style="padding: 10px 0;">
                                    <span style="background-color: #f1f5f9; color: #880808; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 15px; font-weight: 700; border: 1px solid #e2e8f0;">${data.password}</span>
                                </td>
                            </tr>
                            ${data.company ? `
                            <tr style="border-top: 1px dashed #cbd5e1;">
                                <td style="padding: 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Company</td>
                                <td style="padding: 10px 0; color: #0f172a; font-weight: 500;">${data.company}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>

                   

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${'https://www.fakhriitservices.com/login?role=admin'}" style="display: inline-block; padding: 14px 35px; background-color: #880808; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(136, 8, 8, 0.2);">Log In to Your Dashboard</a>
                    </div>
                </div>
               
                <div style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;">Need help getting started? <a href="mailto:support@fakhriitservices.com" style="color: #880808; font-weight: 600; text-decoration: none;">Contact our support team</a></p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Fakhri IT Services (India) Pvt. Ltd.. All rights reserved.</p>
                </div>
            </div>
        `,
        text: `Welcome to Fakhri IT Services, ${data.name}!\n\nYour account has been successfully set up. Below are your login details:\n\nEmail: ${data.email}\nPassword: ${data.password}\n\nLog in here: ${data.dashboardUrl || 'https://www.fakhriitservices.com/login'}${data.showSecurityTip !== false ? '\n\nSecurity Tip: You can change this password inside your profile settings.' : ''}`
    }),
    otpVerification: (data) => ({
        subject: `Your Verification Code: ${data.otp} - Fakhri IT Services (India) Pvt. Ltd.`,
        html: `
            <div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                <div style="background-color: #880808; padding: 35px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Email Verification 🔐</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <p style="font-size: 18px; color: #1e293b; font-weight: 600; margin-top: 0;">Hi ${data.name},</p>
                    <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 30px;">
                        You're almost there! Use the verification code below to complete your account registration at <strong>Fakhri IT Services (India) Pvt. Ltd.</strong>.
                    </p>
                    
                    <div style="background-color: #f8fafc; border-radius: 16px; padding: 30px; margin: 0 auto 30px auto; max-width: 300px; border: 2px dashed #880808;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Your Verification Code</p>
                        <p style="margin: 0; font-size: 40px; font-weight: 800; color: #880808; letter-spacing: 8px; font-family: monospace;">${data.otp}</p>
                    </div>

                    <div style="background-color: #fefce8; border-left: 4px solid #ca8a04; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px; text-align: left;">
                        <p style="margin: 0; color: #854d0e; font-size: 14px; line-height: 1.5;">
                            <strong>⏱ Note:</strong> This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
                        </p>
                    </div>
                </div>
               
                <div style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} Fakhri IT Services (India) Pvt. Ltd.. All rights reserved.</p>
                </div>
            </div>
        `,
        text: `Hi ${data.name},\n\nYour verification code is: ${data.otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
    }),
    passwordReset: (data) => ({
        subject: "Reset Your Password - Fakhri IT Services (India) Pvt. Ltd.",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #880808; padding: 25px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Password Reset Request</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <p style="font-size: 16px; color: #444;">Hello <strong>${data.name}</strong>,</p>
                    <p style="font-size: 15px; color: #666; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to set a new password. This link is valid for 24 hours.</p>
                    
                    <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
                        <a href="${data.resetUrl}" style="display: inline-block; padding: 14px 30px; background-color: #880808; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px rgba(136, 8, 8, 0.2);">Reset Password</a>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="https://www.fakhriitservices.com/login" style="display: inline-block; padding: 10px 20px; background-color: #333; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Go to Dashboard</a>
                    </div>

                    <p style="font-size: 13px; color: #999; margin-top: 30px;">If you didn't request a password reset, you can safely ignore this email.</p>
                    <p style="font-size: 12px; color: #aaa; margin-top: 20px;">Or copy and paste this link in your browser:<br>${data.resetUrl}</p>
                </div>
                <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999; font-size: 12px;">© ${new Date().getFullYear()} Fakhri IT Services (India) Pvt. Ltd.. All rights reserved.</p>
                </div>
            </div>
        `,
        text: `Hello ${data.name},\n\nWe received a request to reset your password. Please use the following link to reset it (valid for 24 hours):\n\n${data.resetUrl}\n\nGo to Dashboard: https://www.fakhriitservices.com/\n\nIf you didn't request this, please ignore this email.`
    })
};

export async function verifySMTP() {
    try {
        await transporter.verify();
        return { success: true };
    } catch (error) {
        console.error('SMTP Verification Failed:', error);
        return { success: false, error: error.message };
    }
}
