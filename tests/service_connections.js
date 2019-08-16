const assert = require('assert');
const mongoose = require('mongoose');
const amqplib = require('amqplib');
const Redis = require('ioredis');

async function connectServices() {
    await mongoose.connect(
        'mongodb://localhost/testing', 
        { 
            useNewUrlParser: true 
        }
    );
    console.log('Connectado a MongoDB');

    const redis = new Redis(6379, 'localhost');
    console.log('Connectado a Redis');

    const amqp = await amqplib.connect('amqp://localhost');
    console.log('Connectado a RabbitMQ');

    return {
        redis,
        amqp,
    };
}

async function testMongo() {
    console.log('Testing MongoDB:');

    const DataSchema = new mongoose.Schema({
        text: String,
    });
    const Data = mongoose.model('Data', DataSchema);

    await Data.create({ text: 'Working' });

    const res = await Data.findOne();
    assert.strictEqual(res.text, 'Working');

    console.log('OK');
}

async function testRedis(redis) {
    console.log('Testing Redis:');

    await redis.set('testing', 'OK');
    const res = await redis.get('testing');

    assert.strictEqual(res, 'OK');

    console.log('OK');
}

async function testRabbitMQ(amqp) {
    console.log('Testing RabbitMQ:');

    const channel = await amqp.createChannel();
    const queue = 'testing';
    const message = 'OK';

    channel.assertQueue(queue, { durable: false });

    // Producer
    channel.sendToQueue(queue, Buffer.from(message));

    // Consumer
    channel.consume(queue, msg => {
        assert.strictEqual(msg.content.toString(), 'OK');
    });

    console.log('OK');
}


async function main() {
    const { redis, amqp } = await connectServices();

    await testMongo();
    await testRedis(redis);
    await testRabbitMQ(amqp);
}

main();