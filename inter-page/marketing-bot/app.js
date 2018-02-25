/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Use this project as the starting point for following the
 * Messenger Platform quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    ACCESS_TOKEN = "EAACuCRnVclUBAA1AsKLoY30T1F8exXh2MFtzZBPEC5IXN5PBoaDkZALb1V7ZAR1I4ZB48kgfzp5eO6BuT974fDwqbJBiYYC6smZCl6ZC8r4NeALI8R8jkXQg1FJA5WljoWEjjwaZCqJRG5cRX661zFoXKWZCPIZCKPO94AK6yYz19GwZDZD",
    app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

app.post('/webhook', (req, res) => {
    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {
        body.entry.forEach(function (entry) {
            if (entry.messaging) {
                // Gets the body of the webhook event
                let webhook_event = entry.messaging[0];

                // Get the sender PSID
                let sender_psid = webhook_event.sender.id;
                console.log('Sender PSID: ' + sender_psid);

                // Check if the event is a message or postback and
                // pass the event to the appropriate handler function
                if (webhook_event.message) {
                    handleMessage(sender_psid, webhook_event.message);
                } else if (webhook_event.postback) {
                    handlePostback(sender_psid, webhook_event.postback);
                }
            } else if (entry.changes) {
                processComments(entry.changes[0].value);
            }
        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

function processComments(comment) {
    let comment_id;
    if (comment.item == 'post') {
        comment_id = comment.post_id;
    } else if (comment.item == 'comment') {
        comment_id = comment.comment_id;
    }
    console.log("id: " + comment_id);
    let encode_message = encodeURIComponent(comment.message);
    let message_body = `Thank you for your question, to better assist you I am passing you to our support department. Click the link below to be transferred. https://m.me/acmeincsupport?ref=${encode_message}`;
    let request_body = {
        "message": message_body
    };
    request({
        "uri": `https://graph.facebook.com/v2.12/${comment_id}/private_replies`,
        "qs": {"access_token": ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res) => {
        if (!err) {
            console.log("Private reply sent");
        }
    });
}

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
    console.log(req);
    const VERIFY_TOKEN = "TOKEN";

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = {"text": "Thanks!"}
    } else if (payload === 'no') {
        response = {"text": "Oops, try sending another image."}
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}