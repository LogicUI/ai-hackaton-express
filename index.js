const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function addMessage(threadId, message) {
  const response = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });
  return response;
}

async function runAssistant(threadId) {
  const response = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID,
  });
  return response;
}

async function checkingStatus(threadId, runId) {
  const runObject = await openai.beta.threads.runs.retrieve(threadId, runId);
  const status = runObject.status;
  if (status === "completed") {
    const messagesList = await openai.beta.threads.messages.list(threadId);
    let messages = [];
    messagesList.body.data.forEach((message) => {
      messages.push(message.content);
    });
    return { messages };
  }
}

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { message } = req.body;
    const thread = await openai.beta.threads.create();
    await addMessage(thread.id, message);
    const run = await runAssistant(thread.id);
    const intervalId = setInterval(async () => {
      const result = await checkingStatus(thread.id, run.id);
      if (result) {
        clearInterval(intervalId);
        res.status(200).json(result);
      }
    }, 5000);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};
