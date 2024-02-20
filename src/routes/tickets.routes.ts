import express from "express";
import multer from "multer";
import AWS from "aws-sdk";
import axios from "axios";


type TicketDataType = {
  subject: string;
  description: string;
  departmentId: string;
  channel: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
  };
  cf: {[key: string]: string}

};

const router = express.Router();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

async function getNewAccessToken() {
  try {
    const response = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token",
        },
      }
    );
    const newAccessToken = response.data.access_token;

    return newAccessToken;
  } catch (error) {
    console.error("Error obtaining new access token:", error);
    throw error;
  }
}

async function createSupportTicket(ticketData: TicketDataType) {

  try {
    let accessToken = await getNewAccessToken();
    console.log(accessToken);
    const response = await axios.post(
      "https://desk.zoho.com/api/v1/tickets",
      ticketData,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          // 'orgId': '844159642'
          "Content-Type": 'application/json'
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log(error);
    return error
  }
}

router.post(
  "/create-content-support-ticket",
  upload.single("image"),
  async (req, res, next) => {
    const {
      problemType,
      description,
      questionId,
      questionTopic,
      questionSubtopic,
      userData,
    }: {
      problemType: string;
      description: string;
      questionId: string;
      questionTopic: string;
      questionSubtopic: string;
      userData: string;
    } = req.body;




    const ticketData: TicketDataType = {
      subject: `Content Support - Question ID ${questionId}`,
      description: description,
      departmentId: "950940000000265037",
      channel: "Web",
      contact: JSON.parse(userData) as { firstName: string; lastName: string; email: string },
      cf: {
        cf_question_id: questionId,
        cf_question_topic: questionTopic,
        cf_question_subtopic: questionSubtopic,
        cf_question_problem: problemType
      }
    };

    try {
      let ticketResponse;
      if (req.file) {
        s3.upload(
          {
            Bucket: "certassist",
            Key: req.file?.originalname,
            Body: req.file.buffer,
          },
          async (err, data) => {
            if (err) {
              return res
                .status(500)
                .json("Failed to upload the image. Try again.");
            }

            ticketData.cf.cf_image_url = data.Location;  
            ticketResponse = await createSupportTicket(ticketData);


          }
        );
      }

      if (!req.file) {
        ticketResponse = await createSupportTicket(ticketData);
      }

      return res.status(200).json(ticketResponse);

      
    } catch (error) {
      // @ts-ignore
      console.log(error.response.data);
      return res.status(500).json("Failed to create the ticket.");
    }
  }
);

export default router;
