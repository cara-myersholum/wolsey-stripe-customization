/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */

import * as search from 'N/search';
import * as log from 'N/log';
import {stringToObject} from '../../Utils/StringToObject';
import {objectCleaner} from '../../Utils/ObjectCleaner';
import {Stripe} from '../../StripeAPI/Stripe';
import {getAccountId} from "../../Utils/Common";

export const getCustomerMapping = (options: CustomerMappingOptions): void => {

    let customer: any = {};

    if (options.netsuiteId > 0) {
        const entityMappingSearch = search.load({id: 'customsearch_mhi_stripe_entity_map'});

        entityMappingSearch.filters.push(search.createFilter({
            name: 'internalidnumber',
            operator: search.Operator.EQUALTO,
            values: options.netsuiteId
        }));

        entityMappingSearch.run().each(result => {

            result.columns.forEach(column => {
                const [path, valueType] = column.label.split('_mode');
                stringToObject(path, valueType === 'text' && result.getText(column) ? result.getText(column) : result.getValue(column), customer);
            });

            if (customer.phone) {
                customer.phone = `${customer.phone}`.substring(0, 19);
            }

            if (customer.shipping?.address) {
                customer.shipping.phone = `${customer.shipping?.phone}`.substring(0, 19);
            }

            if (!customer.metadata) {
                customer.metadata = {};
            }

            customer.metadata.netsuite_customer_id = `${result.id}`;
            customer.metadata.netsuite_entity = 'customer';
            customer.metadata.netsuite_link = `https://${getAccountId()}.app.netsuite.com/app/common/entity/custjob.nl?id=${result.id}`;
            customer.metadata.netsuite_allow_integration = true;
            return false;
        });
    }

    if (Object.keys(customer).length > 0) {
        customer =  objectCleaner(customer);
        log.debug('-- customer --', customer);
        if (Object.keys(customer.shipping?.address).length === 0) {

            delete customer.shipping;
        }
        options.Found(customer);
    } else {
        options.NotFound();
    }
};

export const upsertCustomer = (options: UpsertCustomerOptions): void => {
    let customerStripeId = null; // stripe customer id
    log.debug('upsertCustomer options', options);

    let upsertCustomerResponse = null;

    getCustomerStripeId({
        netsuiteId: options.netsuiteId,
        netsuiteStripeId: options.netsuiteStripeId,
        stripe: options.stripe,
        Found: (stripeId) => {

            customerStripeId = stripeId;

        },
        NotFound: () => {

            if (options.stripe.BUNDLESCONFIGURATION.PAYMENTLINK_CUSTOMERCREATIONENABLED) {
                // Create the customer
                getCustomerMapping({
                    netsuiteId: options.netsuiteId,
                    Found: customer => {
                        // Create the customer
                        upsertCustomerResponse = options.stripe.API.createApiRequest(customer, 'create', 'v1/customers', { "Idempotency-Key": `cus${options.netsuiteId}` });
                        log.debug('upsertCustomerResponse create', upsertCustomerResponse);
                        if (upsertCustomerResponse?.id) {
                            customerStripeId = upsertCustomerResponse.id;
                        }
                    },
                    NotFound: () => {
                        // Nothing to do here.
                    }
                });
            }
        }
    });


    log.debug('Customer Id', customerStripeId);

    if (customerStripeId) {
        options.Found(customerStripeId);
    } else {
        options.NotFound();
    }
};

