import * as log from "N/log";
import * as xml from "N/xml";
import {Stripe} from "../../StripeAPI/Stripe";

export const createWebhookEndpoint = (options: CreateWebhookEndpointOptions): void => {
    let createResponse = null;
    try {
        log.debug('createWebhookEndpoint options', options);

        const enabledEvents = ['charge.succeeded', 'charge.failed', 'payment_intent.succeeded', 'payment_intent.payment_failed'];

        const params: any = {
            url: options.url,
            description: 'Stripe Netsuite Webhook',
            enabled_events: enabledEvents,

        };


        log.debug('params', params);
        createResponse = options.stripe.API.createApiRequest(params, 'webhook', 'v1/webhook_endpoints');
        log.debug('createResponse', createResponse);

    } catch (err) {


    }
    if (createResponse?.id) {
        options.Success(createResponse);
    } else {
        options.Failed(createResponse);

    }
};

interface CreateWebhookEndpointOptions {
    url: string;
    stripe: Stripe;
    Success(webhook_endpoint: any): void;
    Failed(response:any): void;
}
