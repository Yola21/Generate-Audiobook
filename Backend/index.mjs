import AWS from "aws-sdk";

const S3_BUCKET_NAME = "cloud-term-assignment-s3";
const SNS_TOPIC_NAME = "Upload-Resume";

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
      }
    }

    // Return 404 Not Found for other routes
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
  try {
    const fileContent = Buffer.from(body, "base64");

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: `resumes/${uuidv4()}.pdf`, // Generate a unique key for each resume
      Body: fileContent,
    };

    const result = await s3.upload(params).promise();
    console.log("File uploaded to S3:", result.Location);

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
  try {
    const { Key, email } = body;
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: Key,
    };

    const data = await s3.getObject(params).promise();
    const fileContent = data.Body;

    const textractParams = {
      Document: {
        Bytes: fileContent,
      },
      FeatureTypes: ["LAYOUT"],
    };

    const response = await textract.analyzeDocument(textractParams).promise();

    const extractedData = extractInformationFromTextractResponse(response);

    await publishToSnsTopic(extractedData, email);

    return {
      statusCode: 200,
      body: JSON.stringify({ extractedData, response }),
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
  let education = "";
  let experience = "";

  response.Blocks.forEach((block) => {
    if (block.BlockType === "LINE") {
      if (!name) {
        name = block.Text;
      }
      if (block.Text.toLowerCase().includes("education")) {
        education = block.Text;
      }
      if (block.Text.toLowerCase().includes("experience")) {
        experience = block.Text;
      }
    }
  });

  return { name, education, experience };
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

export { handler };
