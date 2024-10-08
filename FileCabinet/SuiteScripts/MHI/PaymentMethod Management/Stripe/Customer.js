/**
 * @copyright 2022 Myers-Holum Inc.
 *
 * @NApiVersion 2.1
 */
define(["require", "exports", "N/search", "N/log", "../../Utils/StringToObject", "../../Utils/ObjectCleaner", "../../Utils/Common"], function (require, exports, search, log, StringToObject_1, ObjectCleaner_1, Common_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCustomersData = exports.getCustomers = exports.getPaymentMethods = exports.getCustomerStripeId = exports.upsertCustomer = exports.getCustomerMapping = void 0;
    const getCustomerMapping = (options) => {
        var _a;
        let customer = {};
        if (options.netsuiteId > 0) {
            const entityMappingSearch = search.load({ id: 'customsearch_mhi_stripe_entity_map' });
            entityMappingSearch.filters.push(search.createFilter({
                name: 'internalidnumber',
                operator: search.Operator.EQUALTO,
                values: options.netsuiteId
            }));
            entityMappingSearch.run().each(result => {
                var _a, _b;
                result.columns.forEach(column => {
                    const [path, valueType] = column.label.split('_mode');
                    (0, StringToObject_1.stringToObject)(path, valueType === 'text' && result.getText(column) ? result.getText(column) : result.getValue(column), customer);
                });
                if (customer.phone) {
                    customer.phone = `${customer.phone}`.substring(0, 19);
                }
                if ((_a = customer.shipping) === null || _a === void 0 ? void 0 : _a.address) {
                    customer.shipping.phone = `${(_b = customer.shipping) === null || _b === void 0 ? void 0 : _b.phone}`.substring(0, 19);
                }
                if (!customer.metadata) {
                    customer.metadata = {};
                }
                customer.metadata.netsuite_customer_id = `${result.id}`;
                customer.metadata.netsuite_entity = 'customer';
                customer.metadata.netsuite_link = `https://${(0, Common_1.getAccountId)()}.app.netsuite.com/app/common/entity/custjob.nl?id=${result.id}`;
                customer.metadata.netsuite_allow_integration = true;
                return false;
            });
        }
        if (Object.keys(customer).length > 0) {
            customer = (0, ObjectCleaner_1.objectCleaner)(customer);
            log.debug('-- customer --', customer);
            if (Object.keys((_a = customer.shipping) === null || _a === void 0 ? void 0 : _a.address).length === 0) {
                delete customer.shipping;
            }
            options.Found(customer);
        }
        else {
            options.NotFound();
        }
    };
    exports.getCustomerMapping = getCustomerMapping;
    const upsertCustomer = (options) => {
        let customerStripeId = null; // stripe customer id
        log.debug('upsertCustomer options', options);
        let upsertCustomerResponse = null;
        (0, exports.getCustomerStripeId)({
            netsuiteId: options.netsuiteId,
            netsuiteStripeId: options.netsuiteStripeId,
            stripe: options.stripe,
            Found: (stripeId) => {
                customerStripeId = stripeId;
            },
            NotFound: () => {
                if (options.stripe.BUNDLESCONFIGURATION.PAYMENTMETHODMANAGEMENT_CUSTOMERCREATIONENABLED) {
                    // Create the customer
                    (0, exports.getCustomerMapping)({
                        netsuiteId: options.netsuiteId,
                        Found: customer => {
                            // Create the customer
                            upsertCustomerResponse = options.stripe.API.createApiRequest(customer, 'create', 'v1/customers', { 'Idempotency-Key': `cus${options.netsuiteId}` });
                            log.debug('upsertCustomerResponse create', upsertCustomerResponse);
                            if (upsertCustomerResponse === null || upsertCustomerResponse === void 0 ? void 0 : upsertCustomerResponse.id) {
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
        }
        else {
            options.NotFound();
        }
    };
    exports.upsertCustomer = upsertCustomer;
    const getCustomerStripeId = (options) => {
        var _a, _b;
        let stripeId, defaultPaymentSource = null; // stripe customer id
        let customer = null;
        let searchResponse = null;
        let params = {};
        if (options.netsuiteStripeId) {
            params = { id: options.netsuiteStripeId };
            searchResponse = options.stripe.API.createApiRequest(params, 'get', 'v1/customers');
        }
        if (!searchResponse) {
            searchResponse = options.stripe.API.createApiRequest({ query: `metadata[\'netsuite_customer_id\']:\'${options.netsuiteId}\' OR metadata[\'netsuite_id\']:\'${options.netsuiteId}\'` }, 'search', 'v1/customers');
            if (((_a = searchResponse.data) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                searchResponse.data.forEach(data => {
                    if (data.invoice_settings.default_payment_method || data.default_source) {
                        customer = data;
                    }
                });
                if (!customer) {
                    customer = searchResponse.data.pop();
                }
            }
        }
        if (!customer) {
            searchResponse = options.stripe.API.createApiRequest({ query: `metadata[\'netsuite_customer_id\']:\'${options.netsuiteId}\'` }, 'search', 'v1/customers');
            if (((_b = searchResponse.data) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                searchResponse.data.forEach(data => {
                    if (data.invoice_settings.default_payment_method || data.default_source) {
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
        if (customer === null || customer === void 0 ? void 0 : customer.id) {
            stripeId = customer.id;
            defaultPaymentSource = customer.invoice_settings.default_payment_method || customer.default_source;
        }
        if (stripeId) {
            options.Found(stripeId, defaultPaymentSource);
        }
        else {
            options.NotFound();
        }
    };
    exports.getCustomerStripeId = getCustomerStripeId;
    const getPaymentMethods = (options) => {
        let paymentMethodsResponse = null;
        let paymentMethods = [];
        try {
            (0, exports.getCustomerStripeId)({
                netsuiteId: options.netsuiteId,
                netsuiteStripeId: options.netsuiteStripeId,
                stripe: options.stripe,
                Found: (stripeId, defaultSource) => {
                    paymentMethodsResponse = options.stripe.API.createApiRequest({
                        customer: stripeId
                    }, 'list', 'v1/payment_methods');
                    if (paymentMethodsResponse && (paymentMethodsResponse === null || paymentMethodsResponse === void 0 ? void 0 : paymentMethodsResponse.data.length) > 0) {
                        paymentMethods = [...paymentMethods, ...paymentMethodsResponse.data.sort((a, b) => a.created < b.created)];
                    }
                    // Filter out those that has unique id
                    paymentMethods = paymentMethods.filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i);
                    for (let i = 0; i < paymentMethods.length; i++) {
                        if (paymentMethods[i].id === defaultSource) {
                            paymentMethods[i].default = true;
                        }
                    }
                },
                NotFound: () => {
                }
            });
        }
        catch (err) {
            log.error('Error on PaymentMethods', err);
        }
        log.debug('paymentMethods', paymentMethods);
        if (paymentMethods.length > 0) {
            options.Found(paymentMethods);
        }
        else {
            options.NotFound();
        }
    };
    exports.getPaymentMethods = getPaymentMethods;
    const getCustomers = (options) => {
        let customers = [];
        try {
            customers = (0, exports.getCustomersData)(options, [], 1);
        }
        catch (err) {
            log.error('Error on getCustomers', err);
        }
        if (customers.length > 0) {
            options.Found(customers);
        }
        else {
            options.NotFound();
        }
    };
    exports.getCustomers = getCustomers;
    const getCustomersData = (options, charges, pageId) => {
        var _a;
        const stripeResponse = options.stripe.API.createApiRequest(options.params, 'search', 'v1/customers');
        if (((_a = stripeResponse.data) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            charges = charges.concat(stripeResponse.data);
            if (stripeResponse.has_more) {
                pageId = +pageId + 1;
                options.params['page'] = pageId;
                (0, exports.getCustomersData)(options, charges);
            }
        }
        return charges;
    };
    exports.getCustomersData = getCustomersData;
});
