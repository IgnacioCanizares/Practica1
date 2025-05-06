// Esto lo pillé de un foro, pero no sé si es correcto:

const axios = require('axios');
require('dotenv').config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Sends error information to Slack channel
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 */
const logErrorToSlack = async (error, req) => {
  try {
    if (!SLACK_WEBHOOK_URL) {
      console.warn('Slack webhook URL not configured. Skipping Slack notification.');
      return;
    }

    const errorMessage = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🚨 Server Error (5XX) Detected",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Error:*\n${error.message || 'Unknown error'}`
            },
            {
              type: "mrkdwn",
              text: `*Route:*\n${req.method} ${req.originalUrl}`
            }
          ]
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*User ID:*\n${req.user ? req.user._id : 'Not authenticated'}`
            },
            {
              type: "mrkdwn",
              text: `*Time:*\n${new Date().toISOString()}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Stack:*\n\`\`\`${error.stack || 'No stack trace available'}\`\`\``
          }
        }
      ]
    };

    await axios.post(SLACK_WEBHOOK_URL, errorMessage);
  } catch (slackError) {
    console.error('Error sending to Slack:', slackError.message);
  }
};

module.exports = { logErrorToSlack };