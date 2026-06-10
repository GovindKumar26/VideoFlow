import amqplib from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const EXCHANGE = "video.events";
const EXCHANGE_TYPE = "direct";

let connection = null;
let channel = null;

export const rabbitConfig = {
    url: RABBITMQ_URL,
    exchange: EXCHANGE,
    exchangeType: EXCHANGE_TYPE
};

export const getRabbitChannel = async () => {
    // Return cached channel ONLY if it exists and hasn't been closed/invalidated
    if (channel) {
        return channel;
    }

    try {
        console.log("Initializing fresh RabbitMQ Connection...");
        connection = await amqplib.connect(RABBITMQ_URL);
        
        // Handle connection failure events
        connection.on("error", (err) => {
            console.error("RabbitMQ TCP Connection Error:", err);
            invalidateCache();
        });

        connection.on("close", () => {
            console.warn("RabbitMQ TCP Connection Closed. Clearing references.");
            invalidateCache();
        });

        console.log("Creating fresh virtual channel...");
        channel = await connection.createChannel();

        // Handle channel failure events
        channel.on("error", (err) => {
            console.error("RabbitMQ Channel Error:", err);
            invalidateCache();
        });

        channel.on("close", () => {
            console.warn("RabbitMQ Channel Closed. Clearing references.");
            invalidateCache();
        });

        // Pre-assert your custom direct exchange
        await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
        console.log(`Exchange "${EXCHANGE}" successfully verified as DURABLE.`);

        return channel;
    } catch (error) {
        console.error("Failed to initialize RabbitMQ client:", error);
        invalidateCache();
        throw error;
    }
};

export const getRabbitConnection = () => connection;

// Helper to clean up cache hooks if network lines drop
const invalidateCache = () => {
    channel = null;
    connection = null;
};