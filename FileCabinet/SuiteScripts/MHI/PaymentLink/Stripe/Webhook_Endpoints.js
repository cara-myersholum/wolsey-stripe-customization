define(["require", "exports", "N/log"], function (require, exports, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createWebhookEndpoint = void 0;
    const createWebhookEndpoint = (options) => {
        let createResponse = null;
        try {
            log.debug('createWebhookEndpoint options', options);
            const enabledEvents = ['charge.succeeded', 'charge.failed', 'payment_intent.succeeded', 'payment_intent.payment_failed'];
            const params = {
                url: options.url,
                description: 'Stripe Netsuite Webhook',
                enabled_events: enabledEvents,
            };
            log.debug('params', params);
            createResponse = options.stripe.API.createApiRequest(params, 'webhook', 'v1/webhook_endpoints');
            log.debug('createResponse', createResponse);
        }
        catch (err) {
        }
        if (createResponse === null || createResponse === void 0 ? void 0 : createResponse.id) {
            options.Success(createResponse);
        }
        else {
            options.Failed(createResponse);
        }
    };
    exports.createWebhookEndpoint = createWebhookEndpoint;
});
