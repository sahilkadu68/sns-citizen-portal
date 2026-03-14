package com.sns.services;

import org.springframework.beans.factory.annotation.Autowired;
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

    // @Async
    public void sendRegistrationEmail(String toEmail, String fullName) {
        if (mailSender == null) { logger.warn("Mail not configured, skipping registration email to {}", toEmail); return; }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("smartnagrikseva@gmail.com");
        message.setTo(toEmail);
        message.setSubject("Welcome to Smart Nagrik Seva (SNS) Portal");
        message.setText("Dear " + fullName + ",\n\n" +
                "Your account has been successfully registered on the SNS platform. " +
                "You can now use our geo-tagging tools to report civic issues and contribute to city management.\n\n" +
                "Login URL: http://localhost:3000/#/login\n\n" +
                "Best Regards,\n" +
                "System Administrator\n" +
                "Smart Nagrik Seva (SNS)");
        mailSender.send(message);
    }

    // @Async
    public void sendStatusUpdateEmail(String toEmail, String complaintNumber, String status, String title) {
        if (mailSender == null) { logger.warn("Mail not configured, skipping status update email to {}", toEmail); return; }
        SimpleMailMessage message = new SimpleMailMessage();
        // message.setFrom("smartnagrikseva@gmail.com");
        message.setTo(toEmail);
        message.setSubject("Update on Grievance " + complaintNumber);
        message.setText("Dear Citizen,\n\n" +
                "The status of your grievance regarding '" + title + "' has been updated.\n\n" +
                "Complaint ID: " + complaintNumber + "\n" +
                "New Status: " + status + "\n\n" +
                "You can track the progress in real-time on our portal.\n\n" +
                "Thank you for your patience.\n" +
                "SNS Support Team");
        mailSender.send(message);
    }


    // @Async
    public void sendOTPEmail(String toEmail, String otpCode) {
        if (mailSender == null) { logger.warn("Mail not configured, skipping OTP email to {}", toEmail); return; }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("smartnagrikseva@gmail.com");
        message.setTo(toEmail);
        message.setSubject("SNS Password Reset - OTP Verification");
        message.setText("Your One-Time Password (OTP) for resetting your SNS credentials is: " + otpCode + "\n\n" +
                "This code will expire in 10 minutes. Please do not share this with anyone including city officials.");
        mailSender.send(message);
    }
}