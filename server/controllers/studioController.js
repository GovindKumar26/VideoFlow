import amqp from "amqplib";


import File from "../models/File.js";
import asyncHandler from "../utils/asyncHandler.js";

export const exportVideoEdit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trim, crop, subtitles } = req.body;

  // 1. Core Security Boundary Check
  const file = await File.findOne({ _id: id, owner: req.user.id });
  if (!file) {
    return res.status(403).json({ message: "Access denied. Asset manipulation unauthorized." });
  }

  // 2. Connect to RabbitMQ Broker
  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();
  
  const queueName = "video_studio_tasks";
  
  // Ensure the queue is durable so jobs aren't lost if the RabbitMQ server restarts
  await channel.assertQueue(queueName, { durable: true });

  const taskPayload = {
    fileId: id,
    userId: req.user.id,
    trim,
    crop,
    subtitles,
    timestamp: Date.now()
  };

  // 3. Publish message with persistent flag set to true
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(taskPayload)), {
    persistent: true, 
  });

  console.log(`[RabbitMQ] Studio task successfully dispatched for Video: ${id}`);
  
  // Clean up connection channel footprint
  await channel.close();
  await connection.close();

  // 4. Return instant response back to your React client layout
  res.status(202).json({ 
    message: "Editing job successfully received and queued into the system." 
  });
});