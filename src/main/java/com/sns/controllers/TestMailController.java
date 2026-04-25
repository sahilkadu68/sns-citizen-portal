package com.sns.controllers;

import com.sns.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestMailController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/mail")
    public String testMail() {
        emailService.sendOTPEmail(
                "sahilkadu68@gmail.com",
                "123456"
        );
        return "Mail triggered";
    }
}
