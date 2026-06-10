import crypto from "crypto";
import { getRabbitChannel, rabbitConfig } from "../config/rabbitmq.js";

export const publishEvent = async (routingKey, payload) => {
    const channel = await getRabbitChannel();
    const eventId = payload.eventId || crypto.randomUUID();
    const message = {
        eventId,
        routingKey,
        sentAt: new Date().toISOString(),
        payload
    };

    const body = Buffer.from(JSON.stringify(message));

    channel.publish(rabbitConfig.exchange, routingKey, body, {
        contentType: "application/json",
        persistent: true,
        messageId: eventId,
        timestamp: Date.now()
    });

    return eventId;
};
