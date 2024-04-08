import React, { useEffect } from "react";
import AWS from "aws-sdk";
import Home from "./HomePage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  useEffect(() => {
    const configureAWS = async () =>
      await AWS.config.update({
        accessKeyId: "ASIATCKANRQAN24XLHU3",
        secretAccessKey: "09fdxXFZyWzYrru0vwgUL43wuXsfsGAGjhDvD95q",
        region: "us-east-1",
        sessionToken:
          "IQoJb3JpZ2luX2VjEMr//////////wEaCXVzLXdlc3QtMiJHMEUCIQCQozSWHH797XBhbyVQDHh+fbtoya8H1SjlfyZaynke8AIgJOaAPEUFujBwsiPGwNtsapHU+60gVtOczvwUhgJY70oqsgII8///////////ARAAGgwyMTExMjUzNzM5NTIiDA23M7y2uNtyX6E3SyqGAvVbTy2xGPtpK374m+jms7jHwtwNkz3TX9T5JH2vLcG1P98phIMdzkOLijn9sba8QRZ2RjhcgdsZ+o9+C+JTOug9FXhNhnpDAW4+16/AtZxdxyAC1RSyUgK1SyAghwzWZocMs96Sy4+w/i8h8fbE9hHjfuHWRm5toR1gdIPErVmSbe5JfUFU3pGJYktf59aUwi0NKM7q3dHu58+sNAMUBbWiQQzPAdoMVyLfphpb9Gsg4VjJ8D7yKm/P3uqoCpQjViFdGHjjdbfOhLim7hsU4hFxuspse/SryzITPZlX+U1Rst/i9zEsOxa0s99/wFOzxiPdWkusydYcCb5vtEETDiU8PzHuGJow79zQsAY6nQG1zzZS3mcZL5uSZq5jvukW5C4MfHRZuTJr0Lt+oQLsfjFS8EviMQ4ocrPKi8fi3u7W9TIReJDaSrCkZNMfAo9eIGKBlyulcVh6VFQLvZ/8NHXMN1yBq1BFPNFJl0lISv0969mbCTGnXwTQECkWhOv1e41YyyExtQbkQtBg0GpccuiIaN+vd1Mq2pRaHN/ft3H9dSKENt9aqmFOXLEj",
      });

    configureAWS();
  }, []);

  return (
    <>
      <Home />
      <ToastContainer />
    </>
  );
}

export default App;
