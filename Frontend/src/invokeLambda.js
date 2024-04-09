import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "ASIATCKANRQALT6CBSMV";
const AWS_SECRET_ACCESS_KEY = "NJ6pfmxVpRK/tO+Bvd8fOFT0VI7NBnSI6Rb3MEZu";
const AWS_SESSION_TOKEN =
  "IQoJb3JpZ2luX2VjEN3//////////wEaCXVzLXdlc3QtMiJHMEUCIEndXVEd2V0Rkm27yY334lfW9/u1yh+5rdmZJTSf74ArAiEAjpOWA9byZuuSSbGi9WmAds8iO5ENujh+0lLNDMyvvf8qqQIIFhAAGgwyMTExMjUzNzM5NTIiDJozHlXyVxX/Dx8rHiqGArFM/aQM9kLGpRHvTwTYYDbi48KVbFPdoTFTe1ABiaNiLdyj1vfp+URwAeoSd7TZLzx+PMAeftLve1+nB1e5Bqpqz2hO9Nb8pC1CYFTBVd+5QQzsATWOr9KthYTwcRk/z+P+TK+dzKQBYJZAwxmqmzU02jfxeuWWkP9h3kbnucmYZF5Tul2m2yu3zzondEy/rm1yoq5xzgbQMDHs/N0RkmhDT3+tfbNcMBSQnH3MciRxyW0gDAqhXwmBKitCjweV3/EyGFjHNpTzn19hSwan7Ho66IyCiJ39tF7MSxPzATmxfAuJRsD1G7Hf1/ala7PnireKWmMzuwA/bZ5cCp7vpjV2L/Ja2how/OfUsAY6nQGQvr+JDBTToDqxKvpHFLKMR5CKmXrgk8XC/AZH4S2nvb1dWNxLu/ZdZ4BVZHdUHvtxAf5NYXYzjjq8SFwGMEyfcqEK6Up7xzL9bCLq7J0OCMg+c/DLd7y3MpvqyxXBDqdEjuUwSr4QpzvZBf0qFDIo1pbp3tuhvB193CQ+izPd++IpkVMRXxwiOKRG2abL18kCYDj2m9p0d7H6Uel+";
const LAMBDA_FUNCTION_NAME = "resume-parser-stack-LambdaFunction-O8fwZI5jB8yD";
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
