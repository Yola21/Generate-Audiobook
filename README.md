
# Resume Parser Application

## Introduction
Welcome to the Resume Parser Application! This project aims to streamline the recruitment process for both job seekers and employers by providing a user-friendly platform for job search and application.

## Key Features
- **Resume Upload:** Job seekers can upload their resumes in PDF format.
- **Resume Parsing:** Utilizing AWS Textract, essential information such as name, email, education, skills, and experience is extracted from resumes.
- **Job Application:** Job seekers can apply for job opening.
- **Email Notification:** Upon successful job application, applicants receive email confirmation with their unique applicant ID.

## Services Used
### Compute:
- **AWS EC2 (Elastic Compute Cloud):** Hosting the frontend of the web application.
- **AWS Lambda Function:** Handling event-driven tasks within the application.

### Storage:
- **AWS S3 (Simple Storage Service):** Storing uploaded resumes and static assets.

### Network:
- **AWS VPC (Virtual Private Cloud):** Creating a private network for secure communication.
- **AWS API Gateway:** Exposing APIs securely to external clients.

### General:
- **AWS SNS (Simple Notification Service):** Sending email notifications.
- **Amazon Textract:** Extracting text from uploaded resumes.

## Deployment Model
The application is deployed on Amazon Web Services (AWS) cloud infrastructure to leverage scalability, global reach, reliability, security, and cost-effectiveness.

## Delivery Model
Relies on Infrastructure as a Service offerings.

## Architecture
- **Cloud Mechanisms Integration:** Various cloud mechanisms work together seamlessly to deliver a comprehensive job portal experience.
- **Data Storage:** Data is primarily stored in AWS S3 buckets for scalability and durability.
- **Programming Languages and Code Requirements:** Utilized Node.js for backend Lambda functions and certain frontend components.

## Data Security
- **Infrastructure Level:** Sensitive information is stored securely, and API Gateway provides authentication and authorization mechanisms.
- **Virtual Private Cloud (VPC):** Enhances security posture by providing network isolation and control over traffic.

## Future Enhancements
- **Advanced Resume Analysis**
- **Recommendation Engine**
- **Real-time Notifications**
- **Interview Scheduling**
- **Enhanced Security and Compliance**

