"""
Email Service for sending notifications to candidates
Uses SMTP for sending emails
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_user)
        self.from_name = os.getenv('FROM_NAME', 'AI Resume Screening')
        
        self.enabled = bool(self.smtp_user and self.smtp_password)
        if not self.enabled:
            logger.warning("Email service not configured. Set SMTP_USER and SMTP_PASSWORD.")
    
    def is_configured(self) -> bool:
        """Check if email service is properly configured"""
        return self.enabled
    
    def send_email(self, to_email: str, subject: str, html_content: str, 
                   text_content: str = None) -> bool:
        """Send an email"""
        if not self.enabled:
            logger.warning(f"Email not sent (not configured): {subject} to {to_email}")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Add plain text version
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            # Add HTML version
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, to_email, msg.as_string())
            
            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def send_shortlisted_email(self, candidate_email: str, candidate_name: str,
                                job_title: str, company: str, 
                                custom_message: str = None,
                                recruiter_name: str = None,
                                recruiter_email: str = None) -> bool:
        """Send shortlisted notification email"""
        
        subject = f"Great News! You've Been Shortlisted for {job_title} at {company}"
        
        # Default message if not customized
        message = custom_message or f"""
We are pleased to inform you that after careful review of your application, 
you have been shortlisted for the {job_title} position at {company}.

Our team was impressed with your qualifications and experience, and we would 
like to move forward with the next steps in our hiring process.

We will be in touch shortly with more details about the interview process.
"""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
        .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }}
        .badge {{ display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }}
        .message {{ background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }}
        h1 {{ margin: 0; font-size: 24px; }}
        .emoji {{ font-size: 48px; margin-bottom: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🎉</div>
            <h1>Congratulations, {candidate_name}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been shortlisted!</p>
        </div>
        <div class="content">
            <p>Dear {candidate_name},</p>
            
            <div class="badge">✓ SHORTLISTED</div>
            
            <p><strong>Position:</strong> {job_title}<br>
            <strong>Company:</strong> {company}</p>
            
            <div class="message">
                {message.replace(chr(10), '<br>')}
            </div>
            
            <p>Best regards,<br>
            <strong>{recruiter_name or 'The Hiring Team'}</strong><br>
            {company}</p>
            
            {f'<p style="margin-top: 20px;"><a href="mailto:{recruiter_email}" style="color: #10B981;">Reply to this email</a> if you have any questions.</p>' if recruiter_email else ''}
        </div>
        <div class="footer">
            <p>This email was sent via AI Resume Screening Platform</p>
            <p>© 2024 {company}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
        
        text_content = f"""
Congratulations, {candidate_name}!

You've been shortlisted for the {job_title} position at {company}.

{message}

Best regards,
{recruiter_name or 'The Hiring Team'}
{company}
"""
        
        return self.send_email(candidate_email, subject, html_content, text_content)
    
    def send_rejection_email(self, candidate_email: str, candidate_name: str,
                              job_title: str, company: str,
                              custom_message: str = None,
                              recruiter_name: str = None) -> bool:
        """Send rejection notification email"""
        
        subject = f"Update on Your Application for {job_title} at {company}"
        
        # Default message if not customized
        message = custom_message or f"""
Thank you for taking the time to apply for the {job_title} position at {company} 
and for your interest in joining our team.

After careful consideration, we have decided to move forward with other candidates 
whose qualifications more closely match our current needs.

We encourage you to apply for future positions that match your skills and experience. 
We wish you the best in your job search and future career endeavors.
"""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
        .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }}
        .message {{ background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366F1; }}
        h1 {{ margin: 0; font-size: 24px; }}
        .emoji {{ font-size: 48px; margin-bottom: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">📋</div>
            <h1>Application Update</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your interest</p>
        </div>
        <div class="content">
            <p>Dear {candidate_name},</p>
            
            <p><strong>Position:</strong> {job_title}<br>
            <strong>Company:</strong> {company}</p>
            
            <div class="message">
                {message.replace(chr(10), '<br>')}
            </div>
            
            <p>Thank you again for considering {company}.</p>
            
            <p>Best regards,<br>
            <strong>{recruiter_name or 'The Hiring Team'}</strong><br>
            {company}</p>
        </div>
        <div class="footer">
            <p>This email was sent via AI Resume Screening Platform</p>
            <p>© 2024 {company}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
        
        text_content = f"""
Dear {candidate_name},

Application Update for {job_title} at {company}

{message}

Thank you again for considering {company}.

Best regards,
{recruiter_name or 'The Hiring Team'}
{company}
"""
        
        return self.send_email(candidate_email, subject, html_content, text_content)
    
    def send_hired_email(self, candidate_email: str, candidate_name: str,
                          job_title: str, company: str,
                          custom_message: str = None,
                          recruiter_name: str = None,
                          recruiter_email: str = None) -> bool:
        """Send hired notification email"""
        
        subject = f"🎊 Offer Letter - {job_title} at {company}"
        
        message = custom_message or f"""
We are thrilled to inform you that you have been selected for the {job_title} 
position at {company}!

After a thorough evaluation process, we are confident that your skills, experience, 
and enthusiasm make you the ideal candidate for this role.

We will be sending you the official offer letter and onboarding details shortly. 
Please feel free to reach out if you have any questions.

Welcome to the team!
"""
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
        .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }}
        .badge {{ display: inline-block; background: #ede9fe; color: #5b21b6; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }}
        .message {{ background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8B5CF6; }}
        h1 {{ margin: 0; font-size: 24px; }}
        .emoji {{ font-size: 48px; margin-bottom: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🎊</div>
            <h1>Welcome to {company}!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You're Hired!</p>
        </div>
        <div class="content">
            <p>Dear {candidate_name},</p>
            
            <div class="badge">🎉 CONGRATULATIONS!</div>
            
            <p><strong>Position:</strong> {job_title}<br>
            <strong>Company:</strong> {company}</p>
            
            <div class="message">
                {message.replace(chr(10), '<br>')}
            </div>
            
            <p>Best regards,<br>
            <strong>{recruiter_name or 'The Hiring Team'}</strong><br>
            {company}</p>
            
            {f'<p style="margin-top: 20px;"><a href="mailto:{recruiter_email}" style="color: #8B5CF6;">Contact us</a> if you have any questions.</p>' if recruiter_email else ''}
        </div>
        <div class="footer">
            <p>This email was sent via AI Resume Screening Platform</p>
            <p>© 2024 {company}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""
        
        text_content = f"""
Congratulations, {candidate_name}!

You're Hired for the {job_title} position at {company}!

{message}

Best regards,
{recruiter_name or 'The Hiring Team'}
{company}
"""
        
        return self.send_email(candidate_email, subject, html_content, text_content)


# Singleton instance
_email_service = None

def get_email_service() -> EmailService:
    """Get or create email service instance"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
