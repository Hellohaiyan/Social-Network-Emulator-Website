# Social-Network-Emulator-Website
This guide provides step-by-step instructions on connecting an AWS Lambda function to API Gateway and DynamoDB. This integration allows you to create a serverless architecture, where the Lambda function serves as the backend logic, API Gateway as the HTTP endpoint, and DynamoDB for data storage.

Prerequisites
Before you begin, ensure you have the following:

AWS Account: Create an AWS account if you don't have one.

AWS CLI: Install the AWS CLI on your local machine.

AWS SAM CLI: Install the AWS Serverless Application Model (SAM) CLI for local development.

Steps
1. Set Up DynamoDB Table
Create a DynamoDB table to store your data. Define the table structure and note the table name and attributes.

2. Create Lambda Function
Write your Lambda function code and package it. Use the SAM CLI to deploy the function to AWS Lambda.

3. Configure API Gateway
Create an API in API Gateway. Set up the necessary routes and integrate them with the Lambda function.

4. Connect Lambda to DynamoDB
Update your Lambda function code to interact with DynamoDB. Use AWS SDK for seamless communication.

5. Deploy Changes
Deploy your changes using SAM CLI or the AWS Management Console.

6. Test
Test the integration by invoking the API endpoints. Ensure the data is stored/retrieved from DynamoDB via Lambda.

7. Update API Endpoint in Source Code
After deploying the API, you need to update the Source code to use the newly created API endpoint.


In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**
