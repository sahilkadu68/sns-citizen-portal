package com.sns.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Async
    public void sendRegistrationEmail(String toEmail, String fullName) {
        if (mailSender == null) { logger.warn("Mail not configured, skipping registration email to {}", toEmail); return; }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Welcome to Smart Nagrik Seva (SNS) Portal");
        message.setText("Dear " + fullName + ",\n\n" +
                "Your account has been successfully registered on the SNS platform.\n\n" +
                "You can now report civic issues, track complaint status, and contribute to city management.\n\n" +
                "Login here: " + frontendUrl + "/#/login\n\n" +
                "Best Regards,\n" +
                "Smart Nagrik Seva (SNS) Team");
        try { mailSender.send(message); } catch (Exception e) { logger.error("Failed to send registration email to {}: {}", toEmail, e.getMessage()); }
    }

    @Async
    public void sendStatusUpdateEmail(String toEmail, String complaintNumber, String status, String title) {
        if (mailSender == null) { logger.warn("Mail not configured, skipping status update email to {}", toEmail); return; }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Update on Grievance " + complaintNumber + " — " + status);
        message.setText("Dear Citizen,\n\n" +
                "The status of your grievance has been updated.\n\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "  Complaint ID : " + complaintNumber + "\n" +
                "  Subject      : " + title + "\n" +
                "  New Status   : " + status + "\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "Track your complaint: " + frontendUrl + "/#/citizen/track\n\n" +
                (status.equals("RESOLVED") ? 
                    "Your complaint has been resolved! Please login to review the resolution and rate your experience.\n\n" : "") +
                "Thank you for your patience.\n" +
                "SNS Support Team");
        try { mailSender.send(message); } catch (Exception e) { logger.error("Failed to send status email to {}: {}", toEmail, e.getMessage()); }
    }

    @Async
    public void sendOTPEmail(String toEmail, String otpCode) {
        if (mailSender == null) { logger.warn("Mail not configured, skipping OTP email to {}", toEmail); return; }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("SNS Password Reset — OTP Verification");
        message.setText("Your One-Time Password (OTP) for resetting your SNS credentials:\n\n" +
                "━━━━━━━━━━━━━━━━━\n" +
                "  OTP: " + otpCode + "\n" +
                "━━━━━━━━━━━━━━━━━\n\n" +
                "This code expires in 10 minutes.\n" +
                "Do NOT share this code with anyone.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "— SNS Security Team");
        try { mailSender.send(message); } catch (Exception e) { logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage()); }
    }
}