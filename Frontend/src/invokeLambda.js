import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "ASIATCKANRQAMDCMLUAQ";
const AWS_SECRET_ACCESS_KEY = "ViYcGcxms0JeRVSOuyVaKxvgrYaJSu5YZ/ML5pFZ";
const AWS_SESSION_TOKEN =
  "IQoJb3JpZ2luX2VjEOD//////////wEaCXVzLXdlc3QtMiJHMEUCIQCG/mTxVqzn93CzY//sZe2wwt2WbeLRM3zyIzb8fxEifgIgZRiZBRRhUZnQYN5Zmn3pWsZZJWWG1Fl7Atp9iB5vkfYqqQIIGRAAGgwyMTExMjUzNzM5NTIiDNac83Cn5dkgwCaNMSqGAhhe8Ni9ylo65E5PHxIIpFVRj/zS2vzxe/ymgpKdrW/iNCtSoOTVyNoAzobF7nMSy+Xoc61ddCxyIBm/9CqbUtVlITUG7jLmAF4sKc/EyeZ9sjz3w1Tzpxxnd/lx1wEMdxzvDr4OpRKDah1XYILGDeS/15hfNYDTD+oBbOlwMtgaTfyYqdY0ELtx9128hnvVf/z8f3uB61H3UhwNVbLpkIIIGcT5gH7aaF5+eLW3gChlmxeyc58yUsZMkVW/Pxi2ZNCCp4Rbh72tyVOAfmv5NBRIApaPMNIXEIFa2eSepT5oS/ISqolFuqDv3NnDqpepVLCMVBYFTyVhdDfReFTF4rmA4LS5/lkw2MPVsAY6nQF6Dd2CzDEBF3AG9nL6WCfecOlEIL7tYhgqS29XNmNznzYNiX5ABsfTkvLvZ1f4UgUMP81Fa1QMhDvS0/xpFcgExqusDfjfvxxcf5vY45Z2XPeLh3tKwzMsjs25R/qchH4GgMYp9D6exDJJglBtG0ckGd1cmVviWjuV05Tl62Y1NjSnM+3T0HQWpTzhAafOEa9prNoiaWNaQ+ZZdKe4";
const LAMBDA_FUNCTION_NAME = "resume-parser-stack-LambdaFunction-yosYjXJcEMBl";
const S3_BUCKET_NAME = "resume-parser-s3";

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
