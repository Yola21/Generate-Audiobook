import React, { useEffect } from "react";
import AWS from "aws-sdk";
import Home from "./HomePage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AWS_REGION = "us-east-1";
const AWS_ACCESS_KEY_ID = "ASIATCKANRQAOQDP32FS";
const AWS_SECRET_ACCESS_KEY = "Hs6aLu+ThZJ1Xj5Pq7ylmHkD+4wOowfKkWN05OcP";
const AWS_SESSION_TOKEN =
  "IQoJb3JpZ2luX2VjEM7//////////wEaCXVzLXdlc3QtMiJHMEUCIQDwX5AIEJEL7valrASSr5GaiaQoGY/H2wLt4s46tlqjJQIgXZpImR1rPYyd77LlG6UeXgvZ8t8KIMbRH9XzqC297hkqsgII9///////////ARAAGgwyMTExMjUzNzM5NTIiDGTx89B4/3wRXrQy1CqGAujp4IWuWT8J6flMsreg6MCZ0zJDU+eZPTH+BL0zJaq/GDVRzZgyybTOk4OyHgkoTEx4C8lj7bbSC+Y8IWb0E6Sm5QejojI3iaTtrXwwox0YmoH6OPrEi1WZGC1cV3SyDz6qoGIMwT6BByzi+l21xQ/BzRkxWzYG3PumgSYi4xxqJuDcdnFCIO8lWgMGQmyb5V1v62heig0t9uwb6dYgK8u5hAPRHT50m6qlrw76A623KBWh134tlTDmZj7EnESIT+qKgeT9hZhdQuvrSL2gJF7ccFaHDXD9kOAWAy5kzwX1dy9xVEmbKgtxNSR0bOOkD/lXvCMz6+z8Ugz6gYBjqCLS12QvPxowqsvRsAY6nQGFcsLqSaeH2oooEM10RJuTg/ToT0PBIR8Lea4fmSzCeq5XPONBfVmVJIqcUP/cZBPa6yrbxyGB/8z/Qp1J32y1jgN5sn6OT1NlcuikECL5YHm4AgHonpsxCS8OS/JvbMRxksie3Av8tV7g6MWyihWvoR9Ka5X2Dd89xSd6k8PXTwJ51+blRRx9oaIi2Uazbj9b/912f3kqaLCDjfqo";

function App() {
  useEffect(() => {
    AWS.config.update({
      region: AWS_REGION,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      sessionToken: AWS_SESSION_TOKEN,
    });
  }, []);

  return (
    <>
      <Home />
      <ToastContainer />
    </>
  );
}

export default App;
