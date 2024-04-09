import React, { useState } from "react";
import {
  Button,
  Grid,
  TextField,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import { toast } from "react-toastify";
import { applyForJob, uploadFiletoS3 } from "./invokeLambda";

function Home() {
  const [resume, setResume] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    github: "",
    linkedin: "",
    phone: "",
    education: "",
    skills: "",
    experience: "",
  });

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    setResume(file);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleExtract = async () => {
    if (resume && email) {
      setLoading(true);
      try {
        const body = {
          file: resume,
          email: email,
        };
        const uploadResponse = await uploadFiletoS3(body);
        setFormData({
          name: uploadResponse.body.extractedData.name || "",
          email: uploadResponse.body.extractedData.email || "",
          github: uploadResponse.body.extractedData.githubLink || "",
          linkedin: uploadResponse.body.extractedData.linkedinLink || "",
          phone: uploadResponse.body.extractedData.phone || "",
          education: uploadResponse.body.extractedData.education || "",
          skills: uploadResponse.body.extractedData.skills || "",
          experience: uploadResponse.body.extractedData.experience || "",
        });
        toast.success("Text extracted successfully from Resume!");
      } catch (error) {
        console.error("Error extracting data from resume:", error);
      } finally {
        setLoading(false);
      }
    } else {
      console.error("Please select a resume and provide an email address.");
    }
  };

  const handleFormDataChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleApplyForJob = async () => {
    try {
      await applyForJob({ email });
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Error applying for job:", error);
      toast.error("Failed to submit application. Please try again later.");
    }
  };

  return (
    <Grid container spacing={2} style={{ padding: "2rem" }}>
      <Typography variant="h4">Job Portal</Typography>
      <Grid item xs={6}>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={email}
          onChange={handleEmailChange}
        />
      </Grid>
      <Grid item xs={6}>
        <input type="file" accept=".pdf" onChange={handleResumeChange} />
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" color="primary" onClick={handleExtract}>
          Upload Resume
        </Button>
      </Grid>
      {loading && (
        <Grid item xs={12}>
          <CircularProgress />
        </Grid>
      )}
      {!loading && (
        <>
          {Object.entries(formData).map(([key, value]) => (
            <Grid item xs={6} key={key}>
              <TextField
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                variant="outlined"
                fullWidth
                name={key}
                value={value}
                onChange={handleFormDataChange}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyForJob}
              disabled={!email}>
              Apply for Job
            </Button>
          </Grid>
        </>
      )}
    </Grid>
  );
}

export default Home;
