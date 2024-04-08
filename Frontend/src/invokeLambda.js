import AWS from "aws-sdk";
const lambda = new AWS.Lambda();

const LAMBDA_FUNCTION_NAME = "test-22-LambdaFunction-bVX3AHTIcJjU";

export const invokeLambdaFunction = async (path, body) => {
  const params = {
    FunctionName: LAMBDA_FUNCTION_NAME, // Replace with your Lambda function name
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
      path,
      httpMethod: "POST",
      body: JSON.stringify(body),
    }),
  };

  const data = await lambda.invoke(params).promise();
  return data;
};
