package com.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.brand.name:UniLink}")
    private String brandName;

    @Value("${app.mail.brand.logo-url:}")
    private String brandLogoUrl;

    @Value("${app.mail.brand.website-url:https://example.edu/unilink}")
    private String brandWebsiteUrl;

    @Value("${app.mail.brand.support-email:support@unilink.edu}")
    private String supportEmail;

    @Value("${app.mail.brand.support-phone:+94 11 000 0000}")
    private String supportPhone;

    public void sendPasswordResetCode(String to, String code) {
        Theme theme = resolveResetTheme();
        Context context = new Context();
        context.setVariable("code", code);
        context.setVariable("brandName", brandName);
        context.setVariable("brandLogoUrl", brandLogoUrl);
        context.setVariable("brandWebsiteUrl", brandWebsiteUrl);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("supportPhone", supportPhone);
        context.setVariable("bodyGradient", theme.bodyGradient());
        context.setVariable("cardBorderColor", theme.cardBorderColor());
        context.setVariable("headerGradient", theme.headerGradient());
        context.setVariable("detailBoxBackground", theme.detailBoxBackground());
        context.setVariable("detailBoxBorder", theme.detailBoxBorder());
        context.setVariable("labelColor", theme.labelColor());

        String html = templateEngine.process("emails/password-reset-code", context);
        sendHtmlMail(to, "UniLink Password Reset Code", html);
    }

    public void sendBookingAcceptedEmail(String toStudent,
                                         String studentName,
                                         String lecturerName,
                                         String lecturerDepartment,
                                         String bookingDate,
                                         String bookingTime,
                                         String notes) {
        Theme theme = resolveTheme(lecturerDepartment, lecturerName, true);
        Context context = new Context();
        context.setVariable("studentName", studentName);
        context.setVariable("lecturerName", lecturerName);
        context.setVariable("bookingDate", bookingDate);
        context.setVariable("bookingTime", bookingTime);
        context.setVariable("notes", notes);
        context.setVariable("brandName", brandName);
        context.setVariable("brandLogoUrl", brandLogoUrl);
        context.setVariable("brandWebsiteUrl", brandWebsiteUrl);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("supportPhone", supportPhone);
        context.setVariable("bodyGradient", theme.bodyGradient());
        context.setVariable("cardBorderColor", theme.cardBorderColor());
        context.setVariable("headerGradient", theme.headerGradient());
        context.setVariable("detailBoxBackground", theme.detailBoxBackground());
        context.setVariable("detailBoxBorder", theme.detailBoxBorder());
        context.setVariable("labelColor", theme.labelColor());

        String html = templateEngine.process("emails/booking-accepted", context);
        sendHtmlMail(toStudent, "UniLink - Booking Request Accepted", html);
    }

    public void sendBookingDeclinedEmail(String toStudent,
                                         String studentName,
                                         String lecturerName,
                                         String lecturerDepartment,
                                         String reason) {
        Theme theme = resolveTheme(lecturerDepartment, lecturerName, false);
        Context context = new Context();
        context.setVariable("studentName", studentName);
        context.setVariable("lecturerName", lecturerName);
        context.setVariable("reason", (reason != null && !reason.trim().isEmpty()) ? reason : "No reason was provided.");
        context.setVariable("brandName", brandName);
        context.setVariable("brandLogoUrl", brandLogoUrl);
        context.setVariable("brandWebsiteUrl", brandWebsiteUrl);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("supportPhone", supportPhone);
        context.setVariable("bodyGradient", theme.bodyGradient());
        context.setVariable("cardBorderColor", theme.cardBorderColor());
        context.setVariable("headerGradient", theme.headerGradient());
        context.setVariable("detailBoxBackground", theme.detailBoxBackground());
        context.setVariable("detailBoxBorder", theme.detailBoxBorder());
        context.setVariable("labelColor", theme.labelColor());

        String html = templateEngine.process("emails/booking-declined", context);
        sendHtmlMail(toStudent, "UniLink - Booking Request Declined", html);
    }

    private Theme resolveTheme(String lecturerDepartment, String lecturerName, boolean acceptedMail) {
        String dept = lecturerDepartment == null ? "" : lecturerDepartment.toLowerCase();

        if (dept.contains("comput") || dept.contains("it") || dept.contains("soft")) {
            return acceptedMail
                    ? new Theme("linear-gradient(135deg,#edf4ff 0%,#e8fff7 100%)", "#c7d2fe", "linear-gradient(90deg,#1d4ed8 0%,#0f766e 100%)", "#f8fbff", "#c7d2fe", "#1e40af")
                    : new Theme("linear-gradient(135deg,#fff1f2 0%,#fff9ec 100%)", "#fbcfe8", "linear-gradient(90deg,#be123c 0%,#ea580c 100%)", "#fff4f6", "#fbcfe8", "#9f1239");
        }

        if (dept.contains("business") || dept.contains("management")) {
            return acceptedMail
                    ? new Theme("linear-gradient(135deg,#ecfeff 0%,#eef2ff 100%)", "#a5f3fc", "linear-gradient(90deg,#0f766e 0%,#4f46e5 100%)", "#f0fdfa", "#99f6e4", "#115e59")
                    : new Theme("linear-gradient(135deg,#fff7ed 0%,#fff1f2 100%)", "#fdba74", "linear-gradient(90deg,#c2410c 0%,#be123c 100%)", "#fff7ed", "#fdba74", "#9a3412");
        }

        // Fallback: deterministic lecturer-based color family
        int bucket = Math.abs((lecturerName == null ? "unilink" : lecturerName).hashCode()) % 3;
        if (bucket == 0) {
            return acceptedMail
                ? new Theme("linear-gradient(135deg,#eff6ff 0%,#ecfeff 100%)", "#bfdbfe", "linear-gradient(90deg,#1d4ed8 0%,#0f766e 100%)", "#f8fafc", "#bfdbfe", "#1e3a8a")
                : new Theme("linear-gradient(135deg,#fff1f2 0%,#fef2f2 100%)", "#fecaca", "linear-gradient(90deg,#b91c1c 0%,#c2410c 100%)", "#fff1f2", "#fecaca", "#991b1b");
        }
        if (bucket == 1) {
            return acceptedMail
                ? new Theme("linear-gradient(135deg,#eef2ff 0%,#f0fdfa 100%)", "#c4b5fd", "linear-gradient(90deg,#4338ca 0%,#0f766e 100%)", "#f5f3ff", "#ddd6fe", "#4c1d95")
                : new Theme("linear-gradient(135deg,#fff7ed 0%,#fff1f2 100%)", "#fdba74", "linear-gradient(90deg,#9a3412 0%,#be123c 100%)", "#fff7ed", "#fdba74", "#9a3412");
        }
        return acceptedMail
            ? new Theme("linear-gradient(135deg,#ecfeff 0%,#eef2ff 100%)", "#a5f3fc", "linear-gradient(90deg,#0e7490 0%,#4338ca 100%)", "#f0fdfa", "#a5f3fc", "#155e75")
            : new Theme("linear-gradient(135deg,#fff1f2 0%,#fff7ed 100%)", "#fecaca", "linear-gradient(90deg,#be123c 0%,#c2410c 100%)", "#fff1f2", "#fecaca", "#9f1239");
        }

        private Theme resolveResetTheme() {
        return new Theme(
            "linear-gradient(135deg,#eef2ff 0%,#ecfeff 100%)",
            "#c7d2fe",
            "linear-gradient(90deg,#4338ca 0%,#0e7490 100%)",
            "#f5f3ff",
            "#ddd6fe",
            "#312e81"
        );
    }

    private record Theme(String bodyGradient,
                         String cardBorderColor,
                         String headerGradient,
                         String detailBoxBackground,
                         String detailBoxBorder,
                         String labelColor) {
    }

    private void sendHtmlMail(String to, String subject, String htmlBody) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new IllegalStateException("Failed to send HTML email", e);
        }
    }
}
