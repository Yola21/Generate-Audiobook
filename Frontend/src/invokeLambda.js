import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "ASIATCKANRQAJGHWCCUT";
const AWS_SECRET_ACCESS_KEY = "Fr6VPR/+LjIi0AbE99/SS25hV82EEAO7OF3PZ2Qv";
const AWS_SESSION_TOKEN =
  "IQoJb3JpZ2luX2VjENj//////////wEaCXVzLXdlc3QtMiJHMEUCIQCWE7Cye4B7+cqmnH8oZLdtNNyWSIyg8f+aE6uJ2bVcIQIgeaHpDl4k4/CXTT2qyzvjAlADq7EvyOGNrBckgVEHN3wqqQIIERAAGgwyMTExMjUzNzM5NTIiDNEDLbF4SQxPpPkaWSqGApiZEYhTaTE0zi41t+FYuGPtsat3nEsRRNU3DMKUVuhG2o8bjRqG0S7k3mfTuFBkK3fP6zRdBjPFigMYoXsZPerSE4VJcD4AVu8f9bMHioTwLB3b14Zy1WroY4dLNlg3kA/N8LuARsiPMoZb2iUCzAIGmC5405oT9tCohPTkS1TsU989FyQoJTUAhZMNYOWMHZMh8IHTYoedZwoGzRoyTxsIgOPBXGstwH3Bog7x1Vv01HG/lASk4/7AXmDtffh1OMtW1ok+FUJpe45V0Vylz0/dUKAkhJTlZE6ecrai5xwwSKzwB0SjYwkrCOuXopLSv6XNQo7exiEcyoK4YpUlQrbO6UR/2lAwst3TsAY6nQFBc2QgCFBqugUno35tLv1Uj5sfWwM7QXtBmVkJAH7KkQypeXXhla+p+QFT7ir6hYA09cyry76R8Y474OaOAxgI4FvPXh+FkvT0TyQKybJ5Z7u4Bzbt31nvoNmLD2+Uu0pqo9+UR37C6SwFscFal4CVIBTajG0xAitINT0EGt1zx6CSF7HIEeJzBGIdn8L/3Sn9Igl7SSoOGlx6UtjZ";
const LAMBDA_FUNCTION_NAME = "test-22-LambdaFunction-td838Vr42YoR";
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
  const fileContent = Buffer.from(file, "base64");
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

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Resume uploaded successfully", response }),
  };
};

const invokeLambdaFunction = async (response) => {
  console.log(response);
  const { result, email } = response;

  const body = {
    Key: result.data.result.key,
    email: email,
  };

  const params = {
    FunctionName: LAMBDA_FUNCTION_NAME,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
      path: "/extract",
      httpMethod: "POST",
      body,
      // body: path === "/upload" ? resumeFile : JSON.stringify(body),
    }),
  };

  console.log("Lambda Params: ", params);
  const data = await lambda.invoke(params).promise();
  return data;
};
