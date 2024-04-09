import AWS from "aws-sdk";

const S3_BUCKET_NAME = "resume-parser-s3";
const SNS_TOPIC_NAME = "ResumeParserSNS";
const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "ASIATCKANRQALT6CBSMV";
const AWS_SECRET_ACCESS_KEY = "NJ6pfmxVpRK/tO+Bvd8fOFT0VI7NBnSI6Rb3MEZu";
const AWS_SESSION_TOKEN =
  "IQoJb3JpZ2luX2VjEN3//////////wEaCXVzLXdlc3QtMiJHMEUCIEndXVEd2V0Rkm27yY334lfW9/u1yh+5rdmZJTSf74ArAiEAjpOWA9byZuuSSbGi9WmAds8iO5ENujh+0lLNDMyvvf8qqQIIFhAAGgwyMTExMjUzNzM5NTIiDJozHlXyVxX/Dx8rHiqGArFM/aQM9kLGpRHvTwTYYDbi48KVbFPdoTFTe1ABiaNiLdyj1vfp+URwAeoSd7TZLzx+PMAeftLve1+nB1e5Bqpqz2hO9Nb8pC1CYFTBVd+5QQzsATWOr9KthYTwcRk/z+P+TK+dzKQBYJZAwxmqmzU02jfxeuWWkP9h3kbnucmYZF5Tul2m2yu3zzondEy/rm1yoq5xzgbQMDHs/N0RkmhDT3+tfbNcMBSQnH3MciRxyW0gDAqhXwmBKitCjweV3/EyGFjHNpTzn19hSwan7Ho66IyCiJ39tF7MSxPzATmxfAuJRsD1G7Hf1/ala7PnireKWmMzuwA/bZ5cCp7vpjV2L/Ja2how/OfUsAY6nQGQvr+JDBTToDqxKvpHFLKMR5CKmXrgk8XC/AZH4S2nvb1dWNxLu/ZdZ4BVZHdUHvtxAf5NYXYzjjq8SFwGMEyfcqEK6Up7xzL9bCLq7J0OCMg+c/DLd7y3MpvqyxXBDqdEjuUwSr4QpzvZBf0qFDIo1pbp3tuhvB193CQ+izPd++IpkVMRXxwiOKRG2abL18kCYDj2m9p0d7H6Uel+";

AWS.config.update({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  sessionToken: AWS_SESSION_TOKEN,
});
const s3 = new AWS.S3();
const textract = new AWS.Textract();
const sns = new AWS.SNS();

const handler = async (event, context) => {
  try {
    const path = event.path;
    const method = event.httpMethod;

    if (method === "POST") {
      if (path === "/upload") {
        return uploadResumeToS3(event.body);
      } else if (path === "/extract") {
        return extractTextFromResume(event.body);
      } else if (path === "/apply") {
        return applyForJob(event.body);
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Not Found" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function uploadResumeToS3(body) {
  console.log("upload", { body });
  try {
    const formData = JSON.parse(body);
    console.log({ formData });
    const resume = formData.resume;
    console.log({ resume });
    const fileContent = Buffer.from(resume, "base64");
    console.log({ fileContent });

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: `resumes/${uuidv4()}.pdf`,
      Body: fileContent,
    };
    console.log({ params });

    const result = await s3.upload(params).promise();
    console.log("File uploaded to S3:", result);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Resume uploaded successfully", result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error uploading file" }),
    };
  }
}

async function extractTextFromResume(body) {
  console.log({ body });
  try {
    const { Key, email } = body;
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key,
    };
    console.log({ params });

    const data = await s3.getObject(params).promise();
    console.log({ data });
    const fileContent = data.Body;
    console.log({ fileContent });

    const textractParams = {
      Document: {
        Bytes: fileContent,
      },
      FeatureTypes: ["LAYOUT"],
    };
    console.log({ textractParams });

    const response = await textract.analyzeDocument(textractParams).promise();
    console.log({ response });

    const extractedData = extractInformationFromTextractResponse(response);
    console.log({ extractedData });

    await publishToSnsTopic(extractedData, email);

    return {
      statusCode: 200,
      body: JSON.stringify({ extractedData }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error extracting text from resume" }),
    };
  }
}

function extractInformationFromTextractResponse(response) {
  let name = "";
  let email = "";
  let githubLink = "";
  let linkedinLink = "";
  let phone = "";
  let education = "";
  let skills = "";
  let experience = "";

  response.Blocks.forEach((block) => {
    if (block.BlockType === "LINE") {
      const text = block.Text.toLowerCase();

      if (!name) {
        name = block.Text;
      }

      if (text.includes("@") && text.includes(".")) {
        email = text;
      }

      if (text.includes("github.com")) {
        githubLink = text;
      }

      if (text.includes("linkedin.com")) {
        linkedinLink = text;
      }

      if (text.match(/\d{10}/)) {
        phone = text;
      }

      if (text.includes("education")) {
        education += text + "\n";
      }
      if (text.includes("skills")) {
        skills += text + "\n";
      }
      if (text.includes("experience")) {
        experience += text + "\n";
      }
    }
  });

  return {
    name,
    email,
    githubLink,
    linkedinLink,
    phone,
    education,
    skills,
    experience,
  };
}

async function publishToSnsTopic(extractedData, email) {
  try {
    const snsParams = {
      TopicArn: await getSnsTopicArn(SNS_TOPIC_NAME),
      Message: `Extracted Data: ${JSON.stringify(extractedData)}`,
      Subject: "Resume Extraction Result",
    };

    await sns.publish(snsParams).promise();
  } catch (error) {
    throw new Error("Error publishing message to SNS topic: " + error.message);
  }
}

async function getSnsTopicArn(topicName) {
  try {
    const response = await sns.listTopics().promise();
    const topics = response.Topics || [];
    for (const topic of topics) {
      if (topic.TopicArn.includes(topicName)) {
        return topic.TopicArn;
      }
    }
    return null;
  } catch (error) {
    throw new Error("Error fetching SNS topics: " + error.message);
  }
}

async function applyForJob(body) {
  try {
    const { email } = body;
    // const { email } = JSON.parse(body);
    const applicantID = generateApplicantID();
    await sendApplicationEmail(email, applicantID);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Application submitted successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error applying for job" }),
    };
  }
}

async function sendApplicationEmail(email, applicantID) {
  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Text: {
          Data: `Your Applicant ID: ${applicantID}\nThanks for applying at our company. You will be contacted if you are shortlisted.`,
        },
      },
      Subject: { Data: "Job Application Confirmation" },
    },
    Source: "yashkhorja4@gmail.com", // Sender email address (must be verified in SES)
  };

  await ses.sendEmail(params).promise();
}

function generateApplicantID() {
  return Math.floor(100000 + Math.random() * 900000);
}

export { handler };
