import AWS from "aws-sdk";

const S3_BUCKET_NAME = "resume-parser-s3";
const SNS_TOPIC_NAME = "ResumeParserSNS";
const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "ASIATCKANRQAMDCMLUAQ";
const AWS_SECRET_ACCESS_KEY = "ViYcGcxms0JeRVSOuyVaKxvgrYaJSu5YZ/ML5pFZ";
const AWS_SESSION_TOKEN =
  "IQoJb3JpZ2luX2VjEOD//////////wEaCXVzLXdlc3QtMiJHMEUCIQCG/mTxVqzn93CzY//sZe2wwt2WbeLRM3zyIzb8fxEifgIgZRiZBRRhUZnQYN5Zmn3pWsZZJWWG1Fl7Atp9iB5vkfYqqQIIGRAAGgwyMTExMjUzNzM5NTIiDNac83Cn5dkgwCaNMSqGAhhe8Ni9ylo65E5PHxIIpFVRj/zS2vzxe/ymgpKdrW/iNCtSoOTVyNoAzobF7nMSy+Xoc61ddCxyIBm/9CqbUtVlITUG7jLmAF4sKc/EyeZ9sjz3w1Tzpxxnd/lx1wEMdxzvDr4OpRKDah1XYILGDeS/15hfNYDTD+oBbOlwMtgaTfyYqdY0ELtx9128hnvVf/z8f3uB61H3UhwNVbLpkIIIGcT5gH7aaF5+eLW3gChlmxeyc58yUsZMkVW/Pxi2ZNCCp4Rbh72tyVOAfmv5NBRIApaPMNIXEIFa2eSepT5oS/ISqolFuqDv3NnDqpepVLCMVBYFTyVhdDfReFTF4rmA4LS5/lkw2MPVsAY6nQF6Dd2CzDEBF3AG9nL6WCfecOlEIL7tYhgqS29XNmNznzYNiX5ABsfTkvLvZ1f4UgUMP81Fa1QMhDvS0/xpFcgExqusDfjfvxxcf5vY45Z2XPeLh3tKwzMsjs25R/qchH4GgMYp9D6exDJJglBtG0ckGd1cmVviWjuV05Tl62Y1NjSnM+3T0HQWpTzhAafOEa9prNoiaWNaQ+ZZdKe4";

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

    // await publishToSnsTopic(extractedData, email);

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

async function publishToSnsTopic(email, applicantID) {
  try {
    const snsParams = {
      TopicArn: await getSnsTopicArn(SNS_TOPIC_NAME),
      Message: `Your Applicant ID: ${applicantID}\nThanks for applying at our company. You will be contacted if you are shortlisted.`,
      Subject: "Job Application Confirmation",
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
    await publishToSnsTopic(email, applicantID);
    // await sendApplicationEmail(email, applicantID);

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
