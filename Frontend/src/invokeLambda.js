import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const AWS_REGION = process.env.REACT_APP_AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
const AWS_SESSION_TOKEN = process.env.REACT_APP_AWS_SESSION_TOKEN;
const LAMBDA_FUNCTION_NAME = process.env.REACT_APP_LAMBDA_FUNCTION_NAME;
const S3_BUCKET_NAME = process.env.REACT_APP_S3_BUCKET_NAME;

AWS.config.update({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  sessionToken: AWS_SESSION_TOKEN,
});

const lambda = new AWS.Lambda();
const s3 = new AWS.S3();

export const uploadFiletoS3 = async (body) => {
  console.log({ body });
  const { file, email } = body;
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const fileContent = new Uint8Array(reader.result);
        console.log({ fileContent });

        const params = {
          Bucket: S3_BUCKET_NAME,
          Key: `resumes/${uuidv4()}.pdf`,
          Body: fileContent,
        };
        console.log({ params });

        const result = await s3.upload(params).promise();
        console.log("File uploaded to S3:", result);

        const response = await invokeLambdaFunction({ result, email });
        console.log({ response });
        const parsePayload = JSON.parse(response?.Payload);
        console.log(parsePayload);

        const parsePayloadBody = JSON.parse(parsePayload?.body);
        console.log(parsePayloadBody);

        resolve({
          statusCode: 200,
          body: parsePayloadBody,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
};

const invokeLambdaFunction = async (response) => {
  console.log(response);
  const { result, email } = response;

  const body = {
    Key: result.key,
    email: email,
  };

  const params = {
    FunctionName: LAMBDA_FUNCTION_NAME,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
      path: "/extract",
      httpMethod: "POST",
      body,
    }),
  };

  console.log("Lambda Params: ", params);
  const data = await lambda.invoke(params).promise();
  return data;
};

export const applyForJob = async ({ email }) => {
  const params = {
    FunctionName: LAMBDA_FUNCTION_NAME,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
      path: "/apply",
      httpMethod: "POST",
      body: { email },
    }),
  };

  console.log("Lambda Params: ", params);
  await lambda.invoke(params).promise();
};
