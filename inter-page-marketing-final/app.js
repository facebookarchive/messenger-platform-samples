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
    FB = require('fb'),
    // TODO: Is there a better way?
    current_post = "",
    app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {
        body.entry.forEach(function (entry) {
            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

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

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

app.get('/parsecomments', (req, res) => {
    FB.setAccessToken("EAACuCRnVclUBAFAb1iLVNEhUic1HJ45pxgc48psoq240a65gIfF6reDR91eo8V98eZCFeGEWZAz3umKTd9ZAcZCjL2Xd7QxASaDKTqxWbuMGHEeYRc6n4stDSiBmNZAoSGQKFZArHmj57j0ZA5ncsJ098QI9rJLohyjRX4XvuE65AL5ENq3hfZC2NiiX3kCSQlmAyfEBu54yBwZDZD");
    FB.api('186259632136572_186732172089318/comments', function (res) {
        if (!res || res.error) {
            console.log(!res ? 'error occurred' : res.error);
            return;
        } else {
            let comments = res.data;
            comments.forEach(function (comment) {
                console.log(comment);
                // TODO: What about multiple messages?
                current_post = comment.id;
                let body = "Please share your experiences, type 'share'.";
                FB.api(`/${comment.id}/private_replies`, 'post', {message: body}, function (res) {
                    if (!res || res.error) {
                        console.log(!res ? 'error occurred' : res.error);
                        return;
                    }
                    console.log('Post Id: ' + res.id);
                });
            });
        }
    });
});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

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

function handleMessage(sender_psid, received_message) {
    let response;

    if (received_message.text) {
        switch (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase()) {
            case "share":
                response = shareExperiences(sender_psid);
                break;
            default:
                response = {
                    "text": `You sent the message: "${received_message.text}".`
                };
                break;
        }
    } else {
        response = {
            "text": `Sorry, I don't understand what you mean.`
        }
    }

    // Send the response message
    callSendAPI(sender_psid, response);
}

function shareExperiences(sender_psid) {
    console.log(current_post);
    let body = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: [
                    {
                        title: "Breaking News: Record Thunderstorms",
                        // subtitle: "The local area is due for record thunderstorms over the weekend.",
                        // image_url: "https://thechangreport.com/img/lightning.png",
                        buttons: [
                            {
                                type: "element_share",
                                share_contents: {
                                    attachment: {
                                        type: "template",
                                        payload: {
                                            template_type: "generic",
                                            elements: [
                                                {
                                                    title: "I took the hat quiz",
                                                    subtitle: "My result: Fez",
                                                    image_url: "https://bot.peters-hats.com/img/hats/fez.jpg",
                                                    default_action: {
                                                        type: "web_url",
                                                        url: "http://m.me/petershats?ref=invited_by_24601"
                                                    },
                                                    buttons: [
                                                        {
                                                            type: "web_url",
                                                            url: "http://m.me/petershats?ref=invited_by_24601",
                                                            title: "Take Quiz"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };
    callSendAPI(sender_psid, body);
}

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
        "qs": {"access_token": "EAACuCRnVclUBAFAb1iLVNEhUic1HJ45pxgc48psoq240a65gIfF6reDR91eo8V98eZCFeGEWZAz3umKTd9ZAcZCjL2Xd7QxASaDKTqxWbuMGHEeYRc6n4stDSiBmNZAoSGQKFZArHmj57j0ZA5ncsJ098QI9rJLohyjRX4XvuE65AL5ENq3hfZC2NiiX3kCSQlmAyfEBu54yBwZDZD"},
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