"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
aws_sdk_1.default.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const s3 = new aws_sdk_1.default.S3();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});
function getNewAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post("https://accounts.zoho.com/oauth/v2/token", null, {
                params: {
                    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                    client_id: process.env.ZOHO_CLIENT_ID,
                    client_secret: process.env.ZOHO_CLIENT_SECRET,
                    grant_type: "refresh_token",
                },
            });
            const newAccessToken = response.data.access_token;
            return newAccessToken;
        }
        catch (error) {
            console.error("Error obtaining new access token:", error);
            throw error;
        }
    });
}
function createSupportTicket(ticketData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let accessToken = yield getNewAccessToken();
            console.log(accessToken);
            const response = yield axios_1.default.post("https://desk.zoho.com/api/v1/tickets", ticketData, {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    // 'orgId': '844159642'
                    "Content-Type": 'application/json'
                },
            });
            return response.data;
        }
        catch (error) {
            console.log(error);
            return error;
        }
    });
}
router.post("/create-content-support-ticket", upload.single("image"), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { problemType, description, questionId, questionTopic, questionSubtopic, userData, } = req.body;
    const ticketData = {
        subject: `Content Support - Question ID ${questionId}`,
        description: description,
        departmentId: "950940000000265037",
        channel: "Web",
        contact: JSON.parse(userData),
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
            s3.upload({
                Bucket: "certassist",
                Key: (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname,
                Body: req.file.buffer,
            }, (err, data) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    return res
                        .status(500)
                        .json("Failed to upload the image. Try again.");
                }
                ticketData.cf.cf_image_url = data.Location;
                ticketResponse = yield createSupportTicket(ticketData);
                return res.status(200).json(ticketResponse);
            }));
        }
        if (!req.file) {
            ticketResponse = yield createSupportTicket(ticketData);
            return res.status(200).json(ticketResponse);
        }
    }
    catch (error) {
        // @ts-ignore
        console.log(error.response.data);
        return res.status(500).json("Failed to create the ticket.");
    }
}));
router.post("/create-general-support-ticket", upload.single("image"), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { problemType, description, userData, } = req.body;
    const ticketData = {
        subject: `General Support - ${problemType}`,
        description: description,
        departmentId: "950940000000388037",
        channel: "Web",
        contact: JSON.parse(userData),
        cf: {
            cf_question_problem: problemType
        }
    };
    try {
        let ticketResponse;
        if (req.file) {
            s3.upload({
                Bucket: "certassist",
                Key: (_b = req.file) === null || _b === void 0 ? void 0 : _b.originalname,
                Body: req.file.buffer,
            }, (err, data) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    return res
                        .status(500)
                        .json("Failed to upload the image. Try again.");
                }
                ticketData.cf.cf_image_url = data.Location;
                ticketResponse = yield createSupportTicket(ticketData);
                return res.status(200).json(ticketResponse);
            }));
        }
        if (!req.file) {
            ticketResponse = yield createSupportTicket(ticketData);
            return res.status(200).json(ticketResponse);
        }
    }
    catch (error) {
        // @ts-ignore
        console.log(error.response.data);
        return res.status(500).json("Failed to create the ticket.");
    }
}));
exports.default = router;
