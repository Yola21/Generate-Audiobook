import React, { useState } from "react";
import { Button, Grid, TextField, Typography } from "@material-ui/core";
import { invokeLambdaFunction } from "./invokeLambda";

const API = "https://t86h0hvi91.execute-api.us-east-1.amazonaws.com/prod";

function Home() {
  const [resume, setResume] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    education: "",
    experience: "",
  });
  const [email, setEmail] = useState("");

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    setResume(file);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleExtract = async () => {
    if (resume && email) {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("email", email);
      console.log({ formData });

      try {
        console.log("Inside Try");
        const uploadResponse = await fetch(`${API}/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
            "Access-Control-Allow-Origin": "*",
          },
          body: formData,
        });
        // const uploadResponse = await invokeLambdaFunction({
        //   path: "/upload",
        //   body: formData,
        // });
        console.log("Resume uploaded to S3:", uploadResponse.data);

        // const body = {
        //   Key: uploadResponse.data.result.key,
        //   email: email,
        // };
        // const extractResponse = await fetch(`${API}/extract`, {
        //   method: "POST",
        //   body,
        // });
        // const extractResponse = await invokeLambdaFunction({
        //   path: "/extract",
        //   body,
        // });
        // console.log("Extracted resume details:", extractResponse);

        // setFormData({
        //   name: extractResponse.data.extractedData.name || "",
        //   education: extractResponse.data.extractedData.education || "",
        //   experience: extractResponse.data.extractedData.experience || "",
        // });
      } catch (error) {
        console.error("Error extracting data from resume:", error);
      }
    } else {
      console.error("Please select a resume and provide an email address.");
    }
  };

  return (
    <Grid container spacing={2} style={{ padding: "2rem" }}>
      <Typography variant="h4">Job Portal</Typography>
      <Grid item xs={12}>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={handleEmailChange}
        />
      </Grid>
      <Grid item xs={12}>
        <input type="file" accept=".pdf" onChange={handleResumeChange} />
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={handleExtract}>
          Upload Resume
        </Button>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Name"
          variant="outlined"
          fullWidth
          value={formData.name}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Education"
          variant="outlined"
          fullWidth
          value={formData.education}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Experience"
          variant="outlined"
          multiline
          fullWidth
          value={formData.experience}
          InputProps={{ readOnly: true }}
        />
      </Grid>
    </Grid>
  );
}

export default Home;
