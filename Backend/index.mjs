import AWS from "aws-sdk";

const S3_BUCKET_NAME = "resume-parser-s3";
const SNS_TOPIC_NAME = "ResumeParserSNS";
const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "ASIATCKANRQAJGHWCCUT";
const AWS_SECRET_ACCESS_KEY = "Fr6VPR/+LjIi0AbE99/SS25hV82EEAO7OF3PZ2Qv";
const AWS_SESSION_TOKEN =
  "IQoJb3JpZ2luX2VjENj//////////wEaCXVzLXdlc3QtMiJHMEUCIQCWE7Cye4B7+cqmnH8oZLdtNNyWSIyg8f+aE6uJ2bVcIQIgeaHpDl4k4/CXTT2qyzvjAlADq7EvyOGNrBckgVEHN3wqqQIIERAAGgwyMTExMjUzNzM5NTIiDNEDLbF4SQxPpPkaWSqGApiZEYhTaTE0zi41t+FYuGPtsat3nEsRRNU3DMKUVuhG2o8bjRqG0S7k3mfTuFBkK3fP6zRdBjPFigMYoXsZPerSE4VJcD4AVu8f9bMHioTwLB3b14Zy1WroY4dLNlg3kA/N8LuARsiPMoZb2iUCzAIGmC5405oT9tCohPTkS1TsU989FyQoJTUAhZMNYOWMHZMh8IHTYoedZwoGzRoyTxsIgOPBXGstwH3Bog7x1Vv01HG/lASk4/7AXmDtffh1OMtW1ok+FUJpe45V0Vylz0/dUKAkhJTlZE6ecrai5xwwSKzwB0SjYwkrCOuXopLSv6XNQo7exiEcyoK4YpUlQrbO6UR/2lAwst3TsAY6nQFBc2QgCFBqugUno35tLv1Uj5sfWwM7QXtBmVkJAH7KkQypeXXhla+p+QFT7ir6hYA09cyry76R8Y474OaOAxgI4FvPXh+FkvT0TyQKybJ5Z7u4Bzbt31nvoNmLD2+Uu0pqo9+UR37C6SwFscFal4CVIBTajG0xAitINT0EGt1zx6CSF7HIEeJzBGIdn8L/3Sn9Igl7SSoOGlx6UtjZ";

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
  console.log("upload", { body });
  try {
    const formData = JSON.parse(body);
    console.log({ formData });
    const resume = formData.resume;
    // const resume = formData.get("resume");
    console.log({ resume });
    const fileContent = Buffer.from(resume, "base64");
    console.log({ fileContent });

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: `resumes/${uuidv4()}.pdf`, // Generate a unique key for each resume
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
    const { Key, email } = JSON.parse(body);
    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: Key,
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
