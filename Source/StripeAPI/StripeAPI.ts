    /**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

import * as https from 'N/https';
import * as log from 'N/log';
import * as search from 'N/search';
import {Stripe_Setup} from '../Record/Stripe_Setup';

export class StripeAPI {
    private readonly BASE_DOMAIN: string;
    private readonly greatOrEqlString: string;

    constructor(private readonly configuration?: Stripe_Setup) {
        this.BASE_DOMAIN = 'https://api.stripe.com/';
    }

    public camelToSnakeCase = str => str
        .split(/(?=[A-Z])/)
        .join('_')
        .toLowerCase();

    public createApiRequest = (params, type, endpoint, optionalHeaders?) => {
        try {
            const STRIPE_API_KEY = this.configuration.secret;

            if (STRIPE_API_KEY) {
                const headers = {Authorization: `Bearer ${STRIPE_API_KEY}`, 'Stripe-Version': '2022-08-01'};

                if (optionalHeaders) {
                    Object.keys(optionalHeaders).forEach(key => {
                        headers[key] = optionalHeaders[key];
                    });

                }

                const keys = Object.keys(params);
                let url = this.BASE_DOMAIN + endpoint;
                let response;

                switch (type) {
                    case 'create':
                        url = this.formatParameters(url, params, keys);
                        log.debug('url', url);
                        response = https.post({
                                url: url,
                                headers: headers,
                                body: null
                            }
                        );
                        break;
                    case 'webhook':

                        const webhookURL = params.url;
                        delete params.url;
                        url = this.formatParameters(url, params, keys);

                        response = https.post({
                            url: url,
                            headers: headers,
                            body: {url: webhookURL}
                        });
                        break;
                    case 'list':
                        url = this.formatParameters(url, params, keys);
                        response = https.get({
                            url,
                            headers
                        });

                        break;
                    case 'search':
                        url += `/search`;
                        url = this.formatParameters(url, params, keys);
                        response = https.get({
                            url,
                            headers
                        });

                        break;
                    case 'update':
                        url += `/${params.id}`;
                        delete params.id;
                        url = this.formatParameters(url, params, keys);

                        log.debug('url', url);
                        response = https.post({
                            url: url,
                            headers: headers,
                            body: null
                        });
                        break;
                    case 'detach':
                        url += `/${params.id}/detach`;

                        response = https.post({
                            url: url,
                            headers: headers,
                            body: null
                        });
                        break;
                    case 'get':
                        url += `/${params.id}`;
                        response = https.get({
                            url,
                            headers
                        });
                        break;
                    case 'getfilecontent':
                        url = params.url;
                        log.debug(`url`, url);
                        response = https.get({
                            url,
                            headers
                        });
                        log.debug(`response.body`, response.body);
                        return response.body;

                        break;
                    case 'delete':
                        url += `/${params.id}`;
                        response = https.delete({
                            url,
                            headers
                        });
                        break;
                    case 'capture':
                        url += `/${params.id}/capture`;
                        delete params.id;
                        url = this.formatParameters(url, params, keys);
                        log.debug('url', url);
                        response = https.post({
                            url: url,
                            headers: headers,
                            body: null
                        });
                        break;
                    case 'confirm':
                        url += `/${params.id}/confirm`;
                        delete params.id;
                        url = this.formatParameters(url, params, keys);
                        log.debug('url', url);
                        response = https.post({
                            url: url,
                            headers: headers,
                            body: null
                        });
                        break;
                    case 'finalize':
                        url += `${params.id}/finalize`;

                        if (params.auto_advance) {
                            url += `?auto_advance=${params.auto_advance}`;
                        }

                        response = https.post({
                            url: url,
                            headers: headers,
                            body: null
                        });
                        break;
                    case 'void':
                        url += `${params.id}/void`;
                        response = https.post({
                            url,
                            headers,
                            body: null
                        });
                        break;
                    case 'list_balance':
                        url += `${params.id}/balance_transactions`;
                        response = https.get({
                            url,
                            headers
                        });
                        break;
                    case 'list_paymentmethod':
                        url = this.formatParameters(url, params, keys);

                        response = https.get({
                            url,
                            headers
                        });
                        break;
                    case 'list':
                        url = this.formatParameters(url, params, keys);

                        response = https.get({
                            url,
                            headers
                        });
                        break;
                    case 'failure_update':
                        url += `/${params.id}`;
                        delete params.id;
                        url = this.formatParameters(url, params, keys);
                        response = https.post({
                            url,
                            headers,
                            body: null
                        });

                    default:
                        break;

                }

                return JSON.parse(response.body);
            }
        } catch (err) {
            log.error('Error on createApiRequest', err)
        }
        return false;
    };

    public formatParameters = (url, params, keys) => {
        let newUrl = url;
        const hasAdded = false;
        if (params) {
            newUrl += `?${this.jsonToURLEncoded(params)}`;
        }
        return newUrl;
    };

    public jsonToURLEncoded = (element, key?, list?) => {
        if (!list) {
            list = [];
        }

        if (typeof(element) === 'object') {
            for (const idx in element) {
                this.jsonToURLEncoded(element[idx], key ? `${key}[${idx}]` : idx, list);
            }
        } else {
            if (key === 'email'){
                if ( element.indexOf('+') > 0 ) {
                    element = element.substr(0, element.indexOf('+')) + element.substr(element.indexOf('@'))
                }
            }
            list.push(`${key.toLowerCase()}=${element}`); // encodeURIComponent
        }

        return list.join('&');
    }

    public getUnixTime = time => {
        const today = new Date();
        let date = today;

        if (time === 'today') {
            return parseInt((date.getTime() / 1000).toFixed(0), 10);
        }

        if (time === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            date = yesterday;
        } else {
            date = time;
        }

        return parseInt((date.getTime() / 1000).toFixed(0), 10);
    };

    public getUTCTime = () => {
        const today = new Date();
        const offset = today.getTimezoneOffset() / 60;
        const hours = today.getHours();

        today.setHours(hours + offset);
        today.setMinutes(0);
        today.setSeconds(0);

        return today;
    };

    public listAllResults = (globalParams, globalArray, endpoint) => {
        const resultArray = globalArray;
        const {
            id, limit, created, type, account, isBalance, subsidiary, endingBefore
        } = globalParams;
        let { startingAfter } = globalParams;
        let shouldContinue = true;

        const upperParams = {
            limit,
            created,
            type,
            endingBefore,
            startingAfter,
            id
        };

        const iterateThroughPages = (params, resultArr) => {
            let allResults = resultArr;
            const reqType = isBalance ? 'list_balance' : 'list';

            while (shouldContinue) {
                const results = this.createApiRequest(params, reqType, endpoint);

                if (results && results.data) {
                    for (let i = 0; i < results.data.length; i += 1) {
                        const result = results.data[i];
                        allResults.push(result);
                    }

                    if (results.data.length < 100) {
                        shouldContinue = false;
                    } else {
                        startingAfter = results.data[results.data.length - 1].id;
                        const newParams = { startingAfter, created, type };
                        allResults = iterateThroughPages(newParams, allResults);
                    }
                } else {
                    shouldContinue = false;
                }
            }

            return allResults;
        };

        return iterateThroughPages(upperParams, resultArray);
    };

    public urlFormat = str => (str ? str.toString().replace(/[|&;$%@"<>()+,]/g, '') : '');

    private httpsGetRequest(options: GetRequestOptions) {
        const makeRequestOptions: MakeRequestOptions = <any>options;
        makeRequestOptions.method = https.Method.GET;
        this.makeRequest(makeRequestOptions);
    }

    private httpsDeleteRequest(options: DeleteRequestOptions) {
        const makeRequestOptions: MakeRequestOptions = <any>options;
        makeRequestOptions.method = https.Method.DELETE;
        this.makeRequest(makeRequestOptions);
    }

    private httpsPostRequest(options: PostRequestOptions) {
        const makeRequestOptions: MakeRequestOptions = <any>options;
        makeRequestOptions.method = https.Method.POST;
        this.makeRequest(makeRequestOptions);
    }

    private makeRequest(options: MakeRequestOptions) {
        let clientResponse: https.ClientResponse = null;
        const requestOptions: https.RequestOptions = {
            method: options.method,
            url: `https://${this.BASE_DOMAIN}/${options.endpoint}`
        };

        requestOptions.headers = options.headers || {};

        if (options.payload) {
            requestOptions.body = JSON.stringify(options.payload);
        }

        try {
            clientResponse = https.request(requestOptions);
            switch (clientResponse.code) {
                case 200: // Ok
                    if (options.OK) {
                        options.OK(clientResponse);
                    }
                    break;

                case 400: // Bad Request
                    if (options.BadRequest) {
                        options.BadRequest(clientResponse);
                    } else {
                        options.Failed(clientResponse);
                    }
                    break;

                case 401: // Unauthorized
                    if (options.Unauthorized) {
                        options.Unauthorized(clientResponse);
                    } else {
                        options.Failed(clientResponse);
                    }
                    break;

                case 402: // Request Failed
                    if (options.RequestFailed) {
                        options.RequestFailed(clientResponse);
                    } else {
                        options.Failed(clientResponse);
                    }
                    break;

                case 403: // Forbidden
                    if (options.Forbidden) {
                        options.Forbidden(clientResponse);
                    } else {
                        options.Failed(clientResponse);
                    }
                    break;

                case 404: // Not Found
                    if (options.NotFound) {
                        options.NotFound(clientResponse);
                    } else {
                        options.Failed(clientResponse);
                    }
                    break;

                case 409: // Conflict
                    if (options.Conflict) {
                        options.Conflict(clientResponse);
                    } else {
                        options.Failed(clientResponse);
                    }
                    break;

                case 429: // Too Many Requests
                    if (options.TooManyRequests) {
                        options.TooManyRequests(clientResponse);
                    } else {
                        options.Failed(clientResponse);
                    }
                    break;

                case 500: case 502: case 503: case 504: // Server Errors
                    if (options.ServerError) {
                        options.ServerError(clientResponse);
                    } else {
                        options.Failed(clientResponse);
                    }
                    break;

                default: // Unknown response
                    options.Failed(clientResponse);
                    break;
            }

        } catch (e) {
            options.retryCount = options.retryCount || 0;
            if (options.retryCount <= 5) {
                options.retryCount = options.retryCount + 1;
                this.makeRequest(options);
            } else {
                log.debug('makeRequest', e);
                options.Failed(clientResponse);
            }
        }
    }
}

interface BaseRequestOptions {

    headers?: any;
    endpoint?: string;
    params?: any;
    keys?: any;
    Failed(clientResponse: https.ClientResponse): void;
}

interface PostRequestOptions extends BaseRequestOptions {
    payload: any;
    Created(clientResponse: https.ClientResponse): void;
}

interface GetRequestOptions extends BaseRequestOptions {
    OK(clientResponse: https.ClientResponse): void;
}

interface DeleteRequestOptions extends BaseRequestOptions {
    OK(): void;
}

interface MakeRequestOptions extends BaseRequestOptions {
    method: https.Method;
    payload?: any;
    retryCount?: number;

    OK?(clientResponse: https.ClientResponse): void;
    BadRequest?(clientResponse: https.ClientResponse): void;
    Unauthorized?(clientResponse: https.ClientResponse): void;
    RequestFailed?(clientResponse: https.ClientResponse): void;
    Forbidden?(clientResponse: https.ClientResponse): void;
    NotFound?(clientResponse: https.ClientResponse): void;
    Conflict?(clientResponse: https.ClientResponse): void;
    TooManyRequests?(clientResponse: https.ClientResponse): void;
    ServerError?(clientResponse: https.ClientResponse): void;
}