export const getCustomerStripeId = (options: GetCustomerStripeIdOptions): void => {
    let stripeId, defaultPaymentSource = null; // stripe customer id
    let customer = null;
    let searchResponse = null;
    let params = {};

    if (options.netsuiteStripeId) {
        params = {id: options.netsuiteStripeId};
        searchResponse = options.stripe.API.createApiRequest(params, 'get', 'v1/customers');
    }
    if (!searchResponse) {
        searchResponse = options.stripe.API.createApiRequest({query: `metadata[\'netsuite_customer_id\']:\'${options.netsuiteId}\' OR metadata[\'netsuite_id\']:\'${options.netsuiteId}\'` }, 'search', 'v1/customers');

        if (searchResponse.data?.length > 0) {

            searchResponse.data.forEach(data => {

                if (data?.invoice_settings?.default_payment_method || data?.default_source) {
                    customer = data;
                }
            });

            if (!customer) {
                customer = searchResponse.data.pop();
            }

        }

    }

    if (!customer) {
        searchResponse = options.stripe.API.createApiRequest({query: `metadata[\'netsuite_customer_id\']:\'${options.netsuiteId}\'` }, 'search', 'v1/customers');

        if (searchResponse.data?.length > 0) {

            searchResponse.data.forEach(data => {

                if (data?.invoice_settings?.default_payment_method || data?.default_source) {
                    customer = data;
                }
            });

            if (!customer) {
                customer = searchResponse.data.pop();
            }
        }

    }

    log.debug('searchResponse: ', searchResponse);

    // If it has search response
    if (customer?.id) {
        stripeId = customer.id;
        defaultPaymentSource = customer?.invoice_settings?.default_payment_method || customer?.default_source;
    }

    if (stripeId) {
        options.Found(stripeId, defaultPaymentSource);
    } else {
        options.NotFound();
    }
};

export const getAllPaymentMethods = (options: GetAllPaymentMethodsOptions): void => {
    let paymentMethodsResponse = null;
    let paymentMethods = [];
    try {

        getCustomerStripeId({
            netsuiteId: options.netsuiteId,
            netsuiteStripeId: options.netsuiteStripeId,
            stripe: options.stripe,
            Found: (stripeId, defaultSource) => {

                paymentMethodsResponse = options.stripe.API.createApiRequest({
                    customer: stripeId
                }, 'list', 'v1/payment_methods');

                if (paymentMethodsResponse && paymentMethodsResponse?.data.length > 0) {
                    paymentMethods = [...paymentMethods, ...paymentMethodsResponse.data.sort((a, b) => a.created < b.created)];
                }

                // Filter out those that has unique id
                paymentMethods = paymentMethods.filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i);

                for(let i = 0; i < paymentMethods.length; i++) {

                    if (paymentMethods[i].id === defaultSource) {
                        paymentMethods[i].default = true;
                    }
                }

            },
            NotFound: () => {
            }
        });


    } catch (err) {
        log.error('Error on PaymentMethods', err);

    }

    log.debug('paymentMethods', paymentMethods);
    if (paymentMethods.length > 0) {
        options.Found(paymentMethods);
    } else {
        options.NotFound();
    }
}

export const getPaymentMethod = (options: GetPaymentMethodOptions): void => {
    let paymentMethodsResponse = null;

    try {

        paymentMethodsResponse = options.stripe.API.createApiRequest({
            customer: options.netsuiteStripeId,
            id: options.paymentMethod,
        }, 'get', 'v1/payment_methods');


    } catch (err) {
        log.error('Error on paymentMethodsResponse', err);

    }

    if (paymentMethodsResponse?.id) {
        options.Found(paymentMethodsResponse);
    } else {
        options.NotFound();
    }
}

interface GetAllPaymentMethodsOptions {
    netsuiteId: number;
    netsuiteStripeId: string;
    stripe: Stripe;
    Found(paymentMethods: any[]): void;
    NotFound(): void;
}


interface GetRecentPaymentMethodOptions {
    customerStripeId: string;
    stripe: Stripe;
    Found(recentPaymentMethodId: string): void;
    NotFound(): void;
}
interface GetPaymentMethodOptions {
    netsuiteStripeId: string;
    netsuiteId?: number;
    paymentMethod: string;
    stripe: Stripe;
    Found(paymentMethod: any): void;
    NotFound(): void;
}


interface CustomerMappingOptions {
    netsuiteId: number;
    Found(customer: any): void;
    NotFound(): void;
}
interface UpsertCustomerOptions {
    netsuiteId: number;
    netsuiteStripeId: string;
    stripe: Stripe;
    Found(stripeId: string): void;
    NotFound(): void;
}

interface GetCustomerStripeIdOptions {
    netsuiteId: number;
    netsuiteStripeId?: string;
    stripe: Stripe;
    Found(stripeId: string, defaultSource: string): void;
    NotFound(): void;
}
